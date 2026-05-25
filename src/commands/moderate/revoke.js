import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'revoke',
	minifiedDescription: 'Revoke Group URL',
	description: "Revoke group's invitation URL." /* eslint-disable-line */,
	usage: '!revoke',
	aliases: ['rvk', 'tarik'],
	category: 'Moderation',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ isBotAdmin, from, message, sender }, client) {
		if (!isBotAdmin) {
			return await client.reply(from, 'Bot is not admin, Please promote admin before using moderation commands.', message);
		}

		const code = (await client.updateGroup(from, 'REVOKE'))[0];

		await client.send(
			from,
			{
				text: "Succeeded to revoke the group's invitation URL." /* eslint-disable-line */,
				footer: 'Powered by Hidden Finder',
				templateButtons: [
					{
						urlButton: {
							displayText: 'Copy New URL',
							url: `https://www.whatsapp.com/otp/copy/https://chat.whatsapp.com/${code}`
						}
					}
				],
				headerType: 1
			},
			{ quoted: message }
		);

		await client.send(sender, { text: `Here's the new URL:\nhttps://chat.whatsapp.com/${code}` }, { quoted: message });
	}
});
