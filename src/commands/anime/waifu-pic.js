import parser from 'yargs-parser';

import { removeDuplicatesArray, getWaifu, gifToMp4 } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'waifupic',
	minifiedDescription: 'Random Waifupics',
	description: 'Search images from waifu pics',
	usage: '!waifupic <query>',
	category: 'Anime',
	aliases: ['wpic'],
	limit: 4,
	cooldown: 5,
	status: 'enable',
	async run({ query, from, message, args, sender }, client) {
		if (!query) {
			return await client.instance.reply('You must provide a query.', { from, quoted: message });
		}

		if (args[1] === 'next' || args[1] === 'prev') {
			let buffer;

			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(5).join(' '))));
			const index = data.findIndex((v) => v === args[4]);
			const isGif = data[index].endsWith('gif');

			if (isGif) {
				buffer = await gifToMp4(data[index], sender);
			}

			return await client.instance.send(
				from,
				{
					...(isGif ? { video: buffer, gifPlayback: true } : { image: { url: data[index] } }),
					caption: 'Waifu Pics'.formatHeaders(),
					templateButtons: [
						{ urlButton: { displayText: 'Image Source', url: args[1] === 'next' ? data[index] : data[index] } },
						index + 1 !== data.length
							? {
									quickReplyButton: {
										displayText: 'Next Image',
										id: `.waifupic next ${args[2]} ${args[3]} ${data[index + 1]} ${JSON.stringify(data)}`
									}
							  } /* eslint-disable-line */
							: {
									quickReplyButton: {
										displayText: `Search More ${args[2].capitalize()}`,
										id: `.waifupic ${args[2]} -${args[3]}`
									}
							  } /* eslint-disable-line */,
						index !== 0
							? {
									quickReplyButton: {
										displayText: 'Previous Image',
										id: `.waifupic prev ${args[2]} ${args[3]} ${data[index - 1]} ${JSON.stringify(data)}`
									}
							  } /* eslint-disable-line */
							: {}
					],
					footer: `Provided by waifu.pics\nVoid Bot     ${index + 1}/${data.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`
				},
				{ quoted: message }
			);
		}

		let { _: queries, nsfw } = parser(query.toLowerCase(), {
			configuration: {
				'short-option-groups': false
			},
			alias: {
				nsfw: ['nsfw', 'notsafe'],
				sfw: ['safe', 'sfw']
			}
		});

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const result = await getWaifu(querie.trim(), nsfw ? 'nsfw' : 'sfw');

			if (result?.error) {
				await client.instance.reply(result.error, { from, quoted: message });

				continue;
			}

			let buffer;
			const isGif = result[0].endsWith('gif');

			if (isGif) {
				buffer = await gifToMp4(result[0], sender);
			}

			await client.instance.send(
				from,
				{
					...(isGif ? { video: buffer } : { image: { url: result[0] } }),
					image: { url: result[0] },
					caption: 'Waifu Pics'.formatHeaders(),
					templateButtons: [
						{ urlButton: { displayText: 'Image Source', url: result[0] } },
						result.length !== 1
							? {
									quickReplyButton: {
										displayText: 'Next Image',
										id: `.waifupic next ${querie} ${nsfw ? 'nsfw' : 'sfw'} ${result[1]} ${JSON.stringify(result)}`
									}
							  } /* eslint-disable-line */
							: {}
					],
					footer: `Provided by waifu.pics\nVoid Bot     1/${result.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`
				},
				{ quoted: message }
			);
		}
	}
};
