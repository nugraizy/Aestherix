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
	async run({ from, message, groupMetadata }, client) {
		const data = await client[botNum].reply('I will leave.', { from, quoted: message, groupMetadata });

		await client[botNum].groupLeave(from);
		await client[botNum].chatModify({ delete: true, lastMessages: [data] }, from);
	}
};
