/* global botNum */
import fs from 'fs';
import path from 'path';

import { __dirname } from '../../index.js';
import { isURL } from '../../helper/index.js';
import { sauceNao } from '../../utils/image_reverse_search/index.js';

export default {
	name: 'saucenao',
	description: 'Reverse image anime search',
	usage: '!saucenao <reply image/send image>',
	category: 'Anime',
	aliases: ['nao', 'waitnao'],
	limit: 2,
	cooldown: 2,
	status: 'enable',
	async run({ isMediaImage, query, extractMediaData, filename, from, message, typeQuoted }, client) {
		if (!isURL(query) && !isMediaImage) {
			return await client[botNum].reply({ from, quoted: message }, 'Please send/reply a image to find the similar image');
		}

		let media = query && isURL(query) ? query : null;

		await client[botNum].reply({ from, quoted: message }, 'Searching. Please wait...');

		if (isMediaImage) {
			media = await client[botNum].downloadAndSaveMediaMessage(
				extractMediaData,
				path.join(__dirname, `temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`),
				typeQuoted,
			);
		}

		const result = await sauceNao(media);

		if ('error' in result) {
			if (isMediaImage) {
				fs.unlinkSync(media);
			}

			return await client[botNum].reply({ from, quoted: message }, result.error);
		}

		if (result.title === '') {
			return await client[botNum].reply({ from, quoted: message }, 'Can not discover what anime is this. Try moe instead.');
		}

		const capt = `${'What Anime ?'.formatHeaders()}
Title : ${result.title}
Description : ${result.description}
Similarity : ${result.similarity}%
Powered by sauce.nao`;

		await client[botNum].reply({ from, quoted: message }, capt.trim());

		if (isMediaImage) {
			fs.unlinkSync(media);
		}
	},
};
