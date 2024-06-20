import { Prettify } from '../../helper/index.js';
import { color, INFOLOG, ERRLOG } from '../../utils/modules/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'prettify',
	minifiedDescription: 'Prettify Screenshot',
	description: 'Prettify image.',
	usage: '!prettify <reply/send image>',
	aliases: ['pretty'],
	category: 'Converter',
	cooldown: 5,
	limit: 4,
	status: 'enable',
	run: async ({ from, isMediaImage, prettyNumber, mediaData, message, groupMetadata }, client) => {
		if (!isMediaImage) {
			return client.instance.reply('Please reply/send image with caption the command.', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		INFOLOG(`${color('Prettifying an Image', '#FF99C8')} ${color(prettyNumber, '#E4C1F9')}`);

		let buffer = await client.instance.downloadMediaMessage(mediaData);

		const screenshot = await new Prettify().Screenshot(buffer);

		buffer = screenshot.toBuffer();

		if ('error' in screenshot) {
			client.instance.reply(screenshot.error, { from, quoted: message, groupMetadata });
			ERRLOG(`⚠️ ${color('Failed to Prettify an Image', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);
			return;
		}

		await client.instance.send(from, { image: Buffer.from(buffer, 'base64') }, { groupMetadata, quoted: message });
		buffer = null;

		INFOLOG(`${color('Prettifying an Image Success', '#FF99C8')} ${color(prettyNumber, '#E4C1F9')}`);
	}
};
