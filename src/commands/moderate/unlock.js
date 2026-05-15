export default {
	name: 'unlock',
	minifiedDescription: 'Unlock Group',
	description: 'Unlock the group.',
	usage: '!unlock',
	aliases: ['unlocked', 'unlockgroup', 'unlockgroupchat'],
	category: 'Moderation',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ isBotAdmin, from, message, groupMetadata }, client) {
		if (!isBotAdmin) {
			return await client.reply(from, 'Bot is not admin, Please promote admin before using moderation commands.', message);
		}

		if (!groupMetadata.announce) {
			return await client.reply(from, 'Group is already unlocked.', message);
		}

		await client.updateGroup(from, { action: 'not_announcement' });
	}
};
