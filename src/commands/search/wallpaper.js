import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { arq } from '../../utils/arq/index.js';
import { removeDuplicatesArray } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'wallpaper',
	minifiedDescription: 'Search Wallpaper',
	description: 'Search wallpaper.',
	usage: '!wallpaper `<query>`',
	category: 'Search',
	aliases: ['wall'],
	limit: 4,
	cooldown: 5,
	status: 'enable',
	async run({ query, from, message, args, type }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.noQuery, message);
		}

		if ((args[1] === 'next' || args[1] === 'prev') && type === 'templateButtonReplyMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v === args[2]);

			return await client.send(
				from,
				{
					image: { url: data[index] },
					caption: 'Wallpaper'.formatHeaders(),
					templateButtons: [
						{ urlButton: { displayText: 'Image Source', url: args[1] === 'next' ? data[index] : data[index] } },
						index + 1 !== data.length
							? {
									quickReplyButton: {
										displayText: 'Next Image',
										id: cmdId('wallpaper', `next ${data[index + 1]} ${JSON.stringify(data)}`)
									}
								}
							: {},
						index !== 0
							? {
									quickReplyButton: {
										displayText: 'Previous Image',
										id: cmdId('wallpaper', `prev ${data[index - 1]} ${JSON.stringify(data)}`)
									}
								}
							: {}
					],
					footer: `${index + 1}/${data.length}\nPowered by Hidden Finder`
				},
				{ quoted: message }
			);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			let result = await arq.searchWallpaperARQ(querie.trim());

			if (result?.error || !result.ok) {
				await client.reply(from, JSON.stringify(result), message);
				continue;
			}

			result = result.result.map((v) => v.url_image);
			await client.send(
				from,
				{
					image: { url: result[0] },
					caption: 'Wallpaper'.formatHeaders(),
					templateButtons: [
						{ urlButton: { displayText: 'Image Source', url: result[0] } },
						result.length !== 1
							? {
									quickReplyButton: {
										displayText: 'Next Image',
										id: cmdId('wallpaper', `next ${result[1]} ${JSON.stringify(result)}`)
									}
								}
							: {}
					],
					footer: `1/${result.length}\nPowered by Hidden Finder`
				},
				{ quoted: message }
			);
		}
	}
});
