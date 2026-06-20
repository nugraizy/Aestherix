import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { moderationAudit } from '../../helper/moderation-audit.js';
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
	async run({ isBotAdmin, message, from, sender, mention, query, bodyQuoted, mediaData, adminGroups, isGroup }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!isGroup) {
			return await client.reply(from, L.errors.groupOnly, message);
		}

		if (!isBotAdmin) {
			return await client.reply(from, L.errors.botNotAdmin, message);
		}

		if (!query && !mention.length && !bodyQuoted) {
			return await client.reply(from, L.errors.mentionRequired, message);
		}

		const force = /--?(force|F)/.test(query);
		const targets = bodyQuoted ? [mediaData.participant] : mention.length ? mention : query.parseNumber();

		moderationAudit.log({
			group: from,
			moderator: sender,
			action: 'kick',
			target: targets.join(', '),
			reason: force ? 'force' : ''
		});

		await client.updateGroup(from, { action: 'remove', participants: targets, admins: adminGroups, force, message });
	}
});
