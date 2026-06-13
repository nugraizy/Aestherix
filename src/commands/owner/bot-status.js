import { manager } from '../../core/manager.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';
import prisma from '../../helper/database/prisma.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'botstatus',
	description: 'Check the status of all bot instances.',
	usage: '!botstatus',
	aliases: ['bs', 'botinfo'],
	category: 'Owner',
	cooldown: 3,
	limit: 0,
	status: 'enable',
	restrict: false,
	premium: false,

	async run({ from, message, isOwner }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!isOwner) {
			return;
		}

		const instances = await prisma.botInstance.findMany().catch(() => []);
		const entries = manager.list();
		const managed = new Map(entries.map((e) => [e.name, e.client]));

		if (instances.length === 0 && entries.length === 0) {
			return client.reply(from, L.errors.noBotsConfigured, message);
		}

		const lines = [];

		for (const instance of instances) {
			const live = managed.get(instance.sessionName);
			let status;

			if (live) {
				status = live.state === 'connected' ? '🟢 Online' : live.state === 'connecting' ? '🟡 Connecting' : '🔴 Disconnected';
			} else if (instance.isActive) {
				status = '⚪ Registered (not running)';
			} else {
				status = '⚫ Disabled';
			}

			const phone = live?.phone ?? instance.pairNumber ?? '-';
			const uptime = live?.uptime ?? '-';
			const flags = instance.flags === '{}' ? '-' : instance.flags;

			lines.push(
				`*${instance.sessionName}*\n  Status: ${status}\n  Phone: ${phone}\n  Role: ${instance.role}\n  Uptime: ${uptime}\n  Flags: ${flags}`
			);
		}

		for (const entry of entries) {
			if (instances.some((i) => i.sessionName === entry.name)) {
				continue;
			}

			const status = entry.client.state === 'connected' ? '🟢 Online' : '🔴 Disconnected';
			const phone = entry.client.phone ?? '-';
			const uptime = entry.client.uptime ?? '-';

			lines.push(
				`*${entry.name}*\n  Status: ${status}\n  Phone: ${phone}\n  Role: ${entry.client.role}\n  Uptime: ${uptime}\n  Flags: -`
			);
		}

		return client.reply(from, `🤖 *Bot Status*\n\n${lines.join('\n\n')}`, message);
	}
});
