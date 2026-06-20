import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { moderationAudit } from '../../helper/moderation-audit.js';
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
	async run({ isBotAdmin, mention, from, sender, mediaData, query, bodyQuoted, message, adminGroups, isGroup }, client) {
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

		const targets = bodyQuoted ? [mediaData.participant] : mention.length ? mention : query.parseNumber();

		moderationAudit.log({
			group: from,
			moderator: sender,
			action: 'demote',
			target: targets.join(', ')
		});

		await client.updateGroup(from, { action: 'demote', participants: targets, admins: adminGroups, message });
	}
});
