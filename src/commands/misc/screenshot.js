import { getScreenshotAPI, isURL } from '../../utils/index.js';

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'screenshots',
	description: 'Get a screenshot of a website',
	category: 'Misc',
	usage: '!screenshot <url> --<?type> (phone, tablet, desktop) default is desktop.',
	aliases: ['screenshot', 'ss'],
	cooldown: 3,
	limit: 2,
	status: 'enable',
	async run(message, client) {
		if (!message.query) {
			return await client[botNum].reply(
				{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
				'Please specify a website URL'
			);
		}

		let type = 'desktop';
		const parseOptions = message.query.includes('--') ? message.query.split('--') : message.query;

		if (Array.isArray(parseOptions)) {
			if (!isURL(parseOptions[0])) {
				return await client[botNum].reply({ from: message.from, quoted: message.message }, 'Please specify a valid URL');
			}

			message.query = parseOptions[0];
			type = parseOptions[1];
		} else if (!isURL(message.query)) {
			return await client[botNum].reply(
				{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
				'Please specify a valid URL'
			);
		}

		const { buffer } = await getScreenshotAPI(message.query, type);

		await client[botNum].send(
			message.from,
			{ image: new Buffer.from(buffer, 'base64') },
			{ groupMetadata: message.groupMetadata, quoted: message.message }
		);
	}
};
