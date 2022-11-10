/* global botNum */
import { numberWithCommas, removeDuplicatesArray } from '../../helper/modules/index.js';
import { FlickerAPI } from '../../utils/flickr/index.js';

export default {
	name: 'flickr',
	description: 'Search images from Flickr',
	usage: '!flickr <query>',
	category: 'Search',
	aliases: ['flick'],
	limit: 4,
	cooldown: 5,
	status: 'enable',
	async run({ query, from, message, args, type }, client) {
		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'You must provide a query.');
		}

		if ((args[1] == 'next' || args[1] == 'prev') && type == 'templateButtonReplyMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v.download == args[2]);

			return await client[botNum].sendMessage(
				from,
				{
					image: { url: data[index].download },
					caption: '``` • Flickr ```',
					templateButtons: [
						{ urlButton: { displayText: 'Flickr Source', url: args[1] == 'next' ? data[index].source : data[index].source } },
						index + 1 !== data.length ? { quickReplyButton: { displayText: 'Next Image', id: `.flickr next ${data[index + 1].download} ${JSON.stringify(data)}` } } : {},
						index !== 0 ? { quickReplyButton: { displayText: 'Previous Image', id: `.flickr prev ${data[index - 1].download} ${JSON.stringify(data)}` } } : {},
					],
					footer: `Author : ${data[index].userName}
Author Fullname : ${data[index].fullName}
Views : ${numberWithCommas(data[index].views)}
Title : ${data[index].title}
Description : ${data[index].description}
Tags : ${data[index].tags || 'n/a'}
Published : ${data[index].posted}
Void Bot     ${index + 1}/${data.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`,
				},
				{ quoted: message },
			);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const flickr = new FlickerAPI();
			let result = await flickr.searchImages(querie.trim());

			if ('error' in result) {
				await client[botNum].reply({ from, quoted: message }, result.error);
				continue;
			}

			result.forEach((v) => {
				return (v.description = v.description.substring(0, 20));
			});

			result = result.filter((v) => v.title.toLowerCase().includes(querie.toLowerCase()));

			await client[botNum].sendMessage(
				from,
				{
					image: { url: result[0].download },
					caption: '``` • Flickr ```',
					templateButtons: [
						{ urlButton: { displayText: 'Flickr Source', url: result[0].source } },
						result.length !== 1 ? { quickReplyButton: { displayText: 'Next Image', id: `.flickr next ${result[1].download} ${JSON.stringify(result)}` } } : {},
					],
					footer: `Author : ${result[0].userName}
Author Fullname : ${result[0].fullName}
Views : ${numberWithCommas(result[0].views)}
Title : ${result[0].title}
Description : ${result[0].description}
Tags : ${result[0].tags || 'n/a'}
Published : ${result[0].posted}
Void Bot     1/${result.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`,
				},
				{ quoted: message },
			);
		}
	},
};
