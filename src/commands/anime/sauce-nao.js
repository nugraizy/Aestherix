import fs from 'fs';
import path from 'path';

import { isURL, sauceNao } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'saucenao',
	minifiedDescription: 'Saucenao Image Search',
	description: 'Reverse image anime search',
	usage: '!saucenao `<reply image/send image>`',
	category: 'Anime',
	aliases: ['nao', 'waitnao'],
	limit: 2,
	cooldown: 2,
	status: 'enable',
	async run({ isMediaImage, query, extractMediaData, filename, from, message, typeQuoted }, client) {
		if (!isURL(query) && !isMediaImage) {
			return await client.reply(from, 'Please send/reply a image to find the similar image', {
				from,
				quoted: message
			});
		}

		let media = query && isURL(query) ? query : null;

		const wait = await client.waitMessage(from, 'Searching. Please wait...', message);

		if (isMediaImage) {
			media = await client.downloadAndSaveMediaMessage(
				extractMediaData,
				path.join(__dirname, `src/media/temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`),
				typeQuoted
			);
		}

		const result = await sauceNao(media);

		if (result?.error) {
			if (isMediaImage) {
				fs.unlinkSync(media);
			}

			return await wait.update(result.error);
		}

		if (result.title === '') {
			return await wait.update('Can not discover what anime is this. Try moe instead.');
		}

		const capt = `${'What Anime ?'.formatHeaders()}

Title : ${result.title}
Description : ${result.description}
Similarity : ${result.similarity}%

Powered by sauce.nao`.formatForm();

		await wait.update(capt.trim());

		if (isMediaImage) {
			fs.unlinkSync(media);
		}
	}
};
