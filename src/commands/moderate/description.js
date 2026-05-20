import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'description',
	minifiedDescription: 'Change Description',
	description: 'Change the description of the group.',
	usage: '!description `<texts>`',
	aliases: ['desc'],
	category: 'Moderation',
	cooldown: 4,
	limit: 2,
	status: 'enable',
	async run({ isBotAdmin, query, bodyQuoted, from, message }, client) {
		if (!isBotAdmin) {
			return await client.reply(from, 'Bot is not admin, Please promote admin before using moderation commands.', message);
		}

		const text = query || bodyQuoted;

		if (!text) {
			return await client.reply(from, 'Please input the description.', message);
		}

		await client.updateGroup(from, { action: 'description', text });
	}
});
