import { removeDuplicatesArray } from '../../utils/modules/index.js';
import { arq } from '../../utils/arq/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
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
		if (!query) {
			return await client.instance.reply('You must provide a query.', { from, quoted: message });
		}

		if ((args[1] === 'next' || args[1] === 'prev') && type === 'templateButtonReplyMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v === args[2]);

			return await client.instance.send(
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
										id: `.wallpaper next ${data[index + 1]} ${JSON.stringify(data)}`
									}
							  } /* eslint-disable-line */
							: {},
						index !== 0
							? {
									quickReplyButton: {
										displayText: 'Previous Image',
										id: `.wallpaper prev ${data[index - 1]} ${JSON.stringify(data)}`
									}
							  } /* eslint-disable-line */
							: {}
					],
					footer: `Void Bot     ${index + 1}/${data.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`
				},
				{ quoted: message }
			);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			let result = await arq.searchWallpaperARQ(querie.trim());

			if (result?.error || !result.ok) {
				await client.instance.reply(JSON.stringify(result), { from, quoted: message });
				continue;
			}

			result = result.result.map((v) => v.url_image);
			await client.instance.send(
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
										id: `.wallpaper next ${result[1]} ${JSON.stringify(result)}`
									}
							  } /* eslint-disable-line */
							: {}
					],
					footer: `Void Bot     1/${result.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`
				},
				{ quoted: message }
			);
		}
	}
};
