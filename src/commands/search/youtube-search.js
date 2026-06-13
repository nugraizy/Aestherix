import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { BOT_NAME } from '../../core/constants.js';

import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { youtube } from '../../utils/index.js';
import { randomChar } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

const RESULTS_PER_BATCH = 25;

const searchSessions = new Cache();

const perBatchFor = (device) => (device?.isIos ? 18 : RESULTS_PER_BATCH);

function sendBatch(state, from, message, client, ctx) {
	const { items, currentBatch, sessionId, query, sort } = state;
	const perBatch = perBatchFor(ctx.device);
	const start = currentBatch * perBatch;
	const batch = items.slice(start, start + perBatch);
	const hasMore = start + batch.length < items.length;
	const sortLabel = sort === 'views' ? '🔀 Sort : Relevance' : '🔀 Sort : Most Viewed';
	const info = `Query : ${query}\nResults : ${items.length}\nShowing : ${start + 1}–${start + batch.length}\nSorted by : ${sort === 'views' ? 'Most Viewed' : 'Relevance'}`;
	const body = `${'YouTube Search'.formatHeaders()}\n\n${info.formatForm()}\n\nSelect a video to download.`;

	const builder = new client.TemplateBuilder.Native();

	builder
		.destination(from)
		.body(body)
		.footer('Powered by ' + BOT_NAME);

	const buttons = batch.map((video, index) => {
		const label = `${start + index + 1}. ${video.title.slice(0, 100)} ${video.duration || 'N/A'}`;

		return builder.button.reply({ display: label, id: cmdId('ytchoose', video.url, ctx) });
	});

	if (hasMore) {
		buttons.push(builder.button.reply({ display: '➡️ Next', id: cmdId('yts', 'next ' + sessionId, ctx) }));
	}

	buttons.push(builder.button.reply({ display: sortLabel, id: cmdId('yts', 'sort ' + sessionId, ctx) }));

	builder.buttons(...buttons);

	return builder.send();
}

export default defineCommand({
	name: 'ytsearch',
	minifiedDescription: 'Search YouTube',
	description: 'Search YouTube and pick a result to download.',
	usage: '!ytsearch `<query>`',
	aliases: ['yts', 'ytsr'],
	category: 'Search',
	cooldown: 5,
	limit: 5,
	status: 'enable',
	async run({ from, query, message, prefix, device }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.noQuery, message);
		}

		const ctx = { prefix, device };

		if (query.startsWith('next ')) {
			const cached = searchSessions.get(query.slice(5));

			if (!cached) {
				return await client.reply(from, L.errors.sessionExpired, message);
			}

			cached.currentBatch++;

			if (cached.currentBatch * perBatchFor(device) >= cached.items.length) {
				cached.currentBatch--;
				return await client.reply(from, L.info.noMoreResults, message);
			}

			return await sendBatch(cached, from, message, client, ctx);
		}

		if (query.startsWith('sort ')) {
			const cached = searchSessions.get(query.slice(5));

			if (!cached) {
				return await client.reply(from, L.errors.sessionExpired, message);
			}

			if (cached.sort === 'views') {
				cached.items = [...cached.original];
				cached.sort = 'relevance';
			} else {
				cached.items = [...cached.original].sort((a, b) => b.views - a.views);
				cached.sort = 'views';
			}

			cached.currentBatch = 0;

			return await sendBatch(cached, from, message, client, ctx);
		}

		const wait = await client.waitMessage(from, L.success.searching, message);

		const result = (await youtube.search(query, { limit: 40 })).filter((video) => video.type === 'video');

		if (!result.length) {
			return await wait.update('No results found. Try a different query.');
		}

		const sessionId = randomChar('abcdefghijklmnopqrstuvwxyz0123456789', 8);
		const state = { items: result, original: result, currentBatch: 0, sessionId, query, sort: 'relevance' };

		searchSessions.set(sessionId, state);

		await wait.update(`Found ${result.length} result(s).`);

		await sendBatch(state, from, message, client, ctx);
	}
});
