import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { moderationAudit } from '../../helper/moderation-audit.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'promote',
	minifiedDescription: 'Promote User',
	description: 'Promote member to admin.',
	usage: '!promote `<reply/tag member>`',
	aliases: ['prmt', 'admin', 'adm'],
	category: 'Moderation',
	cooldown: 8,
	limit: 6,
	status: 'enable',
	restrict: true,
	async run({ isBotAdmin, query, from, sender, bodyQuoted, mediaData, mention, message, adminGroups }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!isBotAdmin) {
			return await client.reply(from, L.errors.botNotAdmin, message);
		}

		if (!query && !mention.length && !bodyQuoted) {
			return await client.reply(from, L.errors.mentionRequired, message);
		}

		const targets = bodyQuoted ? [mediaData.participant] : mention.length ? mention : query.parseNumber();

		moderationAudit.log({
			group: from,
			moderator: sender,
			action: 'promote',
			target: targets.join(', ')
		});

		await client.updateGroup(from, { action: 'promote', participants: targets, admins: adminGroups, message });
	}
});
