import { numberWithCommas, removeDuplicatesArray } from '../../utils/modules/index.js';
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
	async run({ query, from, message, args, type, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'You must provide a query.');
		}

		if ((args[1] === 'next' || args[1] === 'prev') && type === 'templateButtonReplyMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v.download === args[2]);

			return await client[botNum].send(
				from,
				{
					image: { url: data[index].download },
					caption: 'Flickr'.formatHeaders(),
					templateButtons: [
						{ urlButton: { displayText: 'Flickr Source', url: args[1] === 'next' ? data[index].source : data[index].source } },
						index + 1 !== data.length
							? {
									quickReplyButton: {
										displayText: 'Next Image',
										id: `.flickr next ${data[index + 1].download} ${JSON.stringify(data)}`
									}
							  } /* eslint-disable-line */
							: {},
						index !== 0
							? {
									quickReplyButton: {
										displayText: 'Previous Image',
										id: `.flickr prev ${data[index - 1].download} ${JSON.stringify(data)}`
									}
							  } /* eslint-disable-line */
							: {}
					],
					footer: `Author : ${data[index].userName}
Author Fullname : ${data[index].fullName}
Views : ${numberWithCommas(data[index].views)}
Title : ${data[index].title}
Description : ${data[index].description}
Tags : ${data[index].tags || 'n/a'}
Published : ${data[index].posted}
Void Bot     ${index + 1}/${data.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`
				},
				{ groupMetadata, quoted: message }
			);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const flickr = new FlickerAPI();
			let result = await flickr.searchImages(querie.trim());

			if ('error' in result) {
				await client[botNum].reply({ groupMetadata, from, quoted: message }, result.error);
				continue;
			}

			result.forEach((v) => {
				return (v.description = v.description.substring(0, 20));
			});

			result = result.filter((v) => v.title.toLowerCase().includes(querie.toLowerCase()));

			const index = ~~(Math.random() * result.length);

			await client[botNum].send(
				from,
				{
					image: { url: result[index].download },
					caption: 'Flickr'.formatHeaders(),
					templateButtons: [
						{ urlButton: { displayText: 'Flickr Source', url: result[0].source } },
						result.length !== 1
							? {
									quickReplyButton: {
										displayText: 'Next Image',
										id: `.flickr next ${result[1].download} ${JSON.stringify(result)}`
									}
							  } /* eslint-disable-line */
							: {}
					],
					footer: `Author : ${result[index].userName}
Author Fullname : ${result[index].fullName}
Views : ${numberWithCommas(result[index].views)}
Title : ${result[index].title}
Description : ${result[index].description}
Tags : ${result[index].tags || 'n/a'}
Published : ${result[index].posted}
\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`
				},
				{ groupMetadata, quoted: message }
			);
		}
	}
};
