import dayjs from 'dayjs';

import { Prettify } from '../../helper/index.js';
import { color, INFOLOG, ERRLOG } from '../../utils/modules/index.js';

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'prettify',
	description: 'Prettify image.',
	usage: '!prettify <reply/send image>',
	aliases: ['pretty'],
	category: 'Converter',
	cooldown: 5,
	limit: 4,
	status: 'enable',
	run: async ({ from, isMediaImage, prettyNumber, mediaData, message, groupMetadata }, client) => {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (!isMediaImage) {
			return client[botNum].reply(
				{ groupMetadata, from, quoted: message },
				'Please reply/send image with caption the command.'
			);
		}

		INFOLOG(`[${color(time, 'cyan')}]`, `${color('Prettifying an Image', '#01cdfe')} ${color(prettyNumber, '#ff71ce')}`);

		let buffer = await client[botNum].downloadMediaMessage(mediaData);

		buffer = await new Prettify().Screenshot(buffer);
		buffer = buffer.toBuffer();

		if ('error' in buffer) {
			client[botNum].reply({ groupMetadata, from, quoted: message }, buffer.error);
			ERRLOG(
				`[${color(time, 'cyan')}]`,
				`⚠️ ${color('Failed to Prettify an Image', 'red')} for ${color(prettyNumber, '#ff71ce')}`
			);
			return;
		}

		await client[botNum].send(from, { image: Buffer.from(buffer, 'base64') }, { groupMetadata, quoted: message });
		buffer = null;

		INFOLOG(
			`[${color(time, 'cyan')}]`,
			`${color('Prettifying an Image Success', '#01cdfe')} ${color(prettyNumber, '#ff71ce')}`
		);
	}
};
