import { zalgo } from '../../utils/modules/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'zalgo',
	description: 'Convert Text to Zalgo text',
	usage: '!zalgo <query>',
	category: 'Misc',
	aliases: ['tozalgo', 'zalg'],
	limit: 2,
	cooldown: 3,
	status: 'enable',
	async run({ query, from, message, bodyQuoted, groupMetadata }, client) {
		if (!query && !bodyQuoted) {
			return await client[botNum].reply('You need to provide text', { from, quoted: message, groupMetadata });
		}

		await client[botNum].reply(zalgo(query || bodyQuoted, { size: 'maxi' }), { from, quoted: message, groupMetadata });
	}
};
