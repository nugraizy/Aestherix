/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'lock',
	description: 'Lock the group.',
	usage: '!lock',
	aliases: ['lockgroup', 'lockgroupchat', 'lockgroupchatroom'],
	category: 'Moderation',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ groupMetadata, isAdmin, isOwner, isBotAdmin, from, message }, client) {
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

		if (groupMetadata.announce) {
			return await client[botNum].reply('Group is already locked.', { from, quoted: message, groupMetadata });
		}

		await client[botNum].updateGroup(from, 'ANNOUNCEMENT');
	}
};
