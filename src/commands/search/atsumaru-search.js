import { BOT_NAME } from '../../core/constants.js';

import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { atsumaru } from '../../utils/atsumaru/index.js';
import { randomChar } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';


const searchSessions = new Cache();

const formatMangaCaption = (manga) => {
	const lines = [
		`Title : ${manga.title}`,
		`Type : ${manga.type || 'n/a'}`,
		`Status : ${manga.status || 'n/a'}`,
		`Rating : ${manga.rating ? `⭐ ${manga.rating.toFixed(1)}/10` : 'n/a'}`,
		`Authors : ${manga.authors.length ? manga.authors.join(', ') : 'n/a'}`,
		`Genres : ${manga.genres.length ? manga.genres.join(', ') : 'n/a'}`
	];

	if (manga.otherNames?.length) {
		lines.push(`Alt Titles : ${manga.otherNames.slice(0, 3).join(', ')}`);
	}

	return lines.join('\n');
};

function sendResult(state, from, message, client, ctx) {
	const { items, currentIndex, sessionId } = state;
	const manga = items[currentIndex];
	const caption = formatMangaCaption(manga);
	const isLast = currentIndex + 1 >= items.length;
	const body = `${'Atsumaru Search'.formatHeaders()}\n\n${caption.formatForm()}\n\nResult ${currentIndex + 1} of ${items.length}\nID : ${manga.id}`;

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
			builder.button.reply({ display: '📖 Chapters', id: cmdId('atch', manga.id, ctx) }),
			builder.button.reply({ display: '📋 Detail', id: cmdId('atdetail', manga.id, ctx) }),
			builder.button.reply({ display: 'Next', id: cmdId('at', 'next ' + sessionId, ctx) })
		);
	} else {
		builder.buttons(
			builder.button.reply({ display: '📖 Chapters', id: cmdId('atch', manga.id, ctx) }),
			builder.button.reply({ display: '📋 Detail', id: cmdId('atdetail', manga.id, ctx) })
		);
	}

	return builder.send();
}

export default defineCommand({
	name: 'atsumarusearch',
	minifiedDescription: 'Search Atsumaru',
	description: 'Search manga, manhwa, or manhua on Atsumaru.',
	usage: '!atsumarusearch `<query>`',
	aliases: ['atsumaru', 'at', 'atsearch'],
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

		const result = await atsumaru.search(query, { page: 1 });

		if (!result.items.length) {
			return await wait.update('No results found. Try a different query.');
		}

		const sessionId = randomChar('abcdefghijklmnopqrstuvwxyz0123456789', 8);
		const state = { items: result.items.slice(0, 10), currentIndex: 0, sessionId };

		searchSessions.set(sessionId, state);

		await wait.update(`Found ${result.items.length} result(s).`);
		await sendResult(state, from, message, client, { prefix });
	}
});
