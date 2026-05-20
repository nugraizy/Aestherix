import { zalgo } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'zalgo',
	minifiedDescription: 'Zalgofie Text',
	description: 'Convert Text to Zalgo text',
	usage: '!zalgo `<query>`',
	category: 'Misc',
	aliases: ['tozalgo', 'zalg'],
	limit: 2,
	cooldown: 3,
	status: 'enable',
	async run({ query, from, message, bodyQuoted }, client) {
		if (!query && !bodyQuoted) {
			return await client.reply(from, 'You need to provide text', message);
		}

		await client.reply(from, zalgo(query || bodyQuoted, { size: 'maxi' }), message);
	}
});
