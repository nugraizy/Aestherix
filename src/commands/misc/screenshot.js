import { getScreenshotAPI, isURL } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
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
			return await client[botNum].reply('Please specify a website URL', {
				groupMetadata: message.groupMetadata,
				from: message.from,
				quoted: message.message
			});
		}

		let type = 'desktop';
		const parseOptions = message.query.includes('--') ? message.query.split('--') : message.query;

		if (Array.isArray(parseOptions)) {
			if (!isURL(parseOptions[0])) {
				return await client[botNum].reply('Please specify a valid URL', {
					groupMetadata: message.groupMetadata,
					from: message.from,
					quoted: message.message
				});
			}

			message.query = parseOptions[0];
			type = parseOptions[1];
		} else if (!isURL(message.query)) {
			return await client[botNum].reply('Please specify a valid URL', {
				groupMetadata: message.groupMetadata,
				from: message.from,
				quoted: message.message
			});
		}

		const { buffer } = await getScreenshotAPI(message.query, type);

		await client[botNum].send(
			message.from,
			{ image: new Buffer.from(buffer, 'base64') },
			{ groupMetadata: message.groupMetadata, quoted: message.message }
		);
	}
};
