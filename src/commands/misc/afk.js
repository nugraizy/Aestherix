import { setAfk } from '../../helper/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'afk',
	minifiedDescription: 'AFK Mode',
	description: 'Going away from keyboard.',
	category: 'Misc',
	usage: '!afk `<reason|no reason>`',
	aliases: ['away', 'idle'],
	limit: 2,
	cooldown: 3,
	status: 'enable',
	async run({ message, from, query, isGroup, sender, pushname }, client) {
		if (!isGroup) {
			return await client.reply(from, 'This command is only available in group chat.', message);
		}

		setAfk(sender, from, query, pushname);

		await client.send(from, { text: `@${sender.split('@')[0]} is now AFK.`, mentions: [sender] }, { quoted: message });
	}
});
