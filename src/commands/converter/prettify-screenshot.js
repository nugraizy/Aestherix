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
			return client.reply(from, 'Please reply/send image with caption the command.', message);
		}

		loggers.warning(`${color('Prettifying an Image', 'pink')} ${color(prettyNumber, 'lilac')}`);

		let buffer = await client.downloadMediaMessage(mediaData);

		const screenshot = await new Prettify().Screenshot(buffer);

		buffer = screenshot.toBuffer();

		if (screenshot?.error) {
			client.reply(from, screenshot.error, message);
			loggers.error(`${color('Failed to Prettify an Image', 'red')} for ${color(prettyNumber, 'lilac')}`);
			return;
		}

		await client.send(from, { image: Buffer.from(buffer, 'base64') }, { quoted: message });
		buffer = null;

		loggers.info(`${color('Prettifying an Image Success', 'pink')} ${color(prettyNumber, 'lilac')}`);
	}
};
