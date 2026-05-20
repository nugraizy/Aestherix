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
		if (!message.query) {
			return await client.reply(message.from, 'Please specify a website URL', message.message);
		}

		if (!isURL(message.query)) {
			return await client.reply(message.from, 'Please specify a valid URL', message.message);
		}

		const { buffer, error } = await screenshot(message.query);

		if (error) {
			return await client.reply(message.from, error, message.message);
		}

		await client.send(message.from, { image: buffer }, { quoted: message.message });
	}
});
