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
		const result = stop(from, client);

		if (!result) {
			return await client.reply(from, 'You are not in a search!', message);
		}

		if (result.partner2) {
			await client.reply(from, 'You have stopped the chat!', message);
			await client.send(result.partner2, { text: 'Your partner stopped the chat!' }, {});
			return;
		}

		await client.reply(from, `You are already searching for a partner!\nPlease wait for ${result.seconds}s`, message);
	}
};
