/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'leave',
	minifiedDescription: 'Leave Group',
	description: 'Leave the group',
	usage: '!leave',
	aliases: ['out', 'bye'],
	category: 'Moderation',
	cooldown: 6,
	limit: 20,
	restrict: true,
	status: 'enable',
	async run({ from, message }, client) {
		const data = await client.reply(from, 'I will leave.', message);

		await client.groupLeave(from);
		await client.chatModify({ delete: true, lastMessages: [data] }, from);
	}
};
