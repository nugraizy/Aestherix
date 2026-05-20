import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'retrieve',
	minifiedDescription: 'Retrieve Group URL',
	description: 'Retrieve the group\'s invitation URL.',
	usage: '!retrieve',
	aliases: ['inv', 'link'],
	category: 'Moderation',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ isBotAdmin, from, message }, client) {
		if (!isBotAdmin) {
			return await client.reply(from, 'Bot is not admin, Please promote admin before using moderation commands.', message);
		}

		const [code] = await client.updateGroup(from, { action: 'retrieve' });

		await client.send(from, { text: `https://chat.whatsapp.com/${code}` }, { quoted: message });
	}
});
