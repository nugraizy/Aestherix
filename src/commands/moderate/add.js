export default {
	name: 'add',
	minifiedDescription: 'Invite User',
	description: 'Add people to group.',
	usage: '!add `<reply/tag member>`',
	aliases: ['addmem', 'invite'],
	category: 'Moderation',
	cooldown: 10,
	limit: 4,
	restrict: true,
	status: 'enable',
	async run({ isBotAdmin, from, query, mention, bodyQuoted, mediaData, message, adminGroups }, client) {
		if (!isBotAdmin) {
			return await client.reply(from, 'Bot is not admin, Please promote admin before using moderation commands.', message);
		}

		if (!query && !bodyQuoted) {
			return await client.reply(from, 'Please reply people message or input people number.', message);
		}

		if (mention.length) {
			return await client.reply(from, 'Please reply people message or input people number.', message);
		}

		const targets = bodyQuoted ? [mediaData.id] : query.parseNumber();

		await client.updateGroup(from, { action: 'add', participants: targets, admins: adminGroups, message });
	}
};
