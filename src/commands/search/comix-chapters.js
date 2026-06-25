import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { BOT_NAME } from '../../core/constants.js';

import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { comix } from '../../utils/index.js';
import { randomChar } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

const chapterSessions = new Cache();

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

			const next = await cached.result.nextPage();

			cached.result = next;
			cached.order = cached.order === 'asc' ? 'asc' : 'desc';

			return await sendPage(cached, from, message, client, { prefix, device, locale });
		}

		if (query.startsWith('prev ')) {
			const sessionId = query.slice(5);
			const cached = chapterSessions.get(sessionId);

			if (!cached) {
				return await client.reply(from, L.errors.sessionExpired, message);
			}

			const prev = await cached.result.prevPage();

			cached.result = prev;

			return await sendPage(cached, from, message, client, { prefix, device, locale });
		}

		if (query.startsWith('sort ')) {
			const sessionId = query.slice(5);
			const cached = chapterSessions.get(sessionId);

			if (!cached) {
				return await client.reply(from, L.errors.sessionExpired, message);
			}

			cached.result.items.reverse();
			cached.order = cached.order === 'asc' ? 'desc' : 'asc';

			return await sendPage(cached, from, message, client, { prefix, device, locale });
		}

		const wait = await client.waitMessage(from, L.success.fetchingChapters, message);

		const mangaInput = query;
		const result = await comix.getChapters(mangaInput, { pages: 1, deduplicate: false });

		if (!result.items.length) {
			return await wait.update(t(locale, 'common.core.errors.noChaptersFound', [mangaInput]));
		}

		const sessionId = randomChar('abcdefghijklmnopqrstuvwxyz0123456789', 8);
		const state = { result, sessionId, mangaInput, order: 'asc' };

		chapterSessions.set(sessionId, state);

		const totalPages = result.pageInfo.lastPage;
		const totalUnique = new Set(result.items.map((c) => String(c.number))).size;

		await wait.update(
			t(locale, 'common.core.progress.chaptersFound', [totalUnique]) + ` (${result.pageInfo.page}/${totalPages})`
		);

		await sendPage(state, from, message, client, { prefix, device, locale });
	}
});

async function sendPage(state, from, message, client, ctx) {
	const { result, sessionId, order } = state;
	const chapters = result.items;
	const { page, lastPage } = result.pageInfo;
	const isIos = ctx.device?.isIos;
	const Ls = useLocale(ctx.locale, 'search');
	const sortLabel = order === 'asc' ? Ls.buttons.sortLatest : Ls.buttons.sortOldest;
	const orderLabel = order === 'desc' ? Ls.labels.orderLatest : Ls.labels.orderOldest;
	const body = `${Ls.titles.comixChapters.formatHeaders()}\n\n${t(ctx.locale, 'search.labels.showing', [(page - 1) * 20 + 1, (page - 1) * 20 + chapters.length])}\n${t(ctx.locale, 'search.labels.order', [orderLabel])}\nPage ${page}/${lastPage}\n\n${Ls.labels.selectManga}`;

	const builder = new client.TemplateBuilder.Native();

	builder
		.destination(from)
		.body(body)
		.footer('Powered by ' + BOT_NAME);

	const navCount = (result.hasPrev() ? 1 : 0) + (result.hasNext() ? 1 : 0) + 1;
	const maxChapterButtons = isIos ? Math.max(20 - navCount, 10) : chapters.length;
	const displayChapters = chapters.slice(0, maxChapterButtons);

	const buttons = displayChapters.map((ch) => {
		const num = String(ch.number).replace(/\.0$/, '');
		const isRedundant = !ch.name || ch.name === `Chapter ${num}` || ch.name === num;
		const group = ch.scanlator && ch.scanlator !== 'Unknown' ? ` (${ch.scanlator})` : '';
		const label = isRedundant ? `Ch. ${num}${group}` : `Ch. ${num}${group}\n${ch.name}`;

		return builder.button.reply({ display: label.slice(0, 40), id: cmdId('cxread', `${sessionId}:${ch.id}`, ctx) });
	});

	if (result.hasPrev()) {
		buttons.push(builder.button.reply({ display: 'Previous', id: cmdId('cxch', 'prev ' + sessionId, ctx) }));
	}

	if (result.hasNext()) {
		buttons.push(builder.button.reply({ display: Ls.buttons.moreChapters, id: cmdId('cxch', 'next ' + sessionId, ctx) }));
	}

	buttons.push(builder.button.reply({ display: sortLabel, id: cmdId('cxch', 'sort ' + sessionId, ctx) }));

	builder.buttons(...buttons);

	await builder.send();
}
