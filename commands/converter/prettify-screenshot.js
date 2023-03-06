/* global botNum */
import dayjs from 'dayjs';

import { prettifyScreenshot } from '../../helper/index.js';
import { color, INFOLOG, ERRLOG } from '../../helper/modules/index.js';

export default {
	name: 'prettify',
	description: 'Prettify image.',
	usage: '!prettify <reply/send image>',
	aliases: ['pretty'],
	category: 'Converter',
	cooldown: 5,
	limit: 4,
	status: 'enable',
	run: async ({ from, isMediaImage, prettyNumber, mediaData, message, sender }, client) => {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (!isMediaImage) {
			return client[botNum].reply({ from, quoted: message }, 'Please reply/send image with caption the command.');
		}

		INFOLOG(`[${color(time, 'cyan')}]`, `${color('Prettifying an Image', '#01cdfe')} ${color(prettyNumber, '#ff71ce')}`);

		let buffer = await client[botNum].downloadMediaMessage(mediaData);

		buffer = await prettifyScreenshot(buffer);

		if ('error' in buffer) {
			client[botNum].reply({ from, quoted: message }, buffer.error);
			ERRLOG(
				`[${color(time, 'cyan')}]`,
				`⚠️ ${color('Failed to Convert Media to Sticker', 'red')} for ${color(prettyNumber, '#ff71ce')}`,
			);
			return;
		}

		await client[botNum].sendMessage(from, { image: Buffer.from(buffer, 'base64') }, { quoted: message });
		buffer = null;

		INFOLOG(
			`[${color(time, 'cyan')}]`,
			`${color('Prettifying an Image Success', '#01cdfe')} ${color(prettyNumber, '#ff71ce')}`,
		);
	},
};
