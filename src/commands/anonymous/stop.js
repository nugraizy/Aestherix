import { stop } from '../../utils/anonymous/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'stop',
	minifiedDescription: 'Anonymous Stop',
	description: 'Stop a partner',
	category: 'Anonymous',
	usage: '!stop',
	aliases: ['stoppartner'],
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ from, message }, client) {
		const stopping = stop(from, 0, client);

		if (typeof stopping === 'boolean' && !stopping) {
			return await client.instance.reply(from, 'You are not in a search!', message);
		}

		if (typeof stopping === 'object' && stopping.partner2) {
			client.instance.reply(from, 'You have stopped the chat!', message);
			return client.instance.send(stopping.partner2, { text: 'Your partner stoped the chat!' }, {});
		}

		await client.instance.reply(from, `You already searching for a partner!\nPlease wait for ${stopping.seconds}s`, message);
	}
};
