import { delay } from '../../utils/modules/index.js';
import { search } from '../../utils/anonymous/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'search',
	minifiedDescription: 'Anonymous Search',
	description: 'Search for a partner',
	category: 'Anonymous',
	usage: '!search',
	aliases: ['find', 'findpartner'],
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ from, message }, client) {
		const searching = search(from, 20, client, message);

		if (typeof searching === 'boolean' && searching) {
			return await client.instance.reply('Searching for a partner...', { from, quoted: message });
		}

		if (typeof searching === 'boolean' && !searching) {
			return await client.instance.reply('You are already searching for a partner!', { from, quoted: message });
		}

		if (typeof searching === 'object' && searching.partner2) {
			await client.instance.reply('Searching for a partner...', { from: searching.partner2, quoted: message });

			await delay(1_500);

			client.instance.reply('Your partner is found!', {
				from: searching.partner1,
				quoted: searching.messages1
			});
			client.instance.reply('Your partner is found!', {
				from: searching.partner2,
				quoted: searching.messages2
			});
		} else if (searching.status === 'chatting') {
			await client.instance.reply('You are already chatting with someone!', { from, quoted: message });
		} else {
			await client.instance.reply('You are already searching for a partner!', { from, quoted: message });
		}
	}
};
