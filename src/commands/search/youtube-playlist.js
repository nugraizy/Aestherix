import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { BOT_NAME } from '../../core/constants.js';

import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { randomChar } from '../../utils/modules/index.js';
import { youtube } from '../../utils/youtube/index.js';
import { defineCommand } from '../_define.js';

const RESULTS_PER_BATCH = 25;

const playlistSessions = new Cache();

const perBatchFor = (device) => (device?.isIos ? 18 : RESULTS_PER_BATCH);

const formatDuration = (seconds) => {
	const total = Number(seconds) || 0;
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const secs = total % 60;
	const pad = (value) => String(value).padStart(2, '0');

	return hours ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`;
};

function sendBatch(state, from, message, client, ctx) {
	const { items, currentBatch, sessionId, title } = state;
	const perBatch = perBatchFor(ctx.device);
	const start = currentBatch * perBatch;
	const batch = items.slice(start, start + perBatch);
	const hasMore = start + batch.length < items.length;
	const Ls = useLocale(ctx.locale, 'search');
	const info = `${Ls.labels.playlist} : ${title}\n${Ls.labels.videos} : ${items.length}\n${t(ctx.locale, 'search.labels.showing', [start + 1, start + batch.length])}`;
	const body = `${Ls.titles.youtubePlaylist.formatHeaders()}\n\n${info.formatForm()}\n\n${Ls.labels.selectVideo}`;

	const builder = new client.TemplateBuilder.Native();

	builder
		.destination(from)
		.body(body)
		.footer(t(ctx.locale, 'core.footer.poweredBy', [BOT_NAME]));

	const buttons = batch.map((entry, index) => {
		const label = `${start + index + 1}. ${entry.title.slice(0, 100)}  ${formatDuration(entry.durationSeconds)}`;

		return builder.button.reply({ display: label, id: cmdId('ytchoose', `https://youtu.be/${entry.id}`, ctx) });
	});

	if (hasMore) {
		buttons.push(builder.button.reply({ display: Ls.buttons.nextImage, id: cmdId('ytpl', 'next ' + sessionId, ctx) }));
	}

	builder.buttons(...buttons);

	return builder.send();
}

export default defineCommand({
	name: 'youtubeplaylist',
	minifiedDescription: 'List a YouTube playlist',
	description: 'List videos in a YouTube playlist and pick one to download.',
	usage: '!youtubeplaylist `<playlist url>`',
	aliases: ['ytplaylist', 'ytpl'],
	category: 'Search',
	cooldown: 8,
	limit: 5,
	status: 'enable',
	async run({ from, query, message, prefix, device }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Ls = useLocale(locale, 'search');

		if (!query) {
			return await client.reply(from, L.errors.playlistUrlRequired, message);
		}

		const ctx = { prefix, device, locale };

		if (query.startsWith('next ')) {
			const cached = playlistSessions.get(query.slice(5));

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

		const wait = await client.waitMessage(from, L.success.fetchingPlaylist, message);

		let playlist;

		try {
			playlist = await youtube.playlist(query);
		} catch {
			return await wait.update(Ls.labels.invalidPlaylist);
		}

		if (!playlist.videos.length) {
			return await wait.update(Ls.labels.noVideos);
		}

		const sessionId = randomChar('abcdefghijklmnopqrstuvwxyz0123456789', 8);
		const state = {
			items: playlist.videos,
			currentBatch: 0,
			sessionId,
			title: playlist.title || Ls.titles.youtubePlaylist
		};

		playlistSessions.set(sessionId, state);

		await wait.update(t(locale, 'search.labels.foundVideos', [playlist.videos.length]));

		await sendBatch(state, from, message, client, ctx);
	}
});
