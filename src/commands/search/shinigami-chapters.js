import { BOT_NAME } from '../../core/constants.js';

import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { randomChar } from '../../utils/modules/index.js';
import { shinigami } from '../../utils/shinigami/index.js';
import { defineCommand } from '../_define.js';

const CHAPTERS_PER_BATCH = 40;

const chapterSessions = new Cache();

export default defineCommand({
	name: 'shinigamichapters',
	minifiedDescription: 'Shinigami Chapters',
	description: 'List chapters of a manga on Shinigami.',
	usage: '!shinigamichapters `<id>`',
	aliases: ['sgchapters', 'sgch'],
	category: 'Search',
	cooldown: 5,
	limit: 5,
	status: 'enable',
	async run({ query, from, message, prefix, device }, client) {
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
			const chapters = await shinigami.getChapters(query.trim());

			if (!chapters.length) {
				return await wait.update('No chapters found for this manga.');
			}

			const sessionId = randomChar('abcdefghijklmnopqrstuvwxyz0123456789', 8);
			const state = {
				allChapters: [...chapters].reverse(),
				currentBatch: 0,
				sessionId,
				mangaId: query.trim(),
				order: 'asc'
			};

			chapterSessions.set(sessionId, state);

			await wait.update(`${new Set(state.allChapters.map((c) => String(c.number))).size} chapter(s) found.`);
			await sendBatch(state, from, message, client, { prefix, device });
		} catch (error) {
			return await wait.update(`Error: ${error.message || 'Failed to fetch chapters.'}`);
		}
	}
});

async function sendBatch(state, from, message, client, ctx) {
	const { allChapters, currentBatch, sessionId, mangaId, order } = state;
	const isIos = ctx.device?.isIos;
	const perBatch = isIos ? 18 : CHAPTERS_PER_BATCH;
	const start = currentBatch * perBatch;
	const batch = allChapters.slice(start, start + perBatch);
	const totalBatches = Math.ceil(allChapters.length / perBatch);
	const hasMore = currentBatch + 1 < totalBatches;
	const sortLabel = order === 'asc' ? '⬇️ Latest First' : '⬆️ Oldest First';
	const total = new Set(allChapters.map((c) => String(c.number))).size;
	const body = `${'Shinigami Chapters'.formatHeaders()}\n\nTotal : ${total} chapter(s)\nShowing : ${batch[0]?.number}–${batch[batch.length - 1]?.number}\nOrder : ${order === 'desc' ? 'Latest → Oldest' : 'Oldest → Latest'}\n\nSelect a chapter to read.`;

	const builder = new client.TemplateBuilder.Native();

	const buttons = batch.map((ch) => {
		const num = String(ch.number).replace(/\.0$/, '');
		const isRedundant = !ch.name || ch.name === `Chapter ${num}` || ch.name === num;
		const label = isRedundant ? `Ch. ${num}` : `Ch. ${num}\n${ch.name}`;

		return builder.button.reply({
			display: label.replace(/[\r\t]/g, ' ').slice(0, 40),
			id: cmdId('sgread', `${mangaId}/${ch.id}`, ctx)
		});
	});

	if (hasMore) {
		buttons.push(builder.button.reply({ display: '➡️ More Chapters', id: cmdId('sgch', 'next ' + sessionId, ctx) }));
	}

	buttons.push(builder.button.reply({ display: sortLabel, id: cmdId('sgch', 'sort ' + sessionId, ctx) }));

	await builder
		.destination(from)
		.body(body)
		.footer('Powered by ' + BOT_NAME)
		.buttons(...buttons)
		.send();
}
