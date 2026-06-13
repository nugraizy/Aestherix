import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
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
	async run({ isBotAdmin, from, query, mention, bodyQuoted, mediaData, message, adminGroups, isGroup }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!isGroup) {
			return await client.reply(from, L.errors.groupOnly, message);
		}

		if (!isBotAdmin) {
			return await client.reply(from, L.errors.botNotAdmin, message);
		}

		if (!query && !bodyQuoted) {
			return await client.reply(from, L.errors.mentionOrNumberRequired, message);
		}

		if (mention.length) {
			return await client.reply(from, L.errors.mentionOrNumberRequired, message);
		}

		const targets = bodyQuoted ? [mediaData.id] : query.parseNumber();

		await client.updateGroup(from, { action: 'add', participants: targets, admins: adminGroups, message });
	}
});
