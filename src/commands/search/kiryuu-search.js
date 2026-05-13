import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { Kiryuu } from '../../utils/index.js';
import { randomChar } from '../../utils/modules/index.js';

const kiryuu = new Kiryuu();

const searchSessions = new Cache();

/**
 * @param {import('../../utils/kiryuu/types/kiryuu').KiryuuManga} manga
 * @returns {string}
 */
const formatMangaCaption = (manga) => {
	const lines = [
		`Title : ${manga.title}`,
		`Type : ${manga.type || 'n/a'}`,
		`Status : ${manga.status || 'n/a'}`,
		`Authors : ${manga.authors.length ? manga.authors.join(', ') : 'n/a'}`,
		`Artists : ${manga.artists.length ? manga.artists.join(', ') : 'n/a'}`,
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
	const body = `${'Kiryuu Search'.formatHeaders()}\n\n${caption.formatForm()}\n\nResult ${currentIndex + 1} of ${items.length}\nSlug : ${manga.slug}`;

	const builder = new client.TemplateBuilder.Native();

	builder
		.destination(from)
		.body(body)
		.footer('Powered by ' + __botName);

	if (manga.poster) {
		builder.header('image', manga.poster);
	}

	if (!isLast) {
		builder.buttons(
			builder.button.reply({ display: '📖 Chapters', id: cmdId('kych', manga.slug, ctx) }),
			builder.button.reply({ display: '📋 Detail', id: cmdId('kydetail', manga.slug, ctx) }),
			builder.button.reply({ display: 'Next', id: cmdId('ky', 'next ' + sessionId, ctx) })
		);
	} else {
		builder.buttons(
			builder.button.reply({ display: '📖 Chapters', id: cmdId('kych', manga.slug, ctx) }),
			builder.button.reply({ display: '📋 Detail', id: cmdId('kydetail', manga.slug, ctx) })
		);
	}

	return builder.send();
}

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'kiryuusearch',
	minifiedDescription: 'Search Kiryuu',
	description: 'Search manga, manhwa, or manhua on Kiryuu.',
	usage: '!kiryuusearch `<query>`',
	aliases: ['ky', 'kysearch', 'kiryuu'],
	category: 'Search',
	cooldown: 5,
	limit: 5,
	status: 'enable',
	async run({ query, from, message, prefix }, client) {
		if (!query) {
			return await client.reply(from, 'Please provide a search query.', message);
		}

		if (query.startsWith('next ')) {
			const sessionId = query.slice(5);
			const cached = searchSessions.get(sessionId);

			if (!cached) {
				return await client.reply(from, 'Session expired. Please search again.', message);
			}

			cached.currentIndex++;

			if (cached.currentIndex >= cached.items.length) {
				searchSessions.delete(sessionId);
				return await client.reply(from, 'No more results.', message);
			}

			return await sendResult(cached, from, message, client, { prefix });
		}

		const wait = await client.waitMessage(from, 'Searching...', message);

		const result = await kiryuu.searchManga(query, { limit: 10 });

		if (!result?.length) {
			return await wait.update('No results found. Try a different query.');
		}

		const sessionId = randomChar('abcdefghijklmnopqrstuvwxyz0123456789', 8);
		const state = { items: result, currentIndex: 0, sessionId };

		searchSessions.set(sessionId, state);

		await wait.update(`Found ${result.length} result(s).`);
		await sendResult(state, from, message, client, { prefix });
	}
};
