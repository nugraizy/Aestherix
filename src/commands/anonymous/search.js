import { delay } from '../../utils/modules/index.js';
import { search } from '../../utils/anonymous/index.js';
import configuration from '../../helper/index.js';

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
			const { key } = await client.instance.reply(from, 'Searching for a partner...', message);

			configuration.anonymousMessages.set(from, key);
			return;
		}

		if (typeof searching === 'boolean' && !searching) {
			return await client.instance.reply(from, 'You are already searching for a partner!', message);
		}

		if (typeof searching === 'object' && searching.partner2) {
			const { key } = await client.instance.reply(searching.partner2, 'Searching for a partner...', message);

			configuration.anonymousMessages.set(searching.partner2, key);

			await delay(2_500);

			await client.instance.edit(
				searching.partner1,
				'Your partner is found!',
				configuration.anonymousMessages.get(searching.partner1)
			);
			await client.instance.edit(
				searching.partner2,
				'Your partner is found!',
				configuration.anonymousMessages.get(searching.partner2)
			);
		} else if (searching.status === 'chatting') {
			await client.instance.reply(from, 'You are already chatting with someone!', message);
		} else {
			await client.instance.reply(from, 'You are already searching for a partner!', message);
		}
	}
};
