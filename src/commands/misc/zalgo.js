import { zalgo } from '../../utils/modules/index.js';

/**
 * @type {import('../types.js').Plugins}
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
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'You need to provide text');
		}

		await client[botNum].reply({ groupMetadata, from, quoted: message }, zalgo(query || bodyQuoted, { size: 'maxi' }));
	}
};
