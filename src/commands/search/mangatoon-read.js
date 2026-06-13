import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { imageToPdf, mime } from '../../utils/index.js';
import { mangatoon } from '../../utils/mangatoon/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'mangatoonread',
	minifiedDescription: 'Read MangaToon Chapter',
	description: 'Download a MangaToon chapter as PDF. Provide a chapter URL from MangaToon.',
	usage: '!mangatoonread `<chapter-url>`',
	aliases: ['mtread', 'mtdl'],
	category: 'Search',
	cooldown: 10,
	limit: 3,
	status: 'enable',
	async run({ query, from, message }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.mangaUrlRequired, message);
		}

		const url = query.trim();

		if (!url.includes('mangatoon.mobi')) {
			return await client.reply(from, L.errors.mangaUrlRequired, message);
		}

		const wait = await client.waitMessage(from, L.success.fetchingPages, message);

		try {
			const result = await mangatoon.getChapter(url);

			if (result.error) {
				return await wait.update(result.error);
			}

			await wait.update(`Converting ${result.pages.length} page(s) to PDF...`);

			const buffer = await imageToPdf(result.pages);

			await client.send(
				from,
				{
					document: Buffer.from(buffer, 'base64'),
					mimetype: mime('pdf'),
					fileName: `mangatoon-chapter.pdf`
				},
				{ quoted: message }
			);

			await wait.update(`Done. ${result.pages.length} page(s) sent as PDF.`);
		} catch (error) {
			return await wait.update(`Error: ${error.message || 'Failed to fetch pages.'}`);
		}
	}
});
