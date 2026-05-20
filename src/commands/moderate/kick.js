import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'kick',
	minifiedDescription: 'Kick User',
	description: 'Kick member from group.',
	usage: '!kick `<reply/tag member>`',
	aliases: ['remove', 'rem', 'rm'],
	category: 'Moderation',
	cooldown: 12,
	limit: 6,
	status: 'enable',
	restrict: true,
	async run({ isBotAdmin, message, from, mention, query, bodyQuoted, mediaData, adminGroups }, client) {
		if (!isBotAdmin) {
			return await client.reply(from, 'Bot is not admin, Please promote admin before using moderation commands.', message);
		}

		if (!query && !mention.length && !bodyQuoted) {
			return await client.reply(from, 'Please reply people message or mention people.', message);
		}

		const force = /--?(force|F)/.test(query);
		const targets = bodyQuoted ? [mediaData.participant] : mention.length ? mention : query.parseNumber();

		await client.updateGroup(from, { action: 'remove', participants: targets, admins: adminGroups, force, message });
	}
});
