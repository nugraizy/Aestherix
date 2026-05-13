import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { Kiryuu } from '../../utils/index.js';
import { randomChar } from '../../utils/modules/index.js';

const kiryuu = new Kiryuu();

const CHAPTERS_PER_BATCH = 20;

const chapterSessions = new Cache();

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'kiryuuchapters',
	minifiedDescription: 'Kiryuu Chapters',
	description: 'List chapters of a manga/manhwa/manhua on Kiryuu.',
	usage: '!kiryuuchapters `<slug/id/url>`',
	aliases: ['kychapters', 'kych'],
	category: 'Search',
	cooldown: 5,
	limit: 5,
	status: 'enable',
	async run({ query, from, message, prefix }, client) {
		if (!query) {
			return await client.reply(from, 'Please provide a manga slug, ID, or Kiryuu URL.', message);
		}

		if (query.startsWith('next ')) {
			const sessionId = query.slice(5);
			const cached = chapterSessions.get(sessionId);

			if (!cached) {
				return await client.reply(from, 'Session expired. Please search again.', message);
			}

			cached.currentBatch++;
			return await sendBatch(cached, from, message, client, { prefix });
		}

		const wait = await client.waitMessage(from, 'Fetching chapters...', message);

		try {
			const manga = await kiryuu.getManga(query);
			const chaptersResult = await kiryuu.getChapters(manga);

			if (!chaptersResult.length) {
				return await wait.update('No chapters found for this manga.');
			}

			const allChapters = chaptersResult.reverse();
			const sessionId = randomChar('abcdefghijklmnopqrstuvwxyz0123456789', 8);
			const state = { allChapters, currentBatch: 0, sessionId, mangaTitle: manga.title };

			chapterSessions.set(sessionId, state);

			await wait.update(`${allChapters.length} chapter(s) found.`);
			await sendBatch(state, from, message, client, { prefix });
		} catch (error) {
			return await wait.update(`Error: ${error.message || 'Failed to fetch chapters.'}`);
		}
	}
};

async function sendBatch(state, from, message, client, ctx) {
	const { allChapters, currentBatch, sessionId, mangaTitle } = state;
	const start = currentBatch * CHAPTERS_PER_BATCH;
	const batch = allChapters.slice(start, start + CHAPTERS_PER_BATCH);
	const totalBatches = Math.ceil(allChapters.length / CHAPTERS_PER_BATCH);
	const hasMore = currentBatch + 1 < totalBatches;

	const body = `${'Kiryuu Chapters'.formatHeaders()}\n\n${mangaTitle || 'Manga'}\nTotal : ${allChapters.length} chapter(s)\nShowing : ${start + 1}–${start + batch.length}\n\nSelect a chapter to read.`;

	const builder = new client.TemplateBuilder.Native(client);

	builder
		.destination(from)
		.body(body)
		.footer('Powered by ' + __botName);

	const buttons = batch.map((ch) => {
		const label = `${ch.number}${ch.name === ch.number ? '' : ` — ${ch.name}`}`.slice(0, 40);

		return builder.button.reply({ display: label, id: cmdId('kyread', ch.url, ctx) });
	});

	if (hasMore) {
		buttons.push(builder.button.reply({ display: '➡️ More Chapters', id: cmdId('kych', 'next ' + sessionId, ctx) }));
	}

	builder.buttons(...buttons);

	await builder.send();
}
