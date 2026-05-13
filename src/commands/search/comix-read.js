import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { Comix, imageToPdf, mime } from '../../utils/index.js';
import { randomChar } from '../../utils/modules/index.js';

const comix = new Comix();

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
const downloadChapterAsPdf = async ({ from, message }, client, wait, chapterId, chapterUrl, fileName) => {
	await wait.update('Fetching chapter pages...');

	const pages = await comix.getChapterPages({ id: chapterId, chapterId, url: chapterUrl });

	if (!pages.length) {
		return await wait.update('No pages found for this chapter.');
	}

	await wait.update(`Converting ${pages.length} page(s) to PDF...`);

	const imageUrls = pages.map((page) => page.url);
	const buffer = await imageToPdf(imageUrls);

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

	const body = `${'Comix Reader'.formatHeaders()}\n\n${safeName}\nTotal : ${allChapters.length} chapter(s)\nShowing : ${start + 1}–${start + batch.length}\n\nSelect a chapter to download as PDF.`;

	const builder = new client.TemplateBuilder.Native();

	builder
		.destination(from)
		.body(body)
		.footer('Powered by ' + __botName);

	const buttons = batch.map((ch) => {
		const label = `Ch. ${ch.number} — ${ch.name}`.slice(0, 40);

		return builder.button.reply({ display: label, id: cmdId('cxread', ch.id, ctx) });
	});

	if (hasMore) {
		buttons.push(builder.button.reply({ display: '➡️ More Chapters', id: cmdId('cxread', 'next ' + sessionId, ctx) }));
	}

	builder.buttons(...buttons);

	await builder.send();
}

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
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
		if (!query) {
			return await client.reply(
				from,
				'Please provide a chapter ID, Comix URL, or a search query.\n\nExamples:\n• !cxread 12345\n• !cxread https://comix.to/title/...\n• !cxread Solo Leveling',
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
			let chapterId = input;
			let chapterUrl;

			if (input.includes(':')) {
				const [slug, id] = input.split(':');

				chapterId = id;
				chapterUrl = `https://comix.to/title/${slug}/${id}-chapter-1`;
			}

			const cached = comix.getChapterById(chapterId);

			if (cached?.url) {
				chapterUrl = cached.url;
			}

			return await downloadChapterAsPdf({ from, message }, client, wait, chapterId, chapterUrl, `comix-chapter-${chapterId}`);
		}

		await wait.update('Fetching chapters...');

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
			await wait.update('Searching...');

			const result = await comix.search(input, { limit: 1, excludeNsfw: true });

			if (!result.items.length) {
				return await wait.update('No manga found for that query.');
			}

			manga = result.items[0];
			await wait.update(`Found: ${manga.title}\nFetching chapters...`);
			chaptersResult = await comix.getChapters(manga, { allPages: true });
		}

		if (!chaptersResult.items.length) {
			return await wait.update(`No chapters found for "${manga.title}".`);
		}

		const allChapters = chaptersResult.items.reverse();
		const safeName = manga.title.replace(/[^\w\s-]/g, '').trim();
		const sessionId = randomChar('abcdefghijklmnopqrstuvwxyz0123456789', 8);
		const state = { allChapters, currentBatch: 0, safeName, sessionId };

		readerSessions.set(sessionId, state);

		await wait.update(`${allChapters.length} chapter(s) found for "${manga.title}".`);
		await sendBatch(state, from, message, client, { prefix });
	}
};
