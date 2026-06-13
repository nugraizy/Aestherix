import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { BOT_NAME } from '../../core/constants.js';

import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { randomChar } from '../../utils/modules/index.js';
import { mangatoon } from '../../utils/mangatoon/index.js';
import { defineCommand } from '../_define.js';

const CHAPTERS_PER_BATCH = 40;
const chapterSessions = new Cache();

export default defineCommand({
	name: 'mangatoonchapters',
	minifiedDescription: 'MangaToon Chapters',
	description: 'List chapters of a manga on MangaToon.',
	usage: '!mangatoonchapters `<id>`',
	aliases: ['mtchapters', 'mtch'],
	category: 'Search',
	cooldown: 5,
	limit: 5,
	status: 'enable',
	async run({ query, from, message, prefix, device }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.mangaIdRequired, message);
		}

		if (query.startsWith('next ')) {
			const sessionId = query.slice(5);
			const cached = chapterSessions.get(sessionId);

			if (!cached) {
				return await client.reply(from, L.errors.sessionExpired, message);
			}

			cached.currentBatch++;

			return await sendBatch(cached, from, message, client, { prefix, device });
		}

		if (query.startsWith('sort ')) {
			const sessionId = query.slice(5);
			const cached = chapterSessions.get(sessionId);

			if (!cached) {
				return await client.reply(from, L.errors.sessionExpired, message);
			}

			cached.allChapters.reverse();
			cached.order = cached.order === 'asc' ? 'desc' : 'asc';
			cached.currentBatch = 0;

			return await sendBatch(cached, from, message, client, { prefix, device });
		}

		const wait = await client.waitMessage(from, L.success.fetchingChapters, message);

		try {
			const detail = await mangatoon.getDetail(query.trim());

			if (detail.error) {
				return await wait.update(detail.error);
			}

			if (!detail.episodes?.length) {
				return await wait.update('No chapters found for this manga.');
			}

			const sessionId = randomChar('abcdefghijklmnopqrstuvwxyz0123456789', 8);
			const state = {
				allChapters: [...detail.episodes].reverse(),
				currentBatch: 0,
				sessionId,
				mangaId: query.trim(),
				mangaTitle: detail.title,
				order: 'asc'
			};

			chapterSessions.set(sessionId, state);

			await wait.update(`${detail.episodes.length} chapter(s) found.`);
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
	const body = `${'MangaToon Chapters'.formatHeaders()}\n\n${mangaTitle || ''}\nTotal : ${allChapters.length} chapter(s)\nShowing : ${batch[0]?.number}–${batch[batch.length - 1]?.number}\nOrder : ${order === 'desc' ? 'Latest → Oldest' : 'Oldest → Latest'}\n\nSelect a chapter to read.`;

	const builder = new client.TemplateBuilder.Native();

	const buttons = batch.map((ch) => {
		const label = `Ch. ${ch.number}`.slice(0, 40);

		return builder.button.reply({
			display: label,
			id: cmdId('mtread', ch.url, ctx)
		});
	});

	if (hasMore) {
		buttons.push(builder.button.reply({ display: '➡️ More Chapters', id: cmdId('mtch', 'next ' + sessionId, ctx) }));
	}

	buttons.push(builder.button.reply({ display: sortLabel, id: cmdId('mtch', 'sort ' + sessionId, ctx) }));

	await builder
		.destination(from)
		.body(body)
		.footer('Powered by ' + BOT_NAME)
		.buttons(...buttons)
		.send();
}
