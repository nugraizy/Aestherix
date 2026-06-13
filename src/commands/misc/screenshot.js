import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { isURL, screenshot } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'screenshots',
	minifiedDescription: 'Screenshot Website',
	description: 'Get a screenshot of a website.',
	category: 'Misc',
	usage: '!screenshot `<url>` `--<?type (oneof phone, tablet, desktop)>` default is `desktop`.',
	aliases: ['screenshot', 'ss'],
	cooldown: 3,
	limit: 2,
	status: 'enable',
	async run(message, client) {
		const locale = await getLocale(message.from);
		const L = useLocale(locale, 'common');

		if (!message.query) {
			return await client.reply(message.from, L.errors.websiteUrlRequired, message.message);
		}

		if (!isURL(message.query)) {
			return await client.reply(message.from, L.errors.invalidUrl, message.message);
		}

		const { buffer, error } = await screenshot(message.query);

		if (error) {
			return await client.reply(message.from, error, message.message);
		}

		await client.send(message.from, { image: buffer }, { quoted: message.message });
	}
});
