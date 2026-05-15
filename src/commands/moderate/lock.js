export default {
	name: 'lock',
	minifiedDescription: 'Lock Group',
	description: 'Lock the group.',
	usage: '!lock',
	aliases: ['lockgroup', 'lockgroupchat', 'lockgroupchatroom'],
	category: 'Moderation',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ isBotAdmin, from, message, groupMetadata }, client) {
		if (!isBotAdmin) {
			return await client.reply(from, 'Bot is not admin, Please promote admin before using moderation commands.', message);
		}

		if (groupMetadata.announce) {
			return await client.reply(from, 'Group is already locked.', message);
		}

		await client.updateGroup(from, { action: 'announcement' });
	}
};
