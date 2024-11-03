import { extractZalgo } from '../../utils/modules/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'extractzalgo',
	minifiedDescription: 'Unzalgofie Text',
	description: 'Extract Zalgo text to Text',
	usage: '!extractzalgo <query>',
	category: 'Misc',
	aliases: ['conzalgo', 'conzalg'],
	limit: 2,
	cooldown: 3,
	status: 'enable',
	async run({ query, from, message }, client) {
		if (!query) {
			return await client.instance.reply('You need to provide text', { from, quoted: message });
		}

		await client.instance.reply(extractZalgo(query), { from, quoted: message });
	}
};
