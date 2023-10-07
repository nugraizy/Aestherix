/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
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

		await client[botNum].send(
			from,
			{
				text: `Succeeded to retrieve the group's invitation URL.\n\nhttps://chat.whatsapp.com/${
					(
						await client[botNum].updateGroup(from, 'RETRIEVE')
					)[0]
				}`
			},
			{ groupMetadata, quoted: message }
		);
	}
};
