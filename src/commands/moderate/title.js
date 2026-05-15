export default {
	name: 'title',
	minifiedDescription: 'Group Title',
	description: 'Change the title of the group.',
	usage: '!title `<texts>`',
	aliases: ['subject', 'topic', 'name'],
	category: 'Moderation',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ isBotAdmin, from, query, bodyQuoted, message }, client) {
		if (!isBotAdmin) {
			return await client.reply(from, 'Bot is not admin, Please promote admin before using moderation commands.', message);
		}

		const text = query || bodyQuoted;

		if (!text) {
			return await client.reply(from, 'Please input the title.', message);
		}

		await client.updateGroup(from, { action: 'subject', text });
	}
};
