/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'revoke',
	minifiedDescription: 'Revoke Group URL',
	description: "Revoke group's invitation URL." /* eslint-disable-line */,
	usage: '!revoke',
	aliases: ['rvk', 'tarik'],
	category: 'Moderation',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ isBotAdmin, from, message, groupMetadata, sender }, client) {
		if (!isBotAdmin) {
			return await client.instance.reply('Bot is not admin, Please promote admin before using moderation commands.', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		const code = (await client.instance.updateGroup(from, 'REVOKE'))[0];

		await client.instance.send(
			from,
			{
				text: "Succeeded to revoke the group's invitation URL." /* eslint-disable-line */,
				footer: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',
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
			{ groupMetadata, quoted: message }
		);

		await client.instance.send(
			sender,
			{ text: `Here's the new URL:\nhttps://chat.whatsapp.com/${code}` },
			{ groupMetadata, quoted: message }
		);
	}
};
