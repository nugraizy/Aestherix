import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { Atsumaru } from '../../utils/atsumaru/index.js';
import { randomChar } from '../../utils/modules/index.js';

const atsumaru = new Atsumaru();

const CHAPTERS_PER_BATCH = 19;

const chapterSessions = new Cache();

export default {
	name: 'atsumaruchapters',
	minifiedDescription: 'Atsumaru Chapters',
	description: 'List chapters of a manga on Atsumaru.',
	usage: '!atsumaruchapters `<id>`',
	aliases: ['atchapters', 'atch'],
	category: 'Search',
	cooldown: 5,
	limit: 5,
	status: 'enable',
	async run({ query, from, message, prefix }, client) {
		if (!query) {
			return await client.reply(from, 'Please provide a manga ID.', message);
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
			const chapters = await atsumaru.getChapters(query.trim());

			if (!chapters.length) {
				return await wait.update('No chapters found for this manga.');
			}

			const sessionId = randomChar('abcdefghijklmnopqrstuvwxyz0123456789', 8);
			const state = { allChapters: chapters, currentBatch: 0, sessionId, mangaId: query.trim() };

			chapterSessions.set(sessionId, state);

			await wait.update(`${chapters.length} chapter(s) found.`);
			await sendBatch(state, from, message, client, { prefix });
		} catch (error) {
			return await wait.update(`Error: ${error.message || 'Failed to fetch chapters.'}`);
		}
	}
};

async function sendBatch(state, from, message, client, ctx) {
	const { allChapters, currentBatch, sessionId, mangaId } = state;
	const start = currentBatch * CHAPTERS_PER_BATCH;
	const batch = allChapters.slice(start, start + CHAPTERS_PER_BATCH);
	const totalBatches = Math.ceil(allChapters.length / CHAPTERS_PER_BATCH);
	const hasMore = currentBatch + 1 < totalBatches;

	const body = `${'Atsumaru Chapters'.formatHeaders()}\n\nTotal : ${allChapters.length} chapter(s)\nShowing : ${start + 1}–${start + batch.length}\n\nSelect a chapter to read.`;

	const builder = new client.TemplateBuilder.Native();

	const buttons = batch.map((ch) => {
		const label = `Ch. ${ch.number} — ${ch.name}`.replace(/[\n\r\t]/g, ' ').slice(0, 40);

		return builder.button.reply({ display: label, id: cmdId('atread', `${mangaId}/${ch.id}`, ctx) });
	});

	if (hasMore) {
		buttons.push(builder.button.reply({ display: '➡️ More Chapters', id: cmdId('atch', 'next ' + sessionId, ctx) }));
	}

	await builder
		.destination(from)
		.body(body)
		.footer('Powered by ' + __botName)
		.buttons(...buttons)
		.send();
}
