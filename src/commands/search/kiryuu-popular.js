import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { kiryuu } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

/**
 * @param {import('../../utils/kiryuu/types/kiryuu').KiryuuManga} manga
 * @returns {string}
 */
const formatPopularCaption = (manga, index) =>
	`${index + 1}. ${manga.title} (${manga.type || '?'}) — ${manga.status || 'n/a'}`;

export default defineCommand({
	name: 'kiryuupopular',
	minifiedDescription: 'Popular Kiryuu',
	description: 'Show popular manga/manhwa/manhua on Kiryuu.',
	usage: '!kiryuupopular',
	aliases: ['kypopular', 'kyhot', 'kytop'],
	category: 'Search',
	cooldown: 8,
	limit: 3,
	status: 'enable',
	async run({ from, message }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Ls = useLocale(locale, 'search');
		const wait = await client.waitMessage(from, L.success.fetchingPopular, message);

		try {
			const result = await kiryuu.searchManga('', { limit: 15 });

			if (!result?.length) {
				return await wait.update(Ls.labels.noResults);
			}

			const lines = result.map((manga, i) => formatPopularCaption(manga, i));
			const caption = lines.join('\n');

			const poster = result[0];

			if (poster.poster) {
				await client.send(
					from,
					{
						image: { url: poster.poster },
						caption: `${Ls.titles.kiryuuPopular.formatHeaders()}\n\n${caption.formatForm()}`
					},
					{ quoted: message }
				);
			} else {
				await client.reply(from, `${Ls.titles.kiryuuPopular.formatHeaders()}\n\n${caption.formatForm()}`, message);
			}

			await wait.update(Ls.labels.done || 'Done.');
		} catch (error) {
			return await wait.update(`Error: ${error.message || Ls.labels.fetchFailed || 'Failed to fetch popular comics.'}`);
		}
	}
});
