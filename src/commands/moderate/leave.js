/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'leave',
	description: 'Leave the group',
	usage: '!leave',
	aliases: ['out', 'bye'],
	category: 'Moderation',
	cooldown: 6,
	limit: 20,
	restrict: true,
	status: 'enable',
	async run({ isAdmin, isOwner, from, isGroup, message, groupMetadata }, client) {
		if (!isGroup) {
			return await client[botNum].reply('This command only works in group.', { from, quoted: message, groupMetadata });
		}

		if (!isAdmin && !isOwner) {
			return await client[botNum].reply('You must be an admin to use this command.', { from, quoted: message, groupMetadata });
		}

		const data = await client[botNum].reply('I will leave.', { from, quoted: message, groupMetadata });

		await client[botNum].groupLeave(from);
		await client[botNum].chatModify({ delete: true, lastMessages: [data] }, from);
	}
};
