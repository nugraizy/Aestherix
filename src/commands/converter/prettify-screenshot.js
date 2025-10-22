import { Prettify } from '../../helper/index.js';
import { color, loggers } from '../../utils/modules/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'prettify',
	minifiedDescription: 'Prettify Screenshot',
	description: 'Prettify image.',
	usage: '!prettify `<reply/send image>`',
	aliases: ['pretty'],
	category: 'Converter',
	cooldown: 5,
	limit: 4,
	status: 'enable',
	run: async ({ from, isMediaImage, prettyNumber, mediaData, message }, client) => {
		if (!isMediaImage) {
			return client.instance.reply(from, 'Please reply/send image with caption the command.', message);
		}

		loggers.warning(`${color('Prettifying an Image', '#FF99C8')} ${color(prettyNumber, '#E4C1F9')}`);

		let buffer = await client.instance.downloadMediaMessage(mediaData);

		const screenshot = await new Prettify().Screenshot(buffer);

		buffer = screenshot.toBuffer();

		if (screenshot?.error) {
			client.instance.reply(from, screenshot.error, message);
			loggers.error(`${color('Failed to Prettify an Image', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);
			return;
		}

		await client.instance.send(from, { image: Buffer.from(buffer, 'base64') }, { quoted: message });
		buffer = null;

		loggers.info(`${color('Prettifying an Image Success', '#FF99C8')} ${color(prettyNumber, '#E4C1F9')}`);
	}
};
