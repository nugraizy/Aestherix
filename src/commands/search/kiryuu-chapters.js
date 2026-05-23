import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { Kiryuu } from '../../utils/index.js';
import { randomChar } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

const kiryuu = new Kiryuu();

const CHAPTERS_PER_BATCH = 40;

const chapterSessions = new Cache();

export default defineCommand({
	name: 'kiryuuchapters',
	minifiedDescription: 'Kiryuu Chapters',
	description: 'List chapters of a manga/manhwa/manhua on Kiryuu.',
	usage: '!kiryuuchapters `<slug/id/url>`',
	aliases: ['kychapters', 'kych'],
	category: 'Search',
	cooldown: 5,
	limit: 5,
	status: 'enable',
	async run({ query, from, message, prefix, device }, client) {
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

			return await sendBatch(cached, from, message, client, { prefix, device });
		}

		if (query.startsWith('sort ')) {
			const sessionId = query.slice(5);
			const cached = chapterSessions.get(sessionId);

			if (!cached) {
				return await client.reply(from, 'Session expired. Please search again.', message);
			}

			cached.allChapters.reverse();
			cached.order = cached.order === 'asc' ? 'desc' : 'asc';
			cached.currentBatch = 0;

			return await sendBatch(cached, from, message, client, { prefix, device });
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
			const state = { allChapters, currentBatch: 0, sessionId, mangaTitle: manga.title, order: 'asc' };

			chapterSessions.set(sessionId, state);

			await wait.update(`${allChapters[allChapters.length - 1].number} chapter(s) found.`);
			await sendBatch(state, from, message, client, { prefix, device });
		} catch (error) {
			return await wait.update(`Error: ${error.message || 'Failed to fetch chapters.'}`);
		}
	}
});

async function sendBatch(state, from, message, client, ctx) {
	const { allChapters, currentBatch, sessionId, mangaTitle, order } = state;
	const isIos = ctx.device?.isIos;
	const perBatch = isIos ? 18 : CHAPTERS_PER_BATCH;
	const start = currentBatch * perBatch;
	const batch = allChapters.slice(start, start + perBatch);
	const totalBatches = Math.ceil(allChapters.length / perBatch);
	const hasMore = currentBatch + 1 < totalBatches;
	const sortLabel = order === 'asc' ? '⬇️ Latest First' : '⬆️ Oldest First';
	const body = `${'Kiryuu Chapters'.formatHeaders()}\n\n${mangaTitle || 'Manga'}\nTotal : ${allChapters[allChapters.length - 1].number} chapter(s)\nShowing : ${batch[0]?.number}–${batch[batch.length - 1]?.number}\nOrder : ${order === 'desc' ? 'Latest → Oldest' : 'Oldest → Latest'}\n\nSelect a chapter to read.`;

	const builder = new client.TemplateBuilder.Native();

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

	buttons.push(builder.button.reply({ display: sortLabel, id: cmdId('kych', 'sort ' + sessionId, ctx) }));

	builder.buttons(...buttons);

	await builder.send();
}
