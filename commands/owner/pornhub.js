/* global botNum */
import { numberWithCommas, removeDuplicatesArray } from '../../helper/modules/index.js';
import { arq } from '../../utils/arq/index.js';

export default {
	name: 'pornhub',
	description: 'Search pornhub',
	usage: '!pornhub <query>',
	category: 'Owner',
	aliases: ['ph', 'phub'],
	limit: 4,
	cooldown: 5,
	status: 'enable',
	async run({ query, from, message, args, type, isOwner }, client) {
		if (!isOwner) {
			return await client[botNum].reply({ from, quoted: message }, 'You must be the owner to use this command.');
		}

		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'You must provide a query.');
		}

		if ((args[1] == 'next' || args[1] == 'prev') && type == 'templateButtonReplyMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v.mainThumb == args[2]);

			return await client[botNum].sendMessage(
				from,
				{
					image: { url: data[index].mainThumb },
					caption: '``` • Pornhub ```',
					templateButtons: [
						{ urlButton: { displayText: 'Image Source', url: args[1] == 'next' ? data[index].mainThumb : data[index].mainThumb } },
						{ urlButton: { displayText: 'PHub Source', url: args[1] == 'next' ? data[index].url : data[index].url } },
						index + 1 !== data.length ? { quickReplyButton: { displayText: 'Next Post', id: `.phub next ${data[index + 1].mainThumb} ${JSON.stringify(data)}` } } : {},
						index !== 0 ? { quickReplyButton: { displayText: 'Previous Post', id: `.phub prev ${data[index - 1].mainThumb} ${JSON.stringify(data)}` } } : {},
					],
					footer: `Title : ${data[index].title}
Pornstars : ${data[index].pornstars.join(', ')}
Duration : ${data[index].duration}
Views : ${numberWithCommas(data[index].views)}
Ratings : ${data[index].rating.toFixed(2)}
Uploaded : ${data[index].uploaded}
Type : ${data[index].type}
Category : ${data[index].categories.join(', ')}
Tags : ${data[index].tags.join(', ')}
Void Bot     ${index + 1}/${data.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`,
				},
				{ quoted: message },
			);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const result = await arq.searchPHub(querie.trim());

			if ('error' in result || !result.ok) {
				await client[botNum].reply({ from, quoted: message }, JSON.stringify(result));
				continue;
			}

			await client[botNum].sendMessage(
				from,
				{
					image: { url: result.result[0].mainThumb },
					caption: '``` • Pornhub ```',
					templateButtons: [
						{ urlButton: { displayText: 'Image Source', url: result.result[0].mainThumb } },
						{ urlButton: { displayText: 'PHub Source', url: result.result[0].url } },
						result.result.length !== 1 ? { quickReplyButton: { displayText: 'Next Post', id: `.phub next ${result.result[1].mainThumb} ${JSON.stringify(result.result)}` } } : {},
					],
					footer: `Title : ${result.result[0].title}
Pornstars : ${result.result[0].pornstars.join(', ')}
Duration : ${result.result[0].duration}
Views : ${numberWithCommas(result.result[0].views)}
Ratings : ${result.result[0].rating.toFixed(2)}
Uploaded : ${result.result[0].uploaded}
Type : ${result.result[0].type}
Category : ${result.result[0].categories.join(', ')}
Tags : ${result.result[0].tags.join(', ')}
Void Bot     1/${result.result.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`,
				},
				{ quoted: message },
			);
		}
	},
};
