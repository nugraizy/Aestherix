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
			return await client.instance.reply(from, 'You are not in a search!', message);
		}

		if (typeof skipping === 'object' && skipping.partner2) {
			client.instance.reply(skipping.partner1, 'You have skipped your partner!', message);
			client.instance.send(skipping.partner2, { text: 'Your partner skipped the chat!' }, {});
		} else {
			await client.instance.reply(from, `You already searching for a partner!\nPlease wait for ${skipping.seconds}s`, message);
		}
	}
};
