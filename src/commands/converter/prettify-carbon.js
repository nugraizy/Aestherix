import { Prettify } from '../../helper/index.js';
import { color, loggers } from '../../utils/modules/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'carbon',
	minifiedDescription: 'Carbonify Code',
	description: 'Prettify code.',
	usage: '!carbon <reply/send image>',
	aliases: ['carbon'],
	category: 'Converter',
	cooldown: 5,
	limit: 4,
	status: 'enable',
	run: async ({ from, prettyNumber, message, query, groupMetadata }, client) => {
		if (!query) {
			return client.instance.reply('Please provide a Codes.', { from, quoted: message, groupMetadata });
		}

		loggers.warning(`${color('Carboning Codes', '#FF99C8')} ${color(prettyNumber, '#E4C1F9')}`);

		const carbon = await new Prettify().Carbon(query, { theme: 'dracula' });

		let buffer = carbon.toBuffer();

		if ('error' in buffer) {
			client.instance.reply(buffer.error, { from, quoted: message, groupMetadata });
			loggers.error(`${color('Failed to Carboning a Codes', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);
			return;
		}

		await client.instance.send(from, { image: Buffer.from(buffer, 'base64') }, { groupMetadata, quoted: message });
		buffer = null;

		loggers.info(`${color('Carboning Codes Success', '#FF99C8')} ${color(prettyNumber, '#E4C1F9')}`);
	}
};
