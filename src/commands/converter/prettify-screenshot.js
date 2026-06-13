import { Prettify } from '../../helper/index.js';
import { color, loggers } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';

export default defineCommand({
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
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!isMediaImage) {
			return client.reply(from, L.errors.imageRequired, message);
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
});
