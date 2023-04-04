export default {
	name: 'retrieve',
	description: "Retrieve the group's invitation URL." /* eslint-disable-line */,
	usage: '!retrieve',
	aliases: ['invite', 'inv', 'link'],
	category: 'Moderation',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ isAdmin, isBotAdmin, isOwner, from, message, groupMetadata }, client) {
		if (!isAdmin && !isOwner) {
			return await client[botNum].reply(
				{ groupMetadata, from, quoted: message },
				'You are not admin. This commands is only for admins.'
			);
		}

		if (!isBotAdmin) {
			return await client[botNum].reply(
				{ groupMetadata, from, quoted: message },
				'Bot is not admin, Please promote admin before using moderation commands.'
			);
		}

		await client[botNum].send(
			from,
			{
				text: `Succeeded to retrieve the group's invitation URL.\n\nhttps://chat.whatsapp.com/${
					(
						await client[botNum].updateGroup(from, undefined, 'RETRIEVE')
					)[0]
				}`
			},
			{ groupMetadata, quoted: message }
		);
	}
};
