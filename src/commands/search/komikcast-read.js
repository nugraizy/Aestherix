import { komikcast, mime } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'komikcastread',
	minifiedDescription: 'Read Komikcast Chapter',
	description: 'Download chapter pages from Komikcast as a PDF.',
	usage: '!komikcastread `<slug/chapterIndex>`',
	aliases: ['kcread', 'kcdl'],
	category: 'Search',
	cooldown: 10,
	limit: 3,
	status: 'enable',
	async run({ query, from, message }, client) {
		if (!query) {
			return await client.reply(from, 'Please provide a slug/chapterIndex.', message);
		}

		const input = query.trim();
		const slashIndex = input.indexOf('/');
		const slug = slashIndex === -1 ? input : input.slice(0, slashIndex);
		let chapterIndex = slashIndex === -1 ? null : input.slice(slashIndex + 1);

		const wait = await client.waitMessage(from, 'Fetching chapter pages...', message);

		try {
			const manga = await komikcast.getManga(slug).catch(() => null);

			if (!chapterIndex) {
				const chapters = await komikcast.getChapters(slug);

				if (!chapters.length) {
					return await wait.update('No chapters found for this comic.');
				}

				chapterIndex = [...chapters].sort((a, b) => a.number - b.number)[0].id;
			}

			const pages = await komikcast.getPages(slug, chapterIndex);

			if (!pages.length) {
				return await wait.update('No pages found for this chapter.');
			}

			await wait.update(`Converting ${pages.length} page(s) to PDF...`);

			const title = (manga?.title || slug)
				.replace(/[^\w\s-]/g, '')
				.trim()
				.replace(/\s+/g, '-')
				.toLowerCase();
			const buffer = await komikcast.toPdf(pages.map((p) => p.url));

			await client.send(
				from,
				{
					document: Buffer.from(buffer, 'base64'),
					mimetype: mime('pdf'),
					fileName: `${title}-chapter-${chapterIndex}-komikcast.pdf`
				},
				{ quoted: message }
			);

			await wait.update(`Done. ${pages.length} page(s) sent as PDF.`);
		} catch (error) {
			return await wait.update(`Error: ${error.message || 'Failed to fetch pages.'}`);
		}
	}
});
