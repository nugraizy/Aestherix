import { instafier } from '../../utils/index.js';

let instafierState = false;

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'instafier',
	minifiedDescription: 'Instafier Listener',
	description: 'Change current state of the Instafier listener.',
	usage: '!instafier `<enable/disable/check>`',
	aliases: ['instaf'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, query, message }, client) {
		if (!query) {
			return await client.instance.reply(from, 'You must provide a state to set', message);
		}

		switch (query.toLowerCase()) {
			case 'enable':
				if (instafierState) {
					return await client.instance.reply(from, 'Instafier is already enabled', message);
				}

				await (await import('../../handlers/instagram_notifier/handlers.js')).handler();
				instafierState = true;
				return await client.instance.reply(from, 'Instafier is now enabled', message);
			case 'disable': {
				if (!instafierState) {
					return await client.instance.reply(from, 'Instafier is already disabled', message);
				}

				const clients = instafier.closeConnection();

				if (clients.error) {
					return await client.instance.reply(from, clients.message, message);
				}

				instafierState = false;
				await client.instance.reply(from, clients.message, message);
				break;
			}
			default:
				if (instafierState) {
					await client.instance.reply(from, 'The instafier is enabled.', message);
				}
		}
	}
};
