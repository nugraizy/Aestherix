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
	cooldown: 3,
	limit: 0,
	status: 'enable',
	async run({ from, sender, message, groupMetadata }, client) {
		const isExist = Limit.checkExist(sender);
		let role = Limit.checkRole(sender).role;

		if (!isExist) {
			if (!(role === 'OWNER' || role === 'PREMIUM')) {
				Limit.upsert(sender, configuration.cache.limit, 'USER');
			}
		}

		const limit = Limit.checkLimit(sender);

		await client.instance.reply(`Your limit : ${limit || 0}\nType user : ${role}`, {
			from,
			quoted: message,
			groupMetadata
		});
	}
};
