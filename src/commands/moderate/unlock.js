/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
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
			return await client.instance.reply('Bot is not admin, Please promote admin before using moderation commands.', {
				from,
				quoted: message
			});
		}

		if (!groupMetadata.announce) {
			return await client.instance.reply('Group is already unlocked.', { from, quoted: message });
		}

		await client.instance.updateGroup(from, undefined, 'NOT_ANNOUNCEMENT');
	}
};
