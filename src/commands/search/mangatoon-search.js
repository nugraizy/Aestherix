import { BOT_NAME } from '../../core/constants.js';

import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { randomChar } from '../../utils/modules/index.js';
import { mangatoon } from '../../utils/mangatoon/index.js';
import { defineCommand } from '../_define.js';

const searchSessions = new Cache();

const formatMangaCaption = (manga) => {
	const lines = [`Title : ${manga.title}`];

	if (manga.genres?.length) {
		lines.push(`Genres : ${manga.genres.join(', ')}`);
	}

	return lines.join('\n');
};

function sendResult(state, from, message, client, ctx) {
	const { items, currentIndex, sessionId } = state;
	const manga = items[currentIndex];
	const isLast = currentIndex + 1 >= items.length;
	const body = `${'MangaToon Search'.formatHeaders()}\n\n${formatMangaCaption(manga).formatForm()}\n\nResult ${currentIndex + 1} of ${items.length}\nID : ${manga.id}`;

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
			builder.button.reply({ display: '📋 Detail', id: cmdId('mtdetail', manga.id, ctx) }),
			builder.button.reply({ display: '📖 Chapters', id: cmdId('mtch', manga.id, ctx) }),
			builder.button.reply({ display: 'Next', id: cmdId('mt', 'next ' + sessionId, ctx) })
		);
	} else {
		builder.buttons(
			builder.button.reply({ display: '📋 Detail', id: cmdId('mtdetail', manga.id, ctx) }),
			builder.button.reply({ display: '📖 Chapters', id: cmdId('mtch', manga.id, ctx) })
		);
	}

	return builder.send();
}

export default defineCommand({
	name: 'mangatoonsearch',
	minifiedDescription: 'Search MangaToon',
	description: 'Search manga/manhua on MangaToon.',
	usage: '!mangatoonsearch `<query>`',
	aliases: ['mangatoon', 'mt', 'mtsearch'],
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

		const result = await mangatoon.search(query);

		if (result.error) {
			return await wait.update(result.error);
		}

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
