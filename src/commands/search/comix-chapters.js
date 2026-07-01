import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { BOT_NAME } from '../../core/constants.js';

import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { comix } from '../../utils/index.js';
import { randomChar } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

const chapterSessions = new Cache();
const CHAPTERS_PER_PAGE = 17;
const MAX_BUTTONS = 20;

export default defineCommand({
	name: 'comixchapters',
	minifiedDescription: 'Comix Chapters',
	description: 'List chapters of a manga/manhwa/manhua on Comix.',
	usage: '!comixchapters `<id/slug/url>`',
	aliases: ['cxchapters', 'cxch'],
	category: 'Search',
	cooldown: 5,
	limit: 5,
	status: 'enable',
	async run({ query, from, message, prefix, device }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.mangaSlugRequired, message);
		}

		if (query.startsWith('next ')) {
			const sessionId = query.slice(5);
			const cached = chapterSessions.get(sessionId);

			if (!cached) {
				return await client.reply(from, L.errors.sessionExpired, message);
			}

			cached.page += 1;

			return await sendPage(cached, from, message, client, { prefix, device, locale });
		}

		if (query.startsWith('prev ')) {
			const sessionId = query.slice(5);
			const cached = chapterSessions.get(sessionId);

			if (!cached) {
				return await client.reply(from, L.errors.sessionExpired, message);
			}

			cached.page -= 1;

			return await sendPage(cached, from, message, client, { prefix, device, locale });
		}

		if (query.startsWith('sort ')) {
			const sessionId = query.slice(5);
			const cached = chapterSessions.get(sessionId);

			if (!cached) {
				return await client.reply(from, L.errors.sessionExpired, message);
			}

			cached.chapters.reverse();
			cached.order = cached.order === 'asc' ? 'desc' : 'asc';
			cached.page = 1;

			return await sendPage(cached, from, message, client, { prefix, device, locale });
		}

		const wait = await client.waitMessage(from, L.success.fetchingChapters, message);

		const mangaInput = query;
		const result = await comix.getChapters(mangaInput, { deduplicate: false });

		if (!result.items.length) {
			return await wait.update(t(locale, 'common.core.errors.noChaptersFound', [mangaInput]));
		}

		const sessionId = randomChar('abcdefghijklmnopqrstuvwxyz0123456789', 8);
		const state = { chapters: result.items, sessionId, mangaInput, order: 'asc', page: 1 };

		chapterSessions.set(sessionId, state);

		const totalPages = Math.ceil(result.items.length / CHAPTERS_PER_PAGE);
		const totalUnique = new Set(result.items.map((c) => String(c.number))).size;

		await wait.update(t(locale, 'common.core.progress.chaptersFound', [totalUnique]) + ` (1/${totalPages})`);

		await sendPage(state, from, message, client, { prefix, device, locale });
	}
});

async function sendPage(state, from, message, client, ctx) {
	const { chapters, sessionId, order, page } = state;
	const totalPages = Math.ceil(chapters.length / CHAPTERS_PER_PAGE);
	const startIdx = (page - 1) * CHAPTERS_PER_PAGE;
	const endIdx = startIdx + CHAPTERS_PER_PAGE;
	const pageChapters = chapters.slice(startIdx, endIdx);
	const isIos = ctx.device?.isIos;
	const Ls = useLocale(ctx.locale, 'search');
	const sortLabel = order === 'asc' ? Ls.buttons.sortLatest : Ls.buttons.sortOldest;
	const orderLabel = order === 'desc' ? Ls.labels.orderLatest : Ls.labels.orderOldest;
	const body = `${Ls.titles.comixChapters.formatHeaders()}\n\n${t(ctx.locale, 'search.labels.showing', [startIdx + 1, Math.min(endIdx, chapters.length)])}\n${t(ctx.locale, 'search.labels.order', [orderLabel])}\nPage ${page}/${totalPages}\n\n${Ls.labels.selectManga}`;

	const builder = new client.TemplateBuilder.Native();

	builder
		.destination(from)
		.body(body)
		.footer('Powered by ' + BOT_NAME);

	const hasPrev = page > 1;
	const hasNext = page < totalPages;
	const navCount = (hasPrev ? 1 : 0) + (hasNext ? 1 : 0) + 1;
	const maxChapterButtons = isIos ? Math.max(MAX_BUTTONS - navCount, 10) : pageChapters.length;
	const displayChapters = pageChapters.slice(0, maxChapterButtons);

	const buttons = displayChapters.map((ch) => {
		const num = String(ch.number).replace(/\.0$/, '');
		const isRedundant = !ch.name || ch.name === `Chapter ${num}` || ch.name === num;
		const group = ch.scanlator && ch.scanlator !== 'Unknown' ? ` (${ch.scanlator})` : '';
		const label = isRedundant ? `Ch. ${num}${group}` : `Ch. ${num}${group}\n${ch.name}`;

		return builder.button.reply({ display: label.slice(0, 40), id: cmdId('cxread', `${sessionId}:${ch.id}`, ctx) });
	});

	if (hasPrev) {
		buttons.push(builder.button.reply({ display: 'Previous', id: cmdId('cxch', 'prev ' + sessionId, ctx) }));
	}

	if (hasNext) {
		buttons.push(builder.button.reply({ display: Ls.buttons.moreChapters, id: cmdId('cxch', 'next ' + sessionId, ctx) }));
	}

	buttons.push(builder.button.reply({ display: sortLabel, id: cmdId('cxch', 'sort ' + sessionId, ctx) }));

	builder.buttons(...buttons);

	await builder.send();
}
