import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { BOT_NAME } from '../../core/constants.js';

import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { kiryuu, imageToPdf, mime } from '../../utils/index.js';
import { randomChar } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';



const CHAPTERS_PER_BATCH = 19;

const readerSessions = new Cache();

/**
 * Checks whether the input looks like a Kiryuu URL rather than a free-text search query.
 * @param {string} input
 * @returns {boolean}
 */
const isChapterInput = (input) => {
	try {
		const url = new URL(input);

		return url.host.replace(/^www\./, '') === 'v5.kiryuu.to';
	} catch {
		return false;
	}
};

/**
 * Downloads chapter pages and sends as PDF.
 * @param {object} ctx
 * @param {string} chapterUrl
 * @param {string} fileName
 */
const downloadChapterAsPdf = async ({ from, message }, client, wait, chapterUrl, fileName, locale) => {
	const L = useLocale(locale, 'common');

	await wait.update(L.success.fetchingPages);

	const pages = await kiryuu.getChapterPages(chapterUrl);

	if (!pages.length) {
		return await wait.update(L.core.errors.noPagesFound);
	}

	await wait.update(t(locale, 'common.core.progress.convertingToPdf', [pages.length]));

	const buffer = await imageToPdf(pages);

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

	const body = `${Ls.titles.kiryuuReader.formatHeaders()}\n\n${safeName}\n${t(ctx.locale, 'search.labels.chapterTotal', [allChapters.length])}\n${t(ctx.locale, 'search.labels.showing', [start + 1, start + batch.length])}\n\n${Ls.labels.selectChapter}`;

	const builder = new client.TemplateBuilder.Native();

	builder
		.destination(from)
		.body(body)
		.footer('Powered by ' + BOT_NAME);

	const buttons = batch.map((ch) => {
		const label = `${ch.number} — ${ch.name}`.slice(0, 40);

		return builder.button.reply({ display: label, id: cmdId('kyread', ch.url, ctx) });
	});

	if (hasMore) {
		buttons.push(builder.button.reply({ display: Ls.buttons.moreChapters, id: cmdId('kyread', 'next ' + sessionId, ctx) }));
	}

	builder.buttons(...buttons);

	await builder.send();
}

export default defineCommand({
	name: 'kiryuuread',
	minifiedDescription: 'Read Kiryuu Chapter',
	description:
		'Download chapter pages from Kiryuu as a PDF. Provide a chapter URL or a search query to find and pick a chapter.',
	usage: '!kiryuuread `<chapter-url/query>`',
	aliases: ['kyread', 'kydl', 'kiryuudl'],
	category: 'Search',
	cooldown: 10,
	limit: 3,
	status: 'enable',
	async run({ query, from, message, prefix }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Ls = useLocale(locale, 'search');

		if (!query) {
			return await client.reply(from, t(locale, 'search.labels.chapterUrlHelp', [`${prefix}kyread`]), message);
		}

		const input = query.trim();

		if (input.startsWith('next ')) {
			const sessionId = input.slice(5);
			const cached = readerSessions.get(sessionId);

			if (!cached) {
				return await client.reply(from, L.errors.sessionExpired, message);
			}

			cached.currentBatch++;
			return await sendBatch(cached, from, message, client, { prefix });
		}

		const wait = await client.waitMessage(from, L.success.processing, message);

		if (isChapterInput(input)) {
			const slug = input.split('/').filter(Boolean).pop() || 'kiryuu-chapter';
			const session = [...readerSessions.entries()].find(([, s]) => s.allChapters.some((c) => c.url === input));
			const title = session?.[1]?.safeName || 'kiryuu';
			const ch = session?.[1]?.allChapters.find((c) => c.url === input);
			const chNum = ch?.number || slug.match(/chapter[- ]?(\d+)/i)?.[1] || slug;
			const fileName = `${title}-chapter-${chNum}-kiryuu`.replace(/\s+/g, '-').toLowerCase();

			return await downloadChapterAsPdf({ from, message }, client, wait, input, fileName, locale);
		}

		await wait.update(L.success.searching);

		const result = await kiryuu.searchManga(input, { limit: 1 });

		if (!result?.length) {
			return await wait.update(Ls.labels.noMangaFound);
		}

		const manga = result[0];

		await wait.update(t(locale, 'search.labels.foundFetchingChapters', [manga.title]));

		const chaptersResult = await kiryuu.getChapters(manga);

		if (!chaptersResult.length) {
			return await wait.update(t(locale, 'search.labels.noChaptersForTitle', [manga.title]));
		}

		const allChapters = chaptersResult.reverse();
		const safeName = manga.title.replace(/[^\w\s-]/g, '').trim();
		const sessionId = randomChar('abcdefghijklmnopqrstuvwxyz0123456789', 8);
		const state = { allChapters, currentBatch: 0, safeName, sessionId };

		readerSessions.set(sessionId, state);

		await wait.update(t(locale, 'search.labels.chaptersFoundFor', [allChapters.length, manga.title]));
		await sendBatch(state, from, message, client, { prefix, locale });
	}
});
