import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { comix } from '../../utils/index.js';
import { defineCommand } from '../_define.js';



/**
 * @param {import('../../utils/comix/types/comix').ComixManga} manga
 * @returns {string}
 */
const formatPopularCaption = (manga, index) =>
	`${index + 1}. ${manga.title} (${manga.type || '?'}) — ⭐ ${manga.rating || 'n/a'} — ${manga.status || 'n/a'}`;

export default defineCommand({
	name: 'comixpopular',
	minifiedDescription: 'Popular Comix',
	description: 'Show popular manga/manhwa/manhua on Comix.',
	usage: '!comixpopular',
	aliases: ['cxpopular', 'cxhot', 'cxtop'],
	category: 'Search',
	cooldown: 8,
	limit: 3,
	status: 'enable',
	async run({ from, message }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const wait = await client.waitMessage(from, L.success.fetchingPopular, message);

		const result = await comix.getComics({
			sort: 'views_7d',
			order: 'desc',
			limit: 15,
			excludeNsfw: true,
			posterQuality: 'medium'
		});

		if (!result.items.length) {
			return await wait.update('No results found.');
		}

		const lines = result.items.map((manga, i) => formatPopularCaption(manga, i));
		const caption = lines.join('\n');

		const poster = result.items[0];

		if (poster.poster) {
			await client.send(
				from,
				{
					image: { url: poster.poster },
					caption: `${'Comix Popular (7 Days)'.formatHeaders()}\n\n${caption.formatForm()}`
				},
				{ quoted: message }
			);
		} else {
			await client.reply(from, `${'Comix Popular (7 Days)'.formatHeaders()}\n\n${caption.formatForm()}`, message);
		}

		await wait.update('Done.');
	}
});
