import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { BOT_NAME } from '../../core/constants.js';

import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { comix, imageToPdf, mime } from '../../utils/index.js';
import { randomChar } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';



const CHAPTERS_PER_BATCH = 19;

const readerSessions = new Cache();

/**
 * Checks whether the input looks like a chapter ID or a Comix URL
 * rather than a free-text search query.
 * @param {string} input
 * @returns {boolean}
 */
const isChapterInput = (input) => {
	if (/^\d+$/.test(input)) {
		return true;
	}

	if (input.includes(':') && /^[\w-]+:\d+$/.test(input)) {
		return true;
	}

	try {
		const url = new URL(input);

		return url.host.replace(/^www\./, '') === 'comix.to';
	} catch {
		return false;
	}
};

/**
 * Downloads chapter pages and sends as PDF.
 * @param {object} ctx
 * @param {string} chapterId
 * @param {string} fileName
 */
const downloadChapterAsPdf = async ({ from, message }, client, wait, chapterId, chapterUrl, fileName, locale) => {
	const L = useLocale(locale, 'common');

	await wait.update(L.success.fetchingPages);

	const pages = await comix.getChapterPages({ id: chapterId, chapterId, url: chapterUrl });

	if (!pages.length) {
		return await wait.update(L.core.errors.noPagesFound);
	}

	await wait.update(t(locale, 'common.core.progress.convertingToPdf', [pages.length]));

	const imageInputs = pages.map((page) => (page.scrambled && page.buffer ? page.buffer : page.url));
	const buffer = await imageToPdf(imageInputs);

	await client.send(
		from,
		{
			document: Buffer.from(buffer, 'base64'),
			mimetype: mime('pdf'),
			fileName: `${fileName}.pdf`
		},
		{ quoted: message }
	);

	await wait.update(t(locale, 'common.core.progress.doneSentPdf', [pages.length]));
};

async function sendBatch(state, from, message, client, ctx) {
	const { allChapters, currentBatch, safeName, sessionId } = state;
	const start = currentBatch * CHAPTERS_PER_BATCH;
	const batch = allChapters.slice(start, start + CHAPTERS_PER_BATCH);
	const totalBatches = Math.ceil(allChapters.length / CHAPTERS_PER_BATCH);
	const hasMore = currentBatch + 1 < totalBatches;
	const Ls = useLocale(ctx.locale, 'search');

	const body = `${Ls.titles.comixReader.formatHeaders()}\n\n${safeName}\n${t(ctx.locale, 'search.labels.chapterTotal', [allChapters.length])}\n${t(ctx.locale, 'search.labels.showing', [start + 1, start + batch.length])}\n\n${Ls.labels.selectChapter}`;

	const builder = new client.TemplateBuilder.Native();

	builder
		.destination(from)
		.body(body)
		.footer('Powered by ' + BOT_NAME);

	const buttons = batch.map((ch) => {
		const label = `Ch. ${ch.number} — ${ch.name}`.slice(0, 40);

		return builder.button.reply({ display: label, id: cmdId('cxread', ch.id, ctx) });
	});

	if (hasMore) {
		buttons.push(builder.button.reply({ display: Ls.buttons.moreChapters, id: cmdId('cxread', 'next ' + sessionId, ctx) }));
	}

	builder.buttons(...buttons);

	await builder.send();
}

export default defineCommand({
	name: 'comixread',
	minifiedDescription: 'Read Comix Chapter',
	description:
		'Download chapter pages from Comix as a PDF. Provide a chapter ID, Comix URL, or a search query to find and pick a chapter.',
	usage: '!comixread `<chapter-id/url/query>`',
	aliases: ['cxread', 'cxdl', 'comixdl'],
	category: 'Search',
	cooldown: 10,
	limit: 3,
	status: 'enable',
	async run({ query, from, message, prefix }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Ls = useLocale(locale, 'search');

		if (!query) {
			return await client.reply(from, t(locale, 'search.labels.comixReadHelp', [`${prefix}cxread`]), message);
		}

		const input = query.trim();

		if (input.startsWith('next ')) {
			const sessionId = input.slice(5);
			const cached = readerSessions.get(sessionId);

			if (!cached) {
				return await client.reply(from, L.errors.sessionExpired, message);
			}

			cached.currentBatch++;
			return await sendBatch(cached, from, message, client, { prefix, locale });
		}

		const wait = await client.waitMessage(from, L.success.processing, message);

		if (isChapterInput(input)) {
			let chapterId = input;
			let chapterUrl;
			let slug;

			if (input.includes(':')) {
				[slug, chapterId] = input.split(':');
			}

			// Try cache first (works for both direct IDs and session-based IDs)
			const cachedChapter = comix.getChapterById(chapterId);

			if (cachedChapter?.url) {
				chapterUrl = cachedChapter.url;
				slug = cachedChapter.url.match(/\/title\/([^/]+)\//)?.[1] || slug;
			} else if (slug && !chapterUrl) {
				chapterUrl = `https://comix.to/title/${slug}/${chapterId}-chapter-1`;
			}

			const cached = comix.getChapterById(chapterId);

			if (cached?.url) {
				chapterUrl = cached.url;
			}

			try {
				const cached = comix.getChapterById(chapterId);
				const chapterNum = cached?.number || chapterId;
				const session = [...readerSessions.entries()].find(([, s]) =>
					s.allChapters.some((c) => String(c.id) === String(chapterId))
				);
				const title = session?.[1]?.safeName || slug?.split('-').slice(1).join('-') || 'comix';

				return await downloadChapterAsPdf(
					{ from, message },
					client,
					wait,
					chapterId,
					chapterUrl,
					`${title}-chapter-${chapterNum}-comix`.replace(/\s+/g, '-').toLowerCase(),
					locale
				);
			} catch (error) {
				if (error.message?.includes('Outdated chapter URL')) {
					return await wait.update(Ls.labels.outdatedChapter);
				}

				throw error;
			}
		}

		await wait.update(L.success.fetchingChapters);

		let manga = null;
		let chaptersResult = null;

		try {
			chaptersResult = await comix.getChapters(input, { allPages: true });

			if (chaptersResult.items.length) {
				manga = { title: input, id: input };
			}
		} catch {
			// not a valid manga ID, fall through to search
		}

		if (!manga) {
			await wait.update(L.success.searching);

			const result = await comix.search(input, { limit: 1, excludeNsfw: true });

			if (!result.items.length) {
				return await wait.update(Ls.labels.noMangaFound);
			}

			manga = result.items[0];
			await wait.update(t(locale, 'search.labels.foundFetchingChapters', [manga.title]));
			chaptersResult = await comix.getChapters(manga, { allPages: true });
		}

		if (!chaptersResult.items.length) {
			return await wait.update(t(locale, 'search.labels.noChaptersForTitle', [manga.title]));
		}

		const allChapters = chaptersResult.items.reverse();
		const safeName = manga.title.replace(/[^\w\s-]/g, '').trim();
		const sessionId = randomChar('abcdefghijklmnopqrstuvwxyz0123456789', 8);
		const state = { allChapters, currentBatch: 0, safeName, sessionId };

		readerSessions.set(sessionId, state);

		await wait.update(t(locale, 'search.labels.chaptersFoundFor', [allChapters.length, manga.title]));
		await sendBatch(state, from, message, client, { prefix, locale });
	}
});
