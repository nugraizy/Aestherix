import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { BOT_NAME } from '../../core/constants.js';

import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { komikcast } from '../../utils/index.js';
import { randomChar } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

const searchSessions = new Cache();

const formatMangaCaption = (manga) => {
	const lines = [`Title : ${manga.title}`];

	if (manga.genres?.length) {
		lines.push(`Genres : ${manga.genres.join(', ')}`);
	}

	if (manga.status) {
		lines.push(`Status : ${manga.status}`);
	}

	if (manga.authors?.length) {
		lines.push(`Authors : ${manga.authors.join(', ')}`);
	}

	return lines.join('\n');
};

function sendResult(state, from, message, client, ctx) {
	const { items, currentIndex, sessionId } = state;
	const manga = items[currentIndex];
	const isLast = currentIndex + 1 >= items.length;
	const body = `${'Komikcast Search'.formatHeaders()}\n\n${formatMangaCaption(manga).formatForm()}\n\nResult ${currentIndex + 1} of ${items.length}\nSlug : ${manga.slug}`;

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
			builder.button.reply({ display: '📖 Chapters', id: cmdId('kcch', manga.slug, ctx) }),
			builder.button.reply({ display: '📋 Detail', id: cmdId('kcdetail', manga.slug, ctx) }),
			builder.button.reply({ display: 'Next', id: cmdId('kc', 'next ' + sessionId, ctx) })
		);
	} else {
		builder.buttons(
			builder.button.reply({ display: '📖 Chapters', id: cmdId('kcch', manga.slug, ctx) }),
			builder.button.reply({ display: '📋 Detail', id: cmdId('kcdetail', manga.slug, ctx) })
		);
	}

	return builder.send();
}

export default defineCommand({
	name: 'komikcastsearch',
	minifiedDescription: 'Search Komikcast',
	description: 'Search comics on Komikcast.',
	usage: '!komikcastsearch `<query>`',
	aliases: ['komikcast', 'komik', 'kc', 'kcsearch'],
	category: 'Search',
	cooldown: 5,
	limit: 5,
	status: 'enable',
	async run({ query, from, message, prefix }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.queryRequired, message);
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

		const result = await komikcast.search(query);

		if (!result.items.length) {
			return await wait.update('No results found. Try a different query.');
		}

		const sessionId = randomChar('abcdefghijklmnopqrstuvwxyz0123456789', 8);
		const items = result.items.slice(0, 10);
		const state = { items, currentIndex: 0, sessionId };

		searchSessions.set(sessionId, state);

		await wait.update(`Found ${result.items.length} result(s).`);
		await sendResult(state, from, message, client, { prefix });
	}
});
