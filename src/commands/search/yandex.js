import fs from 'fs';
import path from 'path';

import { isURL } from '../../utils/modules/index.js';
import { yandex } from '../../utils/image_reverse_search/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'yandex',
	minifiedDescription: 'Reverse Image Yandex',
	description: 'Reverse image search from Yandex.',
	usage: '!yandex `<reply/send image>`',
	category: 'Search',
	aliases: ['ri', 'similar', 'whatimage', 'whatimg', 'findimg'],
	limit: 5,
	cooldown: 8,
	status: 'enable',
	async run({ isMediaImage, query, extractMediaData, filename, from, message, typeQuoted }, client) {
		if (!isURL(query) && !isMediaImage) {
			return await client.reply(from, 'Please send/reply a image to find the similar image', message);
		}

		let media = query && isURL(query) ? query : null;

		try {
			await client.reply(from, 'Searching. Please wait...', message);

			if (isMediaImage) {
				media = await client.downloadAndSaveMediaMessage(
					extractMediaData,
					path.join(__dirname, `src/media/temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`),
					typeQuoted
				);
			}

			const result = await yandex(media);

			if (result?.error) {
				if (isMediaImage && fs.existsSync(media)) {
					fs.unlinkSync(media);
				}

				return await client.reply(from, result.error, message);
			} else if (!result.information.length) {
				if (isMediaImage && fs.existsSync(media)) {
					fs.unlinkSync(media);
				}

				return await client.reply(from, 'Similar images not found.', message);
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

				await client.send(
					from,
					{
						image: { url: item.images.preview[0].url },
						caption: capt.trim().formatForm(),
						templateButtons: [
							{ urlButton: { displayText: 'Image Source', url: item.images.original } },
							{ urlButton: { displayText: 'Content Source', url: item.source } }
						]
					},
					{ quoted: message }
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

			throw err;
		}
	}
};
