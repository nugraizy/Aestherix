import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { BOT_NAME } from '../../core/constants.js';

import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { kiryuu } from '../../utils/index.js';
import { randomChar } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

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
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Ls = useLocale(locale, 'search');

		if (!query) {
			return await client.reply(from, L.errors.mangaSlugRequired, message);
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
			const manga = await kiryuu.getManga(query);
			const chaptersResult = await kiryuu.getChapters(manga);

			if (!chaptersResult.length) {
				return await wait.update(Ls.labels.noChaptersFound || 'No chapters found for this manga.');
			}

			const allChapters = [...chaptersResult].reverse();
			const sessionId = randomChar('abcdefghijklmnopqrstuvwxyz0123456789', 8);
			const state = { allChapters, currentBatch: 0, sessionId, mangaTitle: manga.title, order: 'asc' };

			chapterSessions.set(sessionId, state);

			await wait.update(Ls.labels.chaptersFound.replace('{0}', new Set(allChapters.map((c) => String(c.number))).size));
			await sendBatch(state, from, message, client, { prefix, device, locale });
		} catch (error) {
			return await wait.update(`Error: ${error.message || Ls.labels.fetchFailed || 'Failed to fetch chapters.'}`);
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
	const Ls = useLocale(ctx.locale, 'search');
	const sortLabel = order === 'asc' ? Ls.buttons.sortLatest : Ls.buttons.sortOldest;
	const total = new Set(allChapters.map((c) => String(c.number))).size;
	const orderLabel = order === 'desc' ? Ls.labels.orderLatest : Ls.labels.orderOldest;
	const body = `${Ls.titles.kiryuuChapters.formatHeaders()}\n\n${mangaTitle || 'Manga'}\n${Ls.labels.chapterTotal.replace('{0}', total)}\n${Ls.labels.showing.replace('{0}', batch[0]?.number).replace('{1}', batch[batch.length - 1]?.number)}\n${Ls.labels.order.replace('{0}', orderLabel)}\n\n${Ls.labels.selectManga}`;

	const builder = new client.TemplateBuilder.Native();

	builder
		.destination(from)
		.body(body)
		.footer('Powered by ' + BOT_NAME);

	const buttons = batch.map((ch) => {
		const label = `${ch.number}${ch.name === ch.number ? '' : ` — ${ch.name}`}`.slice(0, 40);

		return builder.button.reply({ display: label, id: cmdId('kyread', ch.url, ctx) });
	});

	if (hasMore) {
		buttons.push(builder.button.reply({ display: Ls.buttons.moreChapters, id: cmdId('kych', 'next ' + sessionId, ctx) }));
	}

	buttons.push(builder.button.reply({ display: sortLabel, id: cmdId('kych', 'sort ' + sessionId, ctx) }));

	builder.buttons(...buttons);

	await builder.send();
}
