import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { BOT_NAME } from '../../core/constants.js';

import { cmdId } from '../../helper/modules/prefix.js';
import { kiryuu } from '../../utils/index.js';
import { defineCommand } from '../_define.js';


/**
 * @param {import('../../utils/kiryuu/types/kiryuu').KiryuuManga} manga
 * @returns {string}
 */
const formatDetailCaption = (manga) => {
	const lines = [
		`Title : ${manga.title}`,
		`Type : ${manga.type || 'n/a'}`,
		`Status : ${manga.status || 'n/a'}`,
		`Authors : ${manga.authors.length ? manga.authors.join(', ') : 'n/a'}`,
		`Artists : ${manga.artists.length ? manga.artists.join(', ') : 'n/a'}`,
		`Genres : ${manga.genres.length ? manga.genres.join(', ') : 'n/a'}`
	];

	if (manga.altTitles?.length) {
		lines.push(`Alt Titles : ${manga.altTitles.slice(0, 5).join(', ')}`);
	}

	lines.push('');

	if (manga.synopsis) {
		const trimmed = manga.synopsis.length > 500 ? manga.synopsis.slice(0, 500) + '...' : manga.synopsis;

		lines.push(`Synopsis :\n${trimmed}`);
	}

	lines.push(`\nURL : ${manga.originalUrl || `https://v5.kiryuu.to/manga/${manga.slug}`}`);

	return lines.join('\n');
};

export default defineCommand({
	name: 'kiryuudetail',
	minifiedDescription: 'Kiryuu Detail',
	description: 'Get detail of a manga/manhwa/manhua on Kiryuu by slug, ID, or URL.',
	usage: '!kiryuudetail `<slug/id/url>`',
	aliases: ['kydetail', 'kyinfo'],
	category: 'Search',
	cooldown: 5,
	limit: 5,
	status: 'enable',
	async run({ query, from, message, prefix }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.mangaSlugRequired, message);
		}

		const wait = await client.waitMessage(from, L.success.fetchingDetail, message);

		try {
			const manga = await kiryuu.getManga(query.trim());
			const caption = formatDetailCaption(manga);
			const body = `${'Kiryuu Detail'.formatHeaders()}\n\n${caption.formatForm()}`;

			const builder = new client.TemplateBuilder.Native();

			builder
				.destination(from)
				.body(body)
				.footer('Powered by ' + BOT_NAME)
				.buttons(
					builder.button.reply({ display: '📖 Chapters', id: cmdId('kych', manga.slug, { prefix }) }),
					builder.button.reply({ display: '📕 Read', id: cmdId('kyread', manga.slug, { prefix }) })
				);

			if (manga.poster) {
				builder.header('image', manga.poster);
			}

			await builder.send();
			await wait.update('Detail fetched.');
		} catch (error) {
			return await wait.update(`Error: ${error.message || 'Manga not found.'}`);
		}
	}
});
