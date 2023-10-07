import { extractZalgo } from '../../utils/modules/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'extractzalgo',
	description: 'Extract Zalgo text to Text',
	usage: '!extractzalgo <query>',
	category: 'Misc',
	aliases: ['conzalgo', 'conzalg'],
	limit: 2,
	cooldown: 3,
	status: 'enable',
	async run({ query, from, message, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply('You need to provide text', { from, quoted: message, groupMetadata });
		}

		await client[botNum].reply(extractZalgo(query), { from, quoted: message, groupMetadata });
	}
};
