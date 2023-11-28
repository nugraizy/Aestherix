/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
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
	async run({ groupMetadata, isBotAdmin, from, message }, client) {
		if (!isBotAdmin) {
			return await client.instance.reply('Bot is not admin, Please promote admin before using moderation commands.', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		if (groupMetadata.announce) {
			return await client.instance.reply('Group is already locked.', { from, quoted: message, groupMetadata });
		}

		await client.instance.updateGroup(from, 'ANNOUNCEMENT');
	}
};
