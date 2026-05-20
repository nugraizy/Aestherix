import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'demote',
	minifiedDescription: 'Demote Admin',
	description: 'Demote admin to member.',
	usage: '!demote `<reply/tag member>`',
	aliases: ['demt', 'member', 'mem', 'dmt'],
	category: 'Moderation',
	cooldown: 10,
	limit: 2,
	status: 'enable',
	restrict: true,
	async run({ isBotAdmin, mention, from, mediaData, query, bodyQuoted, message, adminGroups }, client) {
		if (!isBotAdmin) {
			return await client.reply(from, 'Bot is not admin, Please promote admin before using moderation commands.', message);
		}

		if (!query && !mention.length && !bodyQuoted) {
			return await client.reply(from, 'Please reply people message or mention people.', message);
		}

		const targets = bodyQuoted ? [mediaData.participant] : mention.length ? mention : query.parseNumber();

		await client.updateGroup(from, { action: 'demote', participants: targets, admins: adminGroups, message });
	}
});
