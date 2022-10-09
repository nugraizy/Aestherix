/* global botNum */

export default {
	name: 'retrieve',
	description: 'Retrieve the group\'s invitation URL.',
	usage: '!retrieve',
	aliases: ['invite', 'inv', 'link'],
	category: 'Moderation',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ isAdmin, isBotAdmin, isOwner, from, message }, client) {
		if (!isAdmin && !isOwner) {
			return await client[botNum].reply({ from, quoted: message }, 'You are not admin. This commands is only for admins.');
		}

		if (!isBotAdmin) {
			return await client[botNum].reply({ from, quoted: message }, 'Bot is not admin, Please promote admin before using moderation commands.');
		}

		await client[botNum].sendMessage(
			from,
			{
				text: 'Succeeded to retrieve the group\'s invitation URL.',
				footer: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',
				templateButtons: [
					{
						urlButton: {
							displayText: 'Copy URL',
							url: `https://www.whatsapp.com/otp/copy/https://chat.whatsapp.com/${(await client[botNum].updateGroup(from, undefined, 'RETRIEVE'))[0]}`,
						},
					},
				],
				headerType: 1,
			},
			{ quoted: message },
		);
	},
};
