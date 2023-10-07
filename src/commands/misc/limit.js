import { checkLimit } from '../../helper/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'limit',
	description: 'Check your daily limit.',
	category: 'Misc',
	usage: '!limit',
	aliases: ['limit', 'lim'],
	cooldown: 3,
	limit: 0,
	status: 'enable',
	async run({ from, sender, message, groupMetadata }, client) {
		await client[botNum].reply(
			checkLimit(sender) ? `Your limit : ${checkLimit(sender).limit}\nType user : ${checkLimit(sender).type}` : '404',
			{ from, quoted: message, groupMetadata }
		);
	}
};
