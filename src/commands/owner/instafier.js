import { instafier } from '../../utils/index.js';

let instafierState = false;

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'instafier',
	minifiedDescription: 'Instafier Listener',
	description: 'Change current state of the Instafier listener.',
	usage: '!instafier <enable/disable/check>',
	aliases: ['instaf'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, query, message }, client) {
		if (!query) {
			return await client.instance.reply('You must provide a state to set', { from, quoted: message });
		}

		switch (query.toLowerCase()) {
			case 'enable':
				if (instafierState) {
					return await client.instance.reply('Instafier is already enabled', { from, quoted: message });
				}

				await (await import('../../handlers/instagram_notifier/handlers.js')).handler();
				instafierState = true;
				return await client.instance.reply('Instafier is now enabled', { from, quoted: message });
			case 'disable': {
				if (!instafierState) {
					return await client.instance.reply('Instafier is already disabled', { from, quoted: message });
				}

				const clients = instafier.closeConnection();

				if (clients.error) {
					return await client.instance.reply(clients.message, { from, quoted: message });
				}

				instafierState = false;
				await client.instance.reply(clients.message, { from, quoted: message });
				break;
			}
			default:
				if (instafierState) {
					await client.instance.reply('The instafier is enabled.', { from, quoted: message });
				}
		}
	}
};
