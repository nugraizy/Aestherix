import { getScreenshotAPI, isURL } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
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
			return await client.instance.reply(message.from, 'Please specify a website URL', message.message);
		}

		let type = 'desktop';
		const parseOptions = message.query.includes('--') ? message.query.split('--') : message.query;

		if (Array.isArray(parseOptions)) {
			if (!isURL(parseOptions[0])) {
				return await client.instance.reply(message.from, 'Please specify a valid URL', message.message);
			}

			message.query = parseOptions[0];
			type = parseOptions[1];
		} else if (!isURL(message.query)) {
			return await client.instance.reply(message.from, 'Please specify a valid URL', message.message);
		}

		const { buffer } = await getScreenshotAPI(message.query, type);

		await client.instance.send(message.from, { image: new Buffer.from(buffer, 'base64') }, { quoted: message.message });
	}
};
