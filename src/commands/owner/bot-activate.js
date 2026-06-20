import { manager } from '../../core/manager.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';
import prisma from '../../helper/database/prisma.js';
import { color } from '../../utils/modules/color.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'botactivate',
	description: 'Activate, deactivate, or list bot instances.',
	usage: '!botactivate <list|enable|disable> <session_name>',
	aliases: ['ba', 'botact'],
	category: 'Owner',
	cooldown: 3,
	limit: 0,
	status: 'enable',
	restrict: false,
	premium: false,

	async run({ from, args, message, isOwner }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!isOwner) {
			return;
		}

		const action = (args[0] || 'list').toLowerCase();

		if (action === 'list') {
			const instances = await prisma.botInstance.findMany().catch(() => []);

			if (instances.length === 0) {
				return client.reply(from, L.errors.noBotsConfigured, message);
			}

			const lines = instances.map((inst, i) => {
				const status = inst.isActive ? '✅ Active' : '❌ Disabled';
				const live = manager.has(inst.sessionName);
				const runtime = live ? ' (running)' : '';

				return `${i + 1}. *${inst.sessionName}* — ${status}${runtime}`;
			});

			return client.reply(from, `🤖 *Bot Instances*\n\n${lines.join('\n')}`, message);
		}

		if (action !== 'enable' && action !== 'disable') {
			return client.reply(from, L.errors.missingArgs, message);
		}

		const sessionName = args[1];

		if (!sessionName) {
			return client.reply(from, `Usage: !botactivate ${action} <session_name>`, message);
		}

		const instance = await prisma.botInstance.findUnique({ where: { sessionName } }).catch(() => null);

		if (!instance) {
			return client.reply(from, L.owner.errors.botNotFound.replace('{0}', sessionName), message);
		}

		const isActive = action === 'enable';

		if (instance.isActive === isActive) {
			const label = isActive ? L.owner.errors.alreadyActive.replace('{0}', sessionName) : L.owner.errors.alreadyDisabled.replace('{0}', sessionName);

			return client.reply(from, label, message);
		}

		await prisma.botInstance.update({
			where: { sessionName },
			data: { isActive }
		});

		if (!isActive) {
			const live = manager.get(sessionName);

			if (live) {
				live.disconnect().catch(() => {});
				manager.remove(sessionName);
			}

			return client.reply(from, L.owner.success.botDisabled.replace('{0}', sessionName), message);
		}

		return client.reply(
			from,
			L.owner.success.botEnabled.replace('{0}', sessionName).replace('{1}', color(`!addbot ${sessionName}`, 'lilac')),
			message
		);
	}
});
