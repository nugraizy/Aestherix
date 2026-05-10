import { Kiryuu } from '../../utils/index.js';

const kiryuu = new Kiryuu();

/**
 * @param {import('../../utils/kiryuu/types/kiryuu').KiryuuManga} manga
 * @returns {string}
 */
const formatPopularCaption = (manga, index) =>
	`${index + 1}. ${manga.title} (${manga.type || '?'}) — ${manga.status || 'n/a'}`;

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
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
		const wait = await client.instance.waitMessage(from, 'Fetching popular comics...', message);

		try {
			const result = await kiryuu.searchManga('', { limit: 15 });

			if (!result?.length) {
				return await wait.update('No results found.');
			}

			const lines = result.map((manga, i) => formatPopularCaption(manga, i));
			const caption = lines.join('\n');

			const poster = result.items[0];

			if (poster.poster) {
				await client.instance.send(
					from,
					{
						image: { url: poster.poster },
						caption: `${'Kiryuu Popular'.formatHeaders()}\n\n${caption.formatForm()}`
					},
					{ quoted: message }
				);
			} else {
				await client.instance.reply(
					from,
					`${'Kiryuu Popular'.formatHeaders()}\n\n${caption.formatForm()}`,
					message
				);
			}

			await wait.update('Done.');
		} catch (error) {
			return await wait.update(`Error: ${error.message || 'Failed to fetch popular comics.'}`);
		}
	}
};
