import { numberWithCommas, removeDuplicatesArray } from '../../utils/modules/index.js';
import { downloadDeviantArt } from '../../utils/deviant_art/index.js';

const regex = (input) => {
	const reg = /^https?:\/\/(www\.)?deviantart\.com\/[0-9a-bA-Z-?]*\/art\/[0-9a-zA-Z-?]*[0-9]*/gi;
	const isDeviant = reg.test(input);

	if (isDeviant) {
		const match = input.match(/\d{8,10}/g);

		if (!match) {
			return { status: false, message: 'DeviantArt code not found on your URL. Try another URL.' };
		}

		return { status: true, message: match[0] };
	}

	return { status: false, message: 'This URL is not a valid Deviant Art URL. Try another URL.' };
};

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'deviantartdl',
	description: 'Download images from Deviant Art',
	usage: '!deviantartdl <url>',
	category: 'Downloader',
	aliases: ['dvartdl', 'devartdl'],
	limit: 4,
	cooldown: 8,
	status: 'enable',
	async run({ query, from, message, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply('You must provide a query.', { from, quoted: message, groupMetadata });
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const regexs = regex(querie.trim());

			if (!regexs.status) {
				await client[botNum].reply(regexs.message);

				continue;
			}

			const result = await downloadDeviantArt(querie);

			if ('error' in result) {
				await client[botNum].reply(result.error);

				continue;
			}

			await client[botNum].send(
				from,
				{
					image: { url: result.image },
					caption: 'Deviant Art'.formatHeaders(),
					templateButtons: [
						{ urlButton: { displayText: 'Image Source', url: result.image } },
						{ urlButton: { displayText: 'Deviant Art Source', url: result.source } }
					],
					footer: `Title : ${result.author.capitalize()}
Author : ${result.author}
Favourites : ${numberWithCommas(result.favourites)}
Views : ${numberWithCommas(result.views)}`
				},
				{ groupMetadata, quoted: message }
			);
		}
	}
};
