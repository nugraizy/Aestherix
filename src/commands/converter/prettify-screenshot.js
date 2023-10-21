import { Prettify } from '../../helper/index.js';
import { color, INFOLOG, ERRLOG } from '../../utils/modules/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
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
		if (!isMediaImage) {
			return client[botNum].reply('Please reply/send image with caption the command.', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		INFOLOG(`${color('Prettifying an Image', 'cyan')} ${color(prettyNumber, '#ff71ce')}`);

		let buffer = await client[botNum].downloadMediaMessage(mediaData);

		const screenshot = await new Prettify().Screenshot(buffer);

		buffer = screenshot.toBuffer();

		if ('error' in screenshot) {
			client[botNum].reply(screenshot.error, { from, quoted: message, groupMetadata });
			ERRLOG(`⚠️ ${color('Failed to Prettify an Image', '#FF5555')} for ${color(prettyNumber, '#ff71ce')}`);
			return;
		}

		await client[botNum].send(from, { image: Buffer.from(buffer, 'base64') }, { groupMetadata, quoted: message });
		buffer = null;

		INFOLOG(`${color('Prettifying an Image Success', 'cyan')} ${color(prettyNumber, '#ff71ce')}`);
	}
};
