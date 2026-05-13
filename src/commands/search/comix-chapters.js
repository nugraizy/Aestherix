import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { Comix } from '../../utils/index.js';
import { randomChar } from '../../utils/modules/index.js';

const comix = new Comix();

const CHAPTERS_PER_BATCH = 20;

const chapterSessions = new Cache();

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'comixchapters',
	minifiedDescription: 'Comix Chapters',
	description: 'List chapters of a manga/manhwa/manhua on Comix.',
	usage: '!comixchapters `<id/slug/url>`',
	aliases: ['cxchapters', 'cxch'],
	category: 'Search',
	cooldown: 5,
	limit: 5,
	status: 'enable',
	async run({ query, from, message, prefix }, client) {
		if (!query) {
			return await client.reply(from, 'Please provide a manga ID, slug, or Comix URL.', message);
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

		const mangaInput = query;
		const result = await comix.getChapters(mangaInput, { allPages: true });

		if (!result.items.length) {
			return await wait.update('No chapters found for this manga.');
		}

		const allChapters = result.items.reverse();
		const sessionId = randomChar('abcdefghijklmnopqrstuvwxyz0123456789', 8);
		const state = { allChapters, currentBatch: 0, sessionId };

		chapterSessions.set(sessionId, state);

		await wait.update(`${allChapters.length} chapter(s) found.`);
		await sendBatch(state, from, message, client, { prefix });
	}
};

async function sendBatch(state, from, message, client, ctx) {
	const { allChapters, currentBatch, sessionId } = state;
	const start = currentBatch * CHAPTERS_PER_BATCH;
	const batch = allChapters.slice(start, start + CHAPTERS_PER_BATCH);
	const totalBatches = Math.ceil(allChapters.length / CHAPTERS_PER_BATCH);
	const hasMore = currentBatch + 1 < totalBatches;

	const body = `${'Comix Chapters'.formatHeaders()}\n\nTotal : ${allChapters.length} chapter(s)\nShowing : ${start + 1}–${start + batch.length}\n\nSelect a chapter to read.`;

	const builder = new client.TemplateBuilder.Native(client);

	builder
		.destination(from)
		.body(body)
		.footer('Powered by ' + __botName);

	const buttons = batch.map((ch) => {
		const label = `Ch. ${ch.number} — ${ch.name}`.slice(0, 40);

		return builder.button.reply({ display: label, id: cmdId('cxread', ch.id, ctx) });
	});

	if (hasMore) {
		buttons.push(builder.button.reply({ display: '➡️ More Chapters', id: cmdId('cxch', 'next ' + sessionId, ctx) }));
	}

	builder.buttons(...buttons);

	await builder.send();
}
