import { Limit } from '../../helper/index.js';
import configuration from '../../helper/config/connect.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'limit',
	minifiedDescription: 'Limit User',
	description: 'Check your daily limit.',
	category: 'Misc',
	usage: '!limit',
	aliases: ['limit', 'lim'],
	cooldown: 10,
	limit: 0,
	status: 'enable',
	async run({ from, sender, message }, client) {
		const isExist = Limit.checkExist(sender);
		let role = Limit.checkRole(sender).role;

		if (!isExist) {
			if (!(role === 'OWNER' || role === 'PREMIUM')) {
				Limit.upsert(sender, configuration.defaultLimit, 'USER');
			}
		}

		const limit = Limit.checkLimit(sender);

		await client.reply(from, `Your limit : ${limit || 0}\nType user : ${role}`, message);
	}
};
