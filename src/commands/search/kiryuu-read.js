import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { Kiryuu, imageToPdf, mime } from '../../utils/index.js';
import { randomChar } from '../../utils/modules/index.js';

const kiryuu = new Kiryuu();

const CHAPTERS_PER_BATCH = 20;

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
const downloadChapterAsPdf = async ({ from, message }, client, wait, chapterUrl, fileName) => {
	await wait.update('Fetching chapter pages...');

	const pages = await kiryuu.getChapterPages(chapterUrl);

	if (!pages.length) {
		return await wait.update('No pages found for this chapter.');
	}

	await wait.update(`Converting ${pages.length} page(s) to PDF...`);

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

	await wait.update(`Done. ${pages.length} page(s) sent as PDF.`);
};

async function sendBatch(state, from, message, client, ctx) {
	const { allChapters, currentBatch, safeName, sessionId } = state;
	const start = currentBatch * CHAPTERS_PER_BATCH;
	const batch = allChapters.slice(start, start + CHAPTERS_PER_BATCH);
	const totalBatches = Math.ceil(allChapters.length / CHAPTERS_PER_BATCH);
	const hasMore = currentBatch + 1 < totalBatches;

	const body = `${'Kiryuu Reader'.formatHeaders()}\n\n${safeName}\nTotal : ${allChapters.length} chapter(s)\nShowing : ${start + 1}–${start + batch.length}\n\nSelect a chapter to download as PDF.`;

	const builder = new client.TemplateBuilder.Native(client);

	builder
		.destination(from)
		.body(body)
		.footer('Powered by ' + __botName);

	const buttons = batch.map((ch) => {
		const label = `${ch.number} — ${ch.name}`.slice(0, 40);

		return builder.button.reply({ display: label, id: cmdId('kyread', ch.url, ctx) });
	});

	if (hasMore) {
		buttons.push(builder.button.reply({ display: '➡️ More Chapters', id: cmdId('kyread', 'next ' + sessionId, ctx) }));
	}

	builder.buttons(...buttons);

	await builder.send();
}

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
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
		if (!query) {
			return await client.reply(
				from,
				'Please provide a chapter URL or a search query.\n\nExamples:\n• !kyread https://v5.kiryuu.to/...\n• !kyread Solo Leveling',
				message
			);
		}

		const input = query.trim();

		if (input.startsWith('next ')) {
			const sessionId = input.slice(5);
			const cached = readerSessions.get(sessionId);

			if (!cached) {
				return await client.reply(from, 'Session expired. Please search again.', message);
			}

			cached.currentBatch++;
			return await sendBatch(cached, from, message, client, { prefix });
		}

		const wait = await client.waitMessage(from, 'Processing...', message);

		if (isChapterInput(input)) {
			const fileName = input.split('/').filter(Boolean).pop() || 'kiryuu-chapter';

			return await downloadChapterAsPdf({ from, message }, client, wait, input, fileName);
		}

		await wait.update('Searching...');

		const result = await kiryuu.searchManga(input, { limit: 1 });

		if (!result?.length) {
			return await wait.update('No manga found for that query.');
		}

		const manga = result[0];

		await wait.update(`Found: ${manga.title}\nFetching chapters...`);

		const chaptersResult = await kiryuu.getChapters(manga);

		if (!chaptersResult.length) {
			return await wait.update(`No chapters found for "${manga.title}".`);
		}

		const allChapters = chaptersResult.reverse();
		const safeName = manga.title.replace(/[^\w\s-]/g, '').trim();
		const sessionId = randomChar('abcdefghijklmnopqrstuvwxyz0123456789', 8);
		const state = { allChapters, currentBatch: 0, safeName, sessionId };

		readerSessions.set(sessionId, state);

		await wait.update(`${allChapters.length} chapter(s) found for "${manga.title}".`);
		await sendBatch(state, from, message, client, { prefix });
	}
};
