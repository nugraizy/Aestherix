import fs from 'fs';
import path from 'path';

import { isURL, sauceNao } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'saucenao',
	description: 'Reverse image anime search',
	usage: '!saucenao <reply image/send image>',
	category: 'Anime',
	aliases: ['nao', 'waitnao'],
	limit: 2,
	cooldown: 2,
	status: 'enable',
	async run({ isMediaImage, query, extractMediaData, filename, from, message, typeQuoted, groupMetadata }, client) {
		if (!isURL(query) && !isMediaImage) {
			return await client[botNum].reply('Please send/reply a image to find the similar image', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		let media = query && isURL(query) ? query : null;

		await client[botNum].reply('Searching. Please wait...', { from, quoted: message, groupMetadata });

		if (isMediaImage) {
			media = await client[botNum].downloadAndSaveMediaMessage(
				extractMediaData,
				path.join(__dirname, `src/media/temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`),
				typeQuoted
			);
		}

		const result = await sauceNao(media);

		if ('error' in result) {
			if (isMediaImage) {
				fs.unlinkSync(media);
			}

			return await client[botNum].reply(result.error, { from, quoted: message, groupMetadata });
		}

		if (result.title === '') {
			return await client[botNum].reply('Can not discover what anime is this. Try moe instead.', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		const capt = `${'What Anime ?'.formatHeaders()}
Title : ${result.title}
Description : ${result.description}
Similarity : ${result.similarity}%
Powered by sauce.nao`;

		await client[botNum].reply(capt.trim(), { from, quoted: message, groupMetadata });

		if (isMediaImage) {
			fs.unlinkSync(media);
		}
	}
};
