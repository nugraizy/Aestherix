import { extractZalgo } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'extractzalgo',
	minifiedDescription: 'Unzalgofie Text',
	description: 'Extract Zalgo text to Text',
	usage: '!extractzalgo `<query>`',
	category: 'Misc',
	aliases: ['conzalgo', 'conzalg'],
	limit: 2,
	cooldown: 3,
	status: 'enable',
	async run({ query, from, message }, client) {
		if (!query) {
			return await client.reply(from, 'You need to provide text', message);
		}

		await client.reply(from, extractZalgo(query), message);
	}
});
