import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { imageToPdf, mime } from '../../utils/index.js';
import { shinigami } from '../../utils/shinigami/index.js';
import { defineCommand } from '../_define.js';


export default defineCommand({
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
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.chaptersRequired, message);
		}

		const input = query.trim();
		const slashIndex = input.indexOf('/');

		if (slashIndex === -1) {
			return await client.reply(from, t(locale, 'common.errors.invalidFormat', ['mangaId/chapterId']), message);
		}

		const mangaId = input.slice(0, slashIndex);
		const chapterId = input.slice(slashIndex + 1);

		const wait = await client.waitMessage(from, L.success.fetchingPages, message);

		try {
			const manga = await shinigami.getManga(mangaId).catch(() => null);
			const title = (manga?.title || mangaId)
				.replace(/[^\w\s-]/g, '')
				.trim()
				.replace(/\s+/g, '-')
				.toLowerCase();
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
					fileName: `${title}-chapter-${chapterId}-shinigami.pdf`
				},
				{ quoted: message }
			);

			await wait.update(`Done. ${pages.length} page(s) sent as PDF.`);
		} catch (error) {
			return await wait.update(`Error: ${error.message || 'Failed to fetch pages.'}`);
		}
	}
});
