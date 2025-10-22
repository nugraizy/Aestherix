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
	async run({ isBotAdmin, from, message, groupMetadata }, client) {
		if (!isBotAdmin) {
			return await client.instance.reply(
				from,
				'Bot is not admin, Please promote admin before using moderation commands.',
				message
			);
		}

		if (!groupMetadata.restrict) {
			return await client.instance.reply(from, 'Group is already unrestricted.', message);
		}

		await client.instance.updateGroup(from, undefined, 'UNLOCKED');
	}
};
