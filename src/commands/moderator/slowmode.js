import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { slowModeManager } from '../../helper/slowmode.js';
import { defineCommand } from '../_define.js';
import { getPrefix } from '../../helper/modules/prefix.js';

export default defineCommand({
	name: 'slowmode',
	minifiedDescription: 'Slow mode',
	description: 'Set slow mode for group chats.',
	usage: '!slowmode `<set/off/on/remove/status>`',
	category: 'Moderation',
	aliases: ['slow'],
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ from, message, query, args, isGroup, isAdmin }, client) {
		const locale = await getLocale(from);
		const prefix = getPrefix();
		const S = useLocale(locale, 'slowmode', { prefix });

		if (!isGroup) {
			return await client.reply(from, S.errors.groupOnly, message);
		}

		if (!isAdmin) {
			return await client.reply(from, S.errors.adminOnly, message);
		}

		if (!query) {
			return await client.reply(from, S.slowmode.usage, message);
		}

		if (args[1] === 'set') {
			const duration = parseInt(args[2], 10);

			if (!duration || duration < 1 || duration > 3600) {
				return await client.reply(from, S.errors.invalidDuration, message);
			}

			slowModeManager.set(from, duration);

			await client.reply(from, S.slowmode.enabled.replace('{0}', String(duration)), message);
		} else if (args[1] === 'off') {
			const success = slowModeManager.disable(from);

			if (success) {
				await client.reply(from, S.slowmode.disabled, message);
			} else {
				await client.reply(from, S.errors.notSet, message);
			}
		} else if (args[1] === 'on') {
			const success = slowModeManager.enable(from);

			if (success) {
				await client.reply(from, S.slowmode.enabledStatus, message);
			} else {
				await client.reply(from, S.errors.notSet, message);
			}
		} else if (args[1] === 'remove') {
			const success = slowModeManager.remove(from);

			if (success) {
				await client.reply(from, S.slowmode.removed, message);
			} else {
				await client.reply(from, S.errors.notSet, message);
			}
		} else if (args[1] === 'status') {
			const settings = slowModeManager.get(from);

			if (!settings) {
				return await client.reply(from, S.errors.notSet, message);
			}

			const status = settings.enabled ? S.slowmode.active : S.slowmode.inactive;
			const adminsExcluded = settings.excludeAdmins ? S.slowmode.yes : S.slowmode.no;

			await client.reply(
				from,
				`${S.slowmode.statusTitle}\n\n${S.slowmode.status
					.replace('{0}', status)
					.replace('{1}', String(settings.duration))
					.replace('{2}', adminsExcluded)}`,
				message
			);
		} else {
			await client.reply(from, S.errors.invalidArgs, message);
		}
	}
});
