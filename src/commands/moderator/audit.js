import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { moderationAudit } from '../../helper/moderation-audit.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'audit',
	minifiedDescription: 'Audit Trail',
	description: 'View moderation action history.',
	usage: '!audit [limit]\n!audit @user\n!audit search <keyword>',
	aliases: ['auditlog', 'modlog'],
	category: 'Moderation',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	restrict: true,
	async run(ctx, client) {
		const { from, args, mention, isGroup, message } = ctx;
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!isGroup) {
			return await client.reply(from, L.errors.groupOnly, message);
		}

		const sub = (args[1] || '').toLowerCase();

		if (sub === 'search' && args[2]) {
			const keyword = args.slice(2).join(' ');
			const results = moderationAudit.search({ group: from, keyword, limit: 10 });

			if (!results.length) {
				return await client.reply(from, L.audit.info.noResults, message);
			}

			const list = results
				.map((e) => `• [${e.timestamp.slice(0, 16)}] ${e.action} by ${e.moderator} → ${e.target}${e.reason ? ` (${e.reason})` : ''}`)
				.join('\n');

			return await client.reply(from, `*Audit — keyword "${keyword}":*\n${list}`, message);
		}

		if (mention.length) {
			const user = mention[0];
			const results = moderationAudit.search({ group: from, user, limit: 10 });

			if (!results.length) {
				return await client.reply(from, L.audit.info.noResults, message);
			}

			const list = results
				.map((e) => `• [${e.timestamp.slice(0, 16)}] ${e.action} — moderator: ${e.moderator}${e.reason ? ` (${e.reason})` : ''}`)
				.join('\n');

			return await client.reply(from, `*Audit — @${user.split('@')[0]}:*\n${list}`, message);
		}

		const limit = Math.min(parseInt(args[1]) || 10, 50);
		const results = moderationAudit.search({ group: from, limit });

		if (!results.length) {
			return await client.reply(from, L.audit.info.noEntries, message);
		}

		const list = results
			.map((e) => `• [${e.timestamp.slice(0, 16)}] ${e.action} by ${e.moderator} → ${e.target}${e.reason ? ` (${e.reason})` : ''}`)
			.join('\n');

		return await client.reply(from, `*Audit Trail (last ${limit}):*\n${list}`, message);
	}
});
