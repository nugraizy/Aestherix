import fs from 'fs';
import path from 'path';

import { isURL } from '../../utils/modules/index.js';
import { yandex } from '../../utils/image_reverse_search/index.js';

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'yandex',
	description: 'Reverse image search',
	usage: '!yandex <reply image/send image>',
	category: 'Search',
	aliases: ['ri', 'similar', 'whatimage', 'whatimg', 'findimg'],
	limit: 5,
	cooldown: 8,
	status: 'enable',
	async run({ isMediaImage, query, extractMediaData, filename, from, message, typeQuoted, groupMetadata }, client) {
		if (!isURL(query) && !isMediaImage) {
			return await client[botNum].reply(
				{ groupMetadata, from, quoted: message },
				'Please send/reply a image to find the similar image'
			);
		}

		let media = query && isURL(query) ? query : null;

		try {
			await client[botNum].reply({ groupMetadata, from, quoted: message }, 'Searching. Please wait...');

			if (isMediaImage) {
				media = await client[botNum].downloadAndSaveMediaMessage(
					extractMediaData,
					path.join(__dirname, `src/media/temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`),
					typeQuoted
				);
			}

			const result = await yandex(media);

			if ('error' in result) {
				if (isMediaImage && fs.existsSync(media)) {
					fs.unlinkSync(media);
				}

				return await client[botNum].reply({ groupMetadata, from, quoted: message }, result.error);
			} else if (result.information.length === 0) {
				if (isMediaImage && fs.existsSync(media)) {
					fs.unlinkSync(media);
				}

				return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'Similar images not found.');
			}

			let i = 1;
			let capt = '';

			for (const item of result.information) {
				if (i === 1) {
					capt += 'Reverse Image Search'.formatHeaders();
					capt += '\nWill sending a few similar or the actual images itself. Please wait...\n\n';
				}

				if (i === 6) {
					break;
				}

				capt += `Title : ${item.title}\n`;
				capt += `Description : ${item.description}\n`;
				capt += `Domain : ${item.domain}`;

				await client[botNum].send(
					from,
					{
						image: { url: item.images.preview[0].url },
						caption: capt.trim(),
						templateButtons: [
							{ urlButton: { displayText: 'Image Source', url: item.images.original } },
							{ urlButton: { displayText: 'Content Source', url: item.source } }
						]
					},
					{ groupMetadata, quoted: message }
				);
				capt = '';

				i++;
			}

			if (isMediaImage && fs.existsSync(media)) {
				fs.unlinkSync(media);
			}
		} catch (err) {
			if (isMediaImage && fs.existsSync(media)) {
				fs.unlinkSync(media);
			}

			let str = 'Something went wrong. Please send this error stack to the owner. :\n\n';

			str += `Type : ${err.name}\n`;
			str += `Message : ${err.message}`;
			await client[botNum].reply({ groupMetadata, from, quoted: message }, str);
			log(err);
		}
	}
};
