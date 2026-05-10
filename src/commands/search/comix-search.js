import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { Comix } from '../../utils/index.js';
import { randomChar } from '../../utils/modules/index.js';

const comix = new Comix();

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
	const body = `${'Comix Search'.formatHeaders()}\n\n${caption.formatForm()}\n\nResult ${currentIndex + 1} of ${items.length}\nID : ${manga.id}`;

	const builder = new client.instance.TemplateBuilder.Native(client);

	builder
		.destination(from)
		.body(body)
		.footer('Powered by ' + __botName);

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

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
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
		if (!query) {
			return await client.instance.reply(from, 'Please provide a search query.', message);
		}

		if (query.startsWith('next ')) {
			const sessionId = query.slice(5);
			const cached = searchSessions.get(sessionId);

			if (!cached) {
				return await client.instance.reply(from, 'Session expired. Please search again.', message);
			}

			cached.currentIndex++;

			if (cached.currentIndex >= cached.items.length) {
				searchSessions.delete(sessionId);
				return await client.instance.reply(from, 'No more results.', message);
			}

			return await sendResult(cached, from, message, client, { prefix });
		}

		const wait = await client.instance.waitMessage(from, 'Searching...', message);

		const result = await comix.search(query, { limit: 10, excludeNsfw: true });

		if (!result.items.length) {
			return await wait.update('No results found. Try a different query.');
		}

		const sessionId = randomChar('abcdefghijklmnopqrstuvwxyz0123456789', 8);
		const state = { items: result.items, currentIndex: 0, sessionId };

		searchSessions.set(sessionId, state);

		await wait.update(`Found ${result.items.length} result(s).`);
		await sendResult(state, from, message, client, { prefix });
	}
};
