import { skip } from '../../utils/anonymous/index.js';

export default {
	name: 'skip',
	description: 'Skip a partner',
	category: 'Anonymous',
	usage: '!skip',
	aliases: ['skippartner'],
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ from, message, groupMetadata }, client) {
		const skipping = skip(from, 20, client, message);

		if (typeof skipping === 'boolean' && !skipping) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'You are not in a search!');
		}

		if (typeof skipping === 'object' && skipping.partner2) {
			client[botNum].reply({ groupMetadata, from: skipping.partner1, quoted: message }, 'You have skipped your partner!');
			client[botNum].send(skipping.partner2, { text: 'Your partner skipped the chat!' }, { groupMetadata });
		} else {
			await client[botNum].reply(
				{ groupMetadata, from, quoted: message },
				`You already searching for a partner!\nPlease wait for ${skipping.seconds}s`
			);
		}
	}
};
