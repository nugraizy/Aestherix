import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { BOT_NAME } from '../../core/constants.js';

import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { comix } from '../../utils/index.js';
import { randomChar } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';



const searchSessions = new Cache();

/**
 * @param {import('../../utils/comix/types/comix').ComixManga} manga
 * @returns {string}
 */
const formatMangaCaption = (manga) => {
	const lines = [
		`Title : ${manga.title}`,
		`Type : ${manga.type || 'n/a'}`,
		`Status : ${manga.status || 'n/a'}`,
		`Rating : ${manga.rating ? `⭐ ${manga.rating}` : 'n/a'}`,
		`Genres : ${manga.genres.length ? manga.genres.join(', ') : 'n/a'}`
	];

	if (manga.altTitles?.length) {
		lines.push(`Alt Titles : ${manga.altTitles.slice(0, 3).join(', ')}`);
	}

	return lines.join('\n');
};

function sendResult(state, from, message, client, ctx) {
	const { items, currentIndex, sessionId } = state;
	const manga = items[currentIndex];
	const caption = formatMangaCaption(manga);
	const isLast = currentIndex + 1 >= items.length;
	const body = `${'Comix Search'.formatHeaders()}\n\n${caption.formatForm()}\n\nResult ${currentIndex + 1} of ${items.length}\nID : ${manga.id}`;

	const builder = new client.TemplateBuilder.Native();

	builder
		.destination(from)
		.body(body)
		.footer('Powered by ' + BOT_NAME);

	if (manga.poster) {
		builder.header('image', manga.poster);
	}

	if (!isLast) {
		builder.buttons(
			builder.button.reply({ display: '📖 Chapters', id: cmdId('cxch', manga.id, ctx) }),
			builder.button.reply({ display: '📋 Detail', id: cmdId('cxdetail', manga.id, ctx) }),
			builder.button.reply({ display: 'Next', id: cmdId('cx', 'next ' + sessionId, ctx) })
		);
	} else {
		builder.buttons(
			builder.button.reply({ display: '📖 Chapters', id: cmdId('cxch', manga.id, ctx) }),
			builder.button.reply({ display: '📋 Detail', id: cmdId('cxdetail', manga.id, ctx) })
		);
	}

	return builder.send();
}

export default defineCommand({
	name: 'comixsearch',
	minifiedDescription: 'Search Comix',
	description: 'Search manga, manhwa, or manhua on Comix.',
	usage: '!comixsearch `<query>`',
	aliases: ['comix', 'cx', 'cxsearch'],
	category: 'Search',
	cooldown: 5,
	limit: 5,
	status: 'enable',
	async run({ query, from, message, prefix }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(
				from,
				'Please provide a search query.\n\nTips:\n• author:name — search by author\n• artist:name — search by artist',
				message
			);
		}

		if (query.startsWith('next ')) {
			const sessionId = query.slice(5);
			const cached = searchSessions.get(sessionId);

			if (!cached) {
				return await client.reply(from, L.errors.sessionExpired, message);
			}

			cached.currentIndex++;

			if (cached.currentIndex >= cached.items.length) {
				searchSessions.delete(sessionId);
				return await client.reply(from, L.info.noMoreResults, message);
			}

			return await sendResult(cached, from, message, client, { prefix });
		}

		const wait = await client.waitMessage(from, L.success.searching, message);

		const filters = {};
		let searchQuery = query;

		const authorMatch = searchQuery.match(/\bauthor:([^\s]+)/i);
		const artistMatch = searchQuery.match(/\bartist:([^\s]+)/i);

		if (authorMatch) {
			searchQuery = searchQuery.replace(authorMatch[0], '').trim();
			const authorIds = await comix.resolveTagIds('author', authorMatch[1].replace(/,/g, ', '));

			if (authorIds.length) {
				filters.authors = authorIds;
			}
		}

		if (artistMatch) {
			searchQuery = searchQuery.replace(artistMatch[0], '').trim();
			const artistIds = await comix.resolveTagIds('artist', artistMatch[1].replace(/,/g, ', '));

			if (artistIds.length) {
				filters.artists = artistIds;
			}
		}

		const hasFilters = filters.authors || filters.artists;
		const options = { limit: 10, excludeNsfw: true };

		if (hasFilters) {
			options.filters = filters;
		}

		const result = searchQuery ? await comix.search(searchQuery, options) : await comix.getComics(options);

		if (!result.items.length) {
			return await wait.update('No results found. Try a different query.');
		}

		const sessionId = randomChar('abcdefghijklmnopqrstuvwxyz0123456789', 8);
		const state = { items: result.items, currentIndex: 0, sessionId };

		searchSessions.set(sessionId, state);

		await wait.update(`Found ${result.items.length} result(s).`);
		await sendResult(state, from, message, client, { prefix });
	}
});
