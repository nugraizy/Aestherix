import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { atsumaru } from '../../utils/atsumaru/index.js';
import { imageToPdf, mime } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'atsumaruread',
	minifiedDescription: 'Read Atsumaru Chapter',
	description: 'Download chapter pages from Atsumaru as a PDF.',
	usage: '!atsumaruread `<mangaId/chapterId>`',
	aliases: ['atread', 'atdl'],
	category: 'Search',
	cooldown: 10,
	limit: 3,
	status: 'enable',
	async run({ query, from, message }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.mangaIdRequired, message);
		}

		const input = query.trim();
		const [mangaId, chapterId] = input.split('/');

		if (!mangaId || !chapterId) {
			return await client.reply(from, t(locale, 'errors.invalidFormat', ['mangaId/chapterId']), message);
		}

		const wait = await client.waitMessage(from, L.success.fetchingPages, message);

		try {
			const manga = await atsumaru.getManga(mangaId).catch(() => null);
			const title = (manga?.title || mangaId)
				.replace(/[^\w\s-]/g, '')
				.trim()
				.replace(/\s+/g, '-')
				.toLowerCase();
			const pages = await atsumaru.getPages(mangaId, chapterId);

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
					fileName: `${title}-chapter-${chapterId}-atsumaru.pdf`
				},
				{ quoted: message }
			);

			await wait.update(`Done. ${pages.length} page(s) sent as PDF.`);
		} catch (error) {
			return await wait.update(`Error: ${error.message || 'Failed to fetch pages.'}`);
		}
	}
});
