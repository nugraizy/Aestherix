import { instafier } from '../../utils/index.js';

let instafierState = false;

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'instafier',
	description: 'Change current state of the Instafier listener.',
	usage: '!instafier <enable/disable/check>',
	aliases: ['instaf'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, query, message, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply('You must provide a state to set', { from, quoted: message, groupMetadata });
		}

		switch (query.toLowerCase()) {
			case 'enable':
				if (instafierState) {
					return await client[botNum].reply('Instafier is already enabled', { from, quoted: message, groupMetadata });
				}

				await (await import('../../handlers/instagram_notifier/handlers.js')).handler();
				instafierState = true;
				return await client[botNum].reply('Instafier is now enabled', { from, quoted: message, groupMetadata });
			case 'disable': {
				if (!instafierState) {
					return await client[botNum].reply('Instafier is already disabled', { from, quoted: message, groupMetadata });
				}

				const clients = instafier.closeConnection();

				if (clients.error) {
					return await client[botNum].reply(clients.message, { from, quoted: message, groupMetadata });
				}

				instafierState = false;
				await client[botNum].reply(clients.message, { from, quoted: message, groupMetadata });
				break;
			}
			default:
				if (instafierState) {
					await client[botNum].reply('The instafier is enabled.', { from, quoted: message, groupMetadata });
				}
		}
	}
};
