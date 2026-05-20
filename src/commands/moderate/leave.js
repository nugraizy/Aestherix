import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'leave',
	minifiedDescription: 'Leave Group',
	description: 'Make the bot leave the group.',
	usage: '!leave',
	aliases: ['out', 'bye'],
	category: 'Moderation',
	cooldown: 6,
	limit: 20,
	restrict: true,
	status: 'enable',
	async run({ from, message, isSuperOwner }, client) {
		if (!isSuperOwner) {
			return await client.reply(from, 'Only the super owner can use this command.', message);
		}

		const data = await client.reply(from, 'I will leave.', message);

		await client.groupLeave(from);
		await client.chatModify({ delete: true, lastMessages: [data] }, from);
	}
});
