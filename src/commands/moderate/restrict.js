/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'restrict',
	minifiedDescription: 'Restrict Group',
	description: 'Restrict the group.',
	usage: '!restrict',
	aliases: ['restrictgroup', 'restrictgroupchat'],
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

		if (groupMetadata.restrict) {
			return await client.instance.reply('Group is already restricted.', { from, quoted: message, groupMetadata });
		}

		await client.instance.updateGroup(from, 'LOCKED');
	}
};
