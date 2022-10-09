/* global botNum */
import { extractZalgo } from '../../helper/modules/index.js';

export default {
	name: 'extractzalgo',
	description: 'Extract Zalgo text to Text',
	usage: '!extractzalgo <query>',
	category: 'Misc',
	aliases: ['conzalgo', 'conzalg'],
	limit: 2,
	cooldown: 3,
	status: 'enable',
	async run({ query, from, message }, client) {
		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'You need to provide text');
		}

		await client[botNum].reply({ from, quoted: message }, extractZalgo(query));
	},
};
