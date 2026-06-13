import { manager } from '../../core/manager.js';
import { IS_PM2, stopPm2SubBot } from '../../core/pm2-helpers.js';
import configuration from '../../helper/config/connect.js';
import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import prisma from '../../helper/database/prisma.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'removebot',
	description: 'Disconnect and remove this bot instance.',
	usage: '!removebot [--purge]',
	aliases: ['delbot'],
	category: 'Moderation',
	cooldown: 5,
	limit: 0,
	status: 'enable',
	restrict: true,

	async run({ from, args, message, isGroup }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!isGroup) {
			return await client.reply(from, L.errors.groupOnly, message);
		}

		const purge = args.includes('--purge');
		const sessionName = client.sessionName;

		if (client.role === 'primary') {
			return await client.reply(from, L.errors.cannotRemoveMainBot, message);
		}

		if (IS_PM2) {
			await stopPm2SubBot(sessionName);

			if (purge) {
				const { cleanupSession } = await import('../../core/session-cleanup.js');

				await cleanupSession(sessionName);
				return client.reply(from, t(locale, 'bot.pm2Purged', [sessionName]), message);
			}

			await prisma.botInstance
				.update({
					where: { sessionName },
					data: { isActive: false }
				})
				.catch(() => {});

			return client.reply(from, t(locale, 'bot.pm2Stopped', [sessionName]), message);
		}

		const sub = manager.get(sessionName);

		if (!sub) {
			return client.reply(from, t(locale, 'bot.notFound', [sessionName]), message);
		}

		await sub.disconnect();
		manager.remove(sessionName);

		if (configuration.logMultiplexer) {
			configuration.logMultiplexer.unregister(`SUB-${sessionName}`);
		}

		if (purge) {
			await sub.auth.clearState();
			await prisma.botInstance.deleteMany({ where: { sessionName } });

			return client.reply(from, t(locale, 'bot.removed', [sessionName]), message);
		}

		await prisma.botInstance
			.update({
				where: { sessionName },
				data: { isActive: false }
			})
			.catch(() => {});

		return client.reply(from, t(locale, 'bot.disconnected', [sessionName]), message);
	}
});
