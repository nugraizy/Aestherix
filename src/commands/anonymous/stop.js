import { stop } from '../../utils/anonymous/index.js';

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'stop',
	description: 'Stop a partner',
	category: 'Anonymous',
	usage: '!stop',
	aliases: ['stoppartner'],
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ from, message, groupMetadata }, client) {
		const stopping = stop(from, 0, client);

		if (typeof stopping === 'boolean' && !stopping) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'You are not in a search!');
		}

		if (typeof stopping === 'object' && stopping.partner2) {
			client[botNum].reply({ groupMetadata, quoted: message, from: stopping.partner1 }, 'You have stopped the chat!');
			return client[botNum].send(stopping.partner2, { text: 'Your partner stoped the chat!' }, { groupMetadata });
		}

		await client[botNum].reply(
			{ groupMetadata, from, quoted: message },
			`You already searching for a partner!\nPlease wait for ${stopping.seconds}s`
		);
	}
};
