/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'unrestrict',
	minifiedDescription: 'Unrestrict Group',
	description: 'Unrestrict the group.',
	usage: '!unlock',
	aliases: ['unrestrict', 'unrestrictgroup', 'unrestrictgroupchat'],
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

		if (!groupMetadata.restrict) {
			return await client.instance.reply('Group is already unrestricted.', { from, quoted: message, groupMetadata });
		}

		await client.instance.updateGroup(from, undefined, 'UNLOCKED');
	}
};
