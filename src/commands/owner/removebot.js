import { manager } from '../../core/manager.js';
import prisma from '../../helper/database/prisma.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'removebot',
	description: 'Disconnect and remove a sub-bot instance.',
	usage: '!removebot <session_name> [--purge]',
	aliases: ['delbot'],
	category: 'Owner',
	cooldown: 5,
	limit: 0,
	status: 'enable',
	restrict: false,
	premium: false,

	async run({ from, args, message, isOwner }, client) {
		if (!isOwner) {
			return;
		}

		const sessionName = args[1];
		const purge = args.includes('--purge');

		if (!sessionName) {
			return client.reply(from, 'Usage: !removebot <session_name> [--purge]', message);
		}

		const sub = manager.get(sessionName);

		if (!sub) {
			return client.reply(from, `❌ Bot "${sessionName}" not found.`, message);
		}

		if (sub.role === 'primary') {
			return client.reply(from, '❌ Cannot remove the primary bot.', message);
		}

		await sub.disconnect();
		manager.remove(sessionName);

		if (purge) {
			await sub.auth.clearState();
			await prisma.botInstance.deleteMany({ where: { sessionName } });

			return client.reply(from, `🗑️ Bot "${sessionName}" removed and credentials purged.`, message);
		}

		await prisma.botInstance
			.update({
				where: { sessionName },
				data: { isActive: false }
			})
			.catch(() => {});

		return client.reply(from, `🔌 Bot "${sessionName}" disconnected.`, message);
	}
});
