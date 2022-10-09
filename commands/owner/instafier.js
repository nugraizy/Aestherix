/* global botNum */
import { instafier } from '../../utils/index.js';

let instafierState = false;

export default {
	name: 'instafier',
	description: 'Change current state of the Instafier listener.',
	usage: '!instafier <enable/disable/check>',
	aliases: ['instaf'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ isOwner, from, query, message }, client) {
		if (!isOwner) {
			return await client[botNum].reply({ from, quoted: message }, 'You are not allowed to use this command');
		}

		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'You must provide a state to set');
		}

		switch (query.toLowerCase()) {
			case 'enable':
				if (instafierState) {
					return await client[botNum].reply({ from, quoted: message }, 'Instafier is already enabled');
				}

				await (await import('../../handlers/instagram_notifier/handlers.js')).handler();
				instafierState = true;
				return await client[botNum].reply({ from, quoted: message }, 'Instafier is now enabled');
			case 'disable': {
				if (!instafierState) {
					return await client[botNum].reply({ from, quoted: message }, 'Instafier is already disabled');
				}

				const clients = instafier.closeConnection();

				if (clients.error) {
					return await client[botNum].reply({ from, quoted: message }, clients.message);
				}

				instafierState = false;
				await client[botNum].reply({ from, quoted: message }, clients.message);
				break;
			}
			default:
				if (instafierState) {
					await client[botNum].reply({ from, quoted: message }, 'The instafier is enabled.');
				}
		}
	},
};
