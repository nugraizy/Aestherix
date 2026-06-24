import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { BOT_NAME } from '../../core/constants.js';

import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { atsumaru } from '../../utils/atsumaru/index.js';
import { randomChar } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

const CHAPTERS_PER_BATCH = 40;

const chapterSessions = new Cache();

export default defineCommand({
	name: 'atsumaruchapters',
	minifiedDescription: 'Atsumaru Chapters',
	description: 'List chapters of a manga on Atsumaru.',
	usage: '!atsumaruchapters `<id>`',
	aliases: ['atchapters', 'atch'],
	category: 'Search',
	cooldown: 5,
	limit: 5,
	status: 'enable',
	async run({ query, from, message, prefix, device }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Ls = useLocale(locale, 'search');

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
			const chapters = await atsumaru.getChapters(query.trim());

			if (!chapters.length) {
				return await wait.update(Ls.labels.noChaptersFound || 'No chapters found for this manga.');
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

			await wait.update(t(locale, 'search.labels.chaptersFound', [new Set(state.allChapters.map((c) => String(c.number))).size]));
			await sendBatch(state, from, message, client, { prefix, device, locale });
		} catch (error) {
			return await wait.update(`Error: ${error.message || Ls.labels.fetchFailed || 'Failed to fetch chapters.'}`);
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
	const Ls = useLocale(ctx.locale, 'search');
	const sortLabel = order === 'asc' ? Ls.buttons.sortLatest : Ls.buttons.sortOldest;
	const total = new Set(allChapters.map((c) => String(c.number))).size;
	const orderLabel = order === 'desc' ? Ls.labels.orderLatest : Ls.labels.orderOldest;
	const body = `${Ls.titles.atsumaruChapters.formatHeaders()}\n\n${t(ctx.locale, 'search.labels.chapterTotal', [total])}\n${t(ctx.locale, 'search.labels.showing', [batch[0]?.number, batch[batch.length - 1]?.number])}\n${t(ctx.locale, 'search.labels.order', [orderLabel])}\n\n${Ls.labels.selectManga}`;

	const builder = new client.TemplateBuilder.Native();

	const buttons = batch.map((ch) => {
		const num = String(ch.number).replace(/\.0$/, '');
		const isRedundant = !ch.name || ch.name === `Chapter ${num}` || ch.name === num;
		const label = isRedundant ? `Ch. ${num}` : `Ch. ${num}\n${ch.name}`;

		return builder.button.reply({
			display: label.replace(/[\r\t]/g, ' ').slice(0, 40),
			id: cmdId('atread', `${mangaId}/${ch.id}`, ctx)
		});
	});

	if (hasMore) {
		buttons.push(builder.button.reply({ display: Ls.buttons.moreChapters, id: cmdId('atch', 'next ' + sessionId, ctx) }));
	}

	buttons.push(builder.button.reply({ display: sortLabel, id: cmdId('atch', 'sort ' + sessionId, ctx) }));

	await builder
		.destination(from)
		.body(body)
		.footer('Powered by ' + BOT_NAME)
		.buttons(...buttons)
		.send();
}
