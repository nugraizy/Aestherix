/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'unlock',
	description: 'Unlock the group.',
	usage: '!unlock',
	aliases: ['unlocked', 'unlockgroup', 'unlockgroupchat'],
	category: 'Moderation',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ groupMetadata, isAdmin, isBotAdmin, isOwner, from, message }, client) {
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

		if (!groupMetadata.announce) {
			return await client[botNum].reply('Group is already unlocked.', { from, quoted: message, groupMetadata });
		}

		await client[botNum].updateGroup(from, undefined, 'NOT_ANNOUNCEMENT');
	}
};
