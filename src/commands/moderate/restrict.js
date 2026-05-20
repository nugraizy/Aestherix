import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'restrict',
	minifiedDescription: 'Restrict Group',
	description: 'Restrict the group.',
	usage: '!restrict',
	aliases: ['restrictgroup', 'restrictgroupchat'],
	category: 'Moderation',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ isBotAdmin, from, message, groupMetadata }, client) {
		if (!isBotAdmin) {
			return await client.reply(from, 'Bot is not admin, Please promote admin before using moderation commands.', message);
		}

		if (groupMetadata.restrict) {
			return await client.reply(from, 'Group is already restricted.', message);
		}

		await client.updateGroup(from, { action: 'locked' });
	}
});
