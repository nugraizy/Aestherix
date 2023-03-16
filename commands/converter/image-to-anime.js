/* global botNum */
import dayjs from 'dayjs';

import { color, INFOLOG, ERRLOG } from '../../helper/index.js';
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
	run: async ({ isMediaImage, from, prettyNumber, message, mediaData, sender, args }, client) => {
		const time = dayjs().format('HH:mm:ss DD/MM');

		INFOLOG(
			`[${color(time, 'cyan')}]`,
			`${color('Converting image to Anime-like', '#01cdfe')} to ${color(prettyNumber, '#ff71ce')}`,
		);

		let bufferMessage;
		let buffer;

		if (args[1] === '-variant') {
			mediaData = JSON.parse(args.slice(2).join(''));
		}

		if (!isMediaImage && args[1] !== '-variant') {
			return await client[botNum].reply({ from, quoted: message }, 'Please send/reply an image to convert to anime');
		}

		bufferMessage = await client[botNum].downloadMediaMessage(mediaData);
		buffer = await imageToAnime(bufferMessage, sender, {
			crop: 'SINGLE',
			enhance: true,
			onRetry: (e) =>
				ERRLOG(`[${color(time, 'cyan')}]`, `⚠️ ${color(e.message, 'red')} for ${color(prettyNumber, '#ff71ce')}`),
		});

		buffer = Buffer.from(buffer, 'base64');

		await client[botNum].sendMessage(
			from,
			{
				image: buffer,
				caption: 'Different of me',
				footer: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',

				buttons: [
					{
						buttonId: `.ai2d -variant ${JSON.stringify(mediaData)}`,
						buttonText: { displayText: 'Try other variants' },
						type: 1,
					},
				],
				headerType: 4,
			},
			{ quoted: message },
		);

		bufferMessage = null;
		buffer = null;

		INFOLOG(
			`[${color(time, 'cyan')}]`,
			`${color('Anime-like image is sent', '#01cdfe')} to ${color(prettyNumber, '#ff71ce')}`,
		);
	},
};
