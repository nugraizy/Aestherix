import { manager } from '../../core/manager.js';
import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import prisma from '../../helper/database/prisma.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'botflags',
	description: 'View or modify flags on a sub-bot.',
	usage: '!botflags <session_name> [--flag value]',
	aliases: [],
	category: 'Owner',
	cooldown: 3,
	limit: 0,
	status: 'enable',
	restrict: false,
	premium: false,

	async run({ from, args, message, isOwner }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Lo = useLocale(locale, 'owner');

		if (!isOwner) {
			return;
		}

		const sessionName = args[1];

		if (!sessionName) {
			return client.reply(from, L.errors.missingArgs, message);
		}

		const sub = manager.get(sessionName);

		if (!sub) {
			return client.reply(from, t(locale, 'owner.labels.botNotFound', [sessionName]), message);
		}

		if (args.length <= 2) {
			const flags = Object.entries(sub.options.flags || {})
				.filter(([, v]) => v !== false && v !== undefined)
				.map(([k, v]) => `  --${k}${v === true ? '' : ` ${v}`}`)
				.join('\n');

			return client.reply(from, t(locale, 'owner.titles.botFlags', [sessionName]) + `\n\n${flags || '  (none)'}`, message);
		}

		const newFlags = {};

		for (let i = 2; i < args.length; i++) {
			const arg = args[i];

			if (!arg.startsWith('--')) {
				continue;
			}

			const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
			const next = args[i + 1];

			if (!next || next.startsWith('--')) {
				newFlags[key] = true;
			} else {
				newFlags[key] = next;
				i++;
			}
		}

		Object.assign(sub.options.flags, newFlags);

		await prisma.botInstance
			.update({
				where: { sessionName },
				data: { flags: JSON.stringify(sub.options.flags) }
			})
			.catch(() => {});

		return client.reply(from, t(locale, 'owner.labels.flagsUpdated', [sessionName]), message);
	}
});
