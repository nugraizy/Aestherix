/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'revoke',
	description: "Revoke group's invitation URL." /* eslint-disable-line */,
	usage: '!revoke',
	aliases: ['rvk', 'tarik'],
	category: 'Moderation',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ isAdmin, isBotAdmin, isOwner, from, message, groupMetadata, sender }, client) {
		if (!isAdmin && !isOwner) {
			return await client[botNum].reply('You are not admin. This commands is only for admins.', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		if (!isBotAdmin) {
			return await client[botNum].reply('Bot is not admin, Please promote admin before using moderation commands.', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		const code = (await client[botNum].updateGroup(from, 'REVOKE'))[0];

		await client[botNum].send(
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

		await client[botNum].send(
			sender,
			{ text: `Here's the new URL:\nhttps://chat.whatsapp.com/${code}` },
			{ groupMetadata, quoted: message }
		);
	}
};
