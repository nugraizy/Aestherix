import { skip } from '../../utils/anonymous/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'skip',
	minifiedDescription: 'Anonymous Skip',
	description: 'Skip a partner',
	category: 'Anonymous',
	usage: '!skip',
	aliases: ['skippartner'],
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ from, message }, client) {
		const skipping = skip(from, 20, client, message);

		if (typeof skipping === 'boolean' && !skipping) {
			return await client.instance.reply('You are not in a search!', { from, quoted: message });
		}

		if (typeof skipping === 'object' && skipping.partner2) {
			client.instance.reply('You have skipped your partner!', { from: skipping.partner1, quoted: message });
			client.instance.send(skipping.partner2, { text: 'Your partner skipped the chat!' }, {});
		} else {
			await client.instance.reply(`You already searching for a partner!\nPlease wait for ${skipping.seconds}s`, {
				from,
				quoted: message
			});
		}
	}
};
