/* global botNum */
import { setAfk } from '../../helper/index.js';

export default {
	name: 'afk',
	description: 'Going away from keyboard.',
	category: 'Misc',
	usage: '!afk <reason|no reason>',
	aliases: ['away', 'idle'],
	limit: 2,
	cooldown: 3,
	status: 'enable',
	async run({ message, from, query, isGroup, sender, pushname }, client) {
		if (!isGroup) {
			return await client[botNum].reply({ from, quoted: message }, 'This command is only available in group chat.');
		}

		setAfk(sender, from, query, pushname);

		await client[botNum].sendMessage(from, { text: `@${sender.split('@')[0]} is now AFK.`, mentions: [sender] }, { quoted: message });
	},
};
