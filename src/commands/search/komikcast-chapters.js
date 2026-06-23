import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { BOT_NAME } from '../../core/constants.js';

import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { komikcast } from '../../utils/index.js';
import { randomChar } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

const CHAPTERS_PER_BATCH = 40;

const chapterSessions = new Cache();

export default defineCommand({
	name: 'komikcastchapters',
	minifiedDescription: 'Komikcast Chapters',
	description: 'List chapters of a comic on Komikcast.',
	usage: '!komikcastchapters `<slug>`',
	aliases: ['kcchapters', 'kcch'],
	category: 'Search',
	cooldown: 5,
	limit: 5,
	status: 'enable',
	async run({ query, from, message, prefix, device }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.comicSlugRequired, message);
		}

		if (query.startsWith('next ')) {
			const sessionId = query.slice(5);
			const cached = chapterSessions.get(sessionId);

			if (!cached) {
				return await client.reply(from, L.errors.sessionExpired, message);
			}

			cached.currentBatch++;

			return await sendBatch(cached, from, message, client, { prefix, device, locale });
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

			return await sendBatch(cached, from, message, client, { prefix, device, locale });
		}

		const wait = await client.waitMessage(from, L.success.fetchingChapters, message);

		try {
			const chapters = await komikcast.getChapters(query.trim());

			if (!chapters.length) {
				return await wait.update(t(locale, 'common.core.errors.noChaptersFound', ['comic']));
			}

			const sessionId = randomChar('abcdefghijklmnopqrstuvwxyz0123456789', 8);
			const state = {
				allChapters: [...chapters].sort((a, b) => a.number - b.number),
				currentBatch: 0,
				sessionId,
				mangaSlug: query.trim(),
				order: 'asc'
			};

			chapterSessions.set(sessionId, state);

			const chapterCount = new Set(state.allChapters.map((c) => String(c.number))).size;

			await wait.update(t(locale, 'common.core.progress.chaptersFound', [chapterCount]));
			await sendBatch(state, from, message, client, { prefix, device, locale });
		} catch (error) {
			return await wait.update(`Error: ${error.message || 'Failed to fetch chapters.'}`);
		}
	}
});

async function sendBatch(state, from, message, client, ctx) {
	const { allChapters, currentBatch, sessionId, mangaSlug, order } = state;
	const isIos = ctx.device?.isIos;
	const perBatch = isIos ? 18 : CHAPTERS_PER_BATCH;
	const start = currentBatch * perBatch;
	const batch = allChapters.slice(start, start + perBatch);
	const totalBatches = Math.ceil(allChapters.length / perBatch);
	const hasMore = currentBatch + 1 < totalBatches;
	const Ls = useLocale(ctx.locale, 'search');
	const sortLabel = order === 'asc' ? Ls.buttons.sortLatest : Ls.buttons.sortOldest;
	const total = new Set(allChapters.map((c) => String(c.number))).size;
	const body = `${Ls.titles.komikcastChapters.formatHeaders()}\n\n${Ls.labels.chapterTotal.replace('{0}', total)}\nShowing : ${batch[0]?.number}–${batch[batch.length - 1]?.number}\nOrder : ${order === 'desc' ? 'Latest → Oldest' : 'Oldest → Latest'}\n\nSelect a chapter to read.`;

	const builder = new client.TemplateBuilder.Native();

	const buttons = batch.map((ch) => {
		const num = String(ch.number).replace(/\.0$/, '');
		const isRedundant = !ch.name || ch.name === `Chapter ${num}` || ch.name === num;
		const label = isRedundant ? `Ch. ${num}` : `Ch. ${num}\n${ch.name}`;

		return builder.button.reply({
			display: label.replace(/[\r\t]/g, ' ').slice(0, 40),
			id: cmdId('kcread', `${mangaSlug}/${ch.id}`, ctx)
		});
	});

	if (hasMore) {
		buttons.push(builder.button.reply({ display: Ls.buttons.moreChapters, id: cmdId('kcch', 'next ' + sessionId, ctx) }));
	}

	buttons.push(builder.button.reply({ display: sortLabel, id: cmdId('kcch', 'sort ' + sessionId, ctx) }));

	await builder
		.destination(from)
		.body(body)
		.footer(t(ctx.locale, 'common.core.footer.poweredBy', [BOT_NAME]))
		.buttons(...buttons)
		.send();
}
