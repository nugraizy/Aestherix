import { Shinigami } from '../../utils/shinigami/index.js';
import { imageToPdf, mime } from '../../utils/index.js';

const shinigami = new Shinigami();

export default {
	name: 'shinigamiread',
	minifiedDescription: 'Read Shinigami Chapter',
	description: 'Download chapter pages from Shinigami as a PDF.',
	usage: '!shinigamiread `<mangaId/chapterId>`',
	aliases: ['sgread', 'sgdl'],
	category: 'Search',
	cooldown: 10,
	limit: 3,
	status: 'enable',
	async run({ query, from, message }, client) {
		if (!query) {
			return await client.reply(from, 'Please provide mangaId/chapterId.', message);
		}

		const input = query.trim();
		const slashIndex = input.indexOf('/');

		if (slashIndex === -1) {
			return await client.reply(from, 'Invalid format. Use: mangaId/chapterId', message);
		}

		const chapterId = input.slice(slashIndex + 1);

		const wait = await client.waitMessage(from, 'Fetching chapter pages...', message);

		try {
			const pages = await shinigami.getPages(chapterId);

			if (!pages.length) {
				return await wait.update('No pages found for this chapter.');
			}

			await wait.update(`Converting ${pages.length} page(s) to PDF...`);

			const urls = pages.map((p) => p.url);
			const buffer = await imageToPdf(urls);

			await client.send(
				from,
				{
					document: Buffer.from(buffer, 'base64'),
					mimetype: mime('pdf'),
					fileName: `shinigami-${chapterId}.pdf`
				},
				{ quoted: message }
			);

			await wait.update(`Done. ${pages.length} page(s) sent as PDF.`);
		} catch (error) {
			return await wait.update(`Error: ${error.message || 'Failed to fetch pages.'}`);
		}
	}
};
