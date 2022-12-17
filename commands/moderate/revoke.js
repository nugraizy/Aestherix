/* global botNum */

export default {
	name: 'revoke',
	description: "Revoke group's invitation URL." /* eslint-disable-line */,
	usage: '!revoke',
	aliases: ['rvk', 'tarik'],
	category: 'Moderation',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ isAdmin, isBotAdmin, isOwner, from, message }, client) {
		if (!isAdmin && !isOwner) {
			return await client[botNum].reply({ from, quoted: message }, 'You are not admin. This commands is only for admins.');
		}

		if (!isBotAdmin) {
			return await client[botNum].reply(
				{ from, quoted: message },
				'Bot is not admin, Please promote admin before using moderation commands.',
			);
		}

		const code = (await client[botNum].updateGroup(from, undefined, 'REVOKE'))[0];

		await client[botNum].sendMessage(
			from,
			{
				text: "Succeeded to revoke the group's invitation URL." /* eslint-disable-line */,
				footer: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',
				templateButtons: [
					{
						urlButton: {
							displayText: 'Copy New URL',
							url: `https://www.whatsapp.com/otp/copy/https://chat.whatsapp.com/${code}`,
						},
					},
				],
				headerType: 1,
			},
			{ quoted: message },
		);
	},
};
