/* global botNum, log */
import fs from 'fs';
import path from 'path';

import { __dirname } from '../../index.js';
import { isURL, removeDuplicatesArray } from '../../helper/index.js';
import { yandex } from '../../utils/image_reverse_search/index.js';

export default {
	name: 'yandex',
	description: 'Reverse image search',
	usage: '!yandex <reply image/send image>',
	category: 'Search',
	aliases: ['ri', 'similar', 'whatimage', 'whatimg', 'findimg'],
	limit: 5,
	cooldown: 8,
	status: 'enable',
	async run({ isMediaImage, query, extractMediaData, filename, from, message, typeQuoted }, client) {
		if (!isURL(query) && !isMediaImage) {
			return await client[botNum].reply({ from, quoted: message }, 'Please send/reply a image to find the similar image');
		}

		let media = query && isURL(query) ? query : null;

		try {
			await client[botNum].reply({ from, quoted: message }, 'Searching. Please wait...');

			if (isMediaImage) {
				media = await client[botNum].downloadAndSaveMediaMessage(
					extractMediaData,
					path.join(__dirname, `temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`),
					typeQuoted,
				);
			}

			const result = await yandex(media);

			if ('error' in result) {
				if (isMediaImage && fs.existsSync(media)) {
					fs.unlinkSync(media);
				}

				return await client[botNum].reply({ from, quoted: message }, result.error);
			} else if (result.information.length === 0) {
				if (isMediaImage && fs.existsSync(media)) {
					fs.unlinkSync(media);
				}

				return await client[botNum].reply({ from, quoted: message }, 'Similar images not found.');
			}

			let capt = 'Reverse Image Search'.formatHeaders();

			capt += '\nWill sending a few similar or the actual images itself. Please wait...\n\n';

			for (const item of result.information) {
				capt += `Title: ${item.title}\nDescription: ${item.description}\n\n`;
			}

			await client[botNum].sendMessage(
				from,
				{ image: { url: result.information[0].images }, caption: capt.trim() },
				{ quoted: message },
			);

			const images = removeDuplicatesArray(result.information.map((item) => item.images))
				.slice(1)
				.slice(0, 5);

			for (const image of images) {
				await client[botNum].sendMessage(from, { image: { url: image } });
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
			await client[botNum].reply({ from, quoted: message }, str);
			log(err);
		}
	},
};
