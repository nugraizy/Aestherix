import { Prettify } from '../../helper/index.js';
import { color, loggers } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';

export default defineCommand({
	name: 'carbon',
	minifiedDescription: 'Carbonify Code',
	description: 'Prettify code.',
	usage: '!carbon `<reply/send image>`',
	aliases: ['carbon'],
	category: 'Converter',
	cooldown: 5,
	limit: 4,
	status: 'enable',
	run: async ({ from, prettyNumber, message, query }, client) => {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return client.reply(from, L.errors.noQuery, message);
		}

		loggers.warning(`${color('Carboning Codes', 'pink')} ${color(prettyNumber, 'lilac')}`);

		const carbon = await new Prettify().Carbon(query, { theme: 'dracula' });

		let buffer = carbon.toBuffer();

		if (buffer?.error) {
			client.reply(from, buffer.error, message);
			loggers.error(`${color('Failed to Carboning a Codes', 'red')} for ${color(prettyNumber, 'lilac')}`);
			return;
		}

		await client.send(from, { image: Buffer.from(buffer, 'base64') }, { quoted: message });
		buffer = null;

		loggers.info(`${color('Carboning Codes Success', 'pink')} ${color(prettyNumber, 'lilac')}`);
	}
});
