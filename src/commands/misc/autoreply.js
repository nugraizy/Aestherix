import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { autoReplyManager } from '../../helper/auto-reply.js';
import { defineCommand } from '../_define.js';
import { getPrefix } from '../../helper/modules/prefix.js';

export default defineCommand({
	name: 'autoreply',
	minifiedDescription: 'Auto-reply triggers',
	description: 'Set up automatic replies to keywords.',
	usage: '!autoreply `<add/remove/list/removeall>`',
	category: 'Misc',
	aliases: ['ar'],
	cooldown: 3,
	limit: 1,
	status: 'enable',
	async run({ from, message, query, args, sender }, client) {
		const locale = await getLocale(from);
		const prefix = getPrefix();
		const A = useLocale(locale, 'autoreply', { prefix });

		if (!query) {
			return await client.reply(from, A.autoreply.usage, message);
		}

		if (args[1] === 'list') {
			const replies = autoReplyManager.list(from);

			if (replies.length === 0) {
				return await client.reply(from, A.autoreply.noReplies, message);
			}

			const list = replies
				.map((r, i) => {
					const typeStr = r.isRegex ? A.autoreply.regex : '';
					const cdStr = r.cooldown > 0 ? A.autoreply.cooldown.replace('{0}', String(r.cooldown)) : '';

					return A.autoreply.listItem
						.replace('{0}', String(i + 1))
						.replace('{1}', r.pattern)
						.replace('{2}', r.response)
						.replace('{3}', typeStr)
						.replace('{4}', cdStr)
						.replace('{5}', r.id);
				})
				.join('\n');

			await client.reply(from, `${A.autoreply.listTitle}\n\n${list}`, message);
		} else if (args[1] === 'remove') {
			const id = args[2];

			if (!id) {
				return await client.reply(from, A.errors.provideId, message);
			}

			const success = autoReplyManager.remove(id);

			if (success) {
				await client.reply(from, A.autoreply.removed, message);
			} else {
				await client.reply(from, A.errors.notFound, message);
			}
		} else if (args[1] === 'removeall') {
			const count = autoReplyManager.removeAll(from);

			await client.reply(from, A.autoreply.removedAll.replace('{0}', String(count)), message);
		} else if (args[1] === 'add') {
			const patternMatch = query.match(/add\s+"([^"]+)"/);
			const responseMatch = query.match(/"([^"]+)"\s+"([^"]+)"/);

			if (!patternMatch || !responseMatch) {
				return await client.reply(from, A.errors.providePattern, message);
			}

			const pattern = patternMatch[1];
			const response = responseMatch[2];
			const isRegex = args.includes('regex');
			let cooldown = 0;

			const cdIndex = args.indexOf('--cd');

			if (cdIndex !== -1 && args[cdIndex + 1]) {
				cooldown = parseInt(args[cdIndex + 1], 10) || 0;
			}

			const reply = autoReplyManager.add(from, sender, pattern, response, {
				isRegex,
				cooldown
			});

			const typeStr = isRegex ? A.autoreply.regex : '';
			const cdStr = cooldown > 0 ? A.autoreply.cooldown.replace('{0}', String(cooldown)) : '';

			await client.reply(
				from,
				A.autoreply.added
					.replace('{0}', pattern)
					.replace('{1}', typeStr)
					.replace('{2}', response)
					.replace('{3}', cdStr)
					.replace('{4}', reply.id),
				message
			);
		} else {
			await client.reply(from, A.errors.invalidArgs, message);
		}
	}
});
