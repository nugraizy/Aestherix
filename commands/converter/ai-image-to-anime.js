/* global botNum */
import dayjs from 'dayjs';

import { color, INFOLOG } from '../../helper/index.js';
import { imageToAnime } from '../../utils/index.js';

export default {
	name: 'toanime',
	description: 'Change your selfie picture to Anime-like using QQ A.I',
	usage: '!toanime <reply media/send media>',
	aliases: ['toanim', 'ai2d', 'faceplay'],
	category: 'Converter',
	cooldown: 8,
	limit: 9,
	status: 'enable',
	run: async ({ isMediaImage, from, prettyNumber, message, mediaData, sender }, client) => {
		const time = dayjs().format('HH:mm:ss DD/MM');

		INFOLOG(
			`[${color(time, 'cyan')}]`,
			`${color('Converting image to Anime-like', '#01cdfe')} to ${color(prettyNumber, '#ff71ce')}`,
		);

		if (!isMediaImage) {
			return await client[botNum].reply({ from, quoted: message }, 'Please send/reply an image to convert to anime');
		}

		let bufferMessage = await client[botNum].downloadMediaMessage(mediaData);
		let buffer = await imageToAnime(bufferMessage, sender, {
			crop: 'SINGLE',
			enhance: true,
			proxy: { url: 'socks5://20.239.168.212:443', chinese: true, image: true },
		});

		await client[botNum].sendMessage(from, { image: Buffer.from(buffer, 'base64') }, { quoted: message });

		bufferMessage = null;
		buffer = null;

		INFOLOG(
			`[${color(time, 'cyan')}]`,
			`${color('Anime-like image is sent', '#01cdfe')} to ${color(prettyNumber, '#ff71ce')}`,
		);
	},
};
