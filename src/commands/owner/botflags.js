import { manager } from '../../core/manager.js';
import prisma from '../../helper/database/prisma.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
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
		if (!isOwner) {
			return;
		}

		const sessionName = args[1];

		if (!sessionName) {
			return client.reply(from, 'Usage: !botflags <session_name> [--flag value]', message);
		}

		const sub = manager.get(sessionName);

		if (!sub) {
			return client.reply(from, `❌ Bot "${sessionName}" not found.`, message);
		}

		if (args.length <= 2) {
			const flags = Object.entries(sub.options.flags || {})
				.filter(([, v]) => v !== false && v !== undefined)
				.map(([k, v]) => `  --${k}${v === true ? '' : ` ${v}`}`)
				.join('\n');

			return client.reply(from, `🏷️ *${sessionName}* flags:\n\n${flags || '  (none)'}`, message);
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

		return client.reply(from, `✅ Flags updated for "${sessionName}".`, message);
	}
};
