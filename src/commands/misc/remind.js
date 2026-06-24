import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { reminderManager } from '../../helper/reminder.js';
import { defineCommand } from '../_define.js';
import { getPrefix } from '../../helper/modules/prefix.js';

export default defineCommand({
	name: 'remind',
	minifiedDescription: 'Set a reminder',
	description: 'Set a reminder for yourself.',
	usage: '!remind `<30m/1h/2d>` `<message>`',
	category: 'Misc',
	aliases: ['reminder', 'rm'],
	cooldown: 3,
	limit: 1,
	status: 'enable',
	async run({ from, message, query, args, sender }, client) {
		const locale = await getLocale(from);
		const prefix = getPrefix();
		const R = useLocale(locale, 'reminder', { prefix });

		if (!query) {
			return await client.reply(from, R.reminder.usage, message);
		}

		if (args[1] === 'list') {
			const reminders = reminderManager.list(sender);

			if (reminders.length === 0) {
				return await client.reply(from, R.reminder.noReminders, message);
			}

			const list = reminders
				.map((r, i) => {
					const timeLeft = r.triggerAt - Date.now();
					const timeStr = timeLeft > 0 ? reminderManager.formatTime(timeLeft) : R.reminder.dueNow;

				return t(locale, 'reminder.reminder.listItem', [String(i + 1), r.message, timeStr, r.id]);
				})
				.join('\n');

			await client.reply(from, `${R.reminder.listTitle}\n\n${list}`, message);
		} else if (args[1] === 'cancel') {
			const id = args[2];

			if (!id) {
				return await client.reply(from, R.errors.provideId, message);
			}

			const success = reminderManager.cancel(id);

			if (success) {
				await client.reply(from, R.reminder.cancelled, message);
			} else {
				await client.reply(from, R.errors.notFound, message);
			}
		} else if (args[1] === 'cancelall') {
			const count = reminderManager.cancelAll(sender);

			await client.reply(from, t(locale, 'reminder.reminder.cancelledAll', [String(count)]), message);
		} else {
			const timeStr = args[1];
			const reminderMessage = args.slice(2).join(' ');

			if (!timeStr || !reminderMessage) {
				return await client.reply(from, R.errors.provideTime, message);
			}

			const delayMs = reminderManager.parseTime(timeStr);

			if (!delayMs) {
				return await client.reply(from, R.errors.invalidTime, message);
			}

			if (delayMs < 1000) {
				return await client.reply(from, R.errors.minTime, message);
			}

			if (delayMs > 30 * 24 * 60 * 60 * 1000) {
				return await client.reply(from, R.errors.maxTime, message);
			}

			const reminder = reminderManager.add(from, sender, reminderMessage, delayMs);
			const timeFormatted = reminderManager.formatTime(delayMs);

			await client.reply(
				from,
				t(locale, 'reminder.reminder.set', [reminderMessage, timeFormatted, reminder.id]),
				message
			);
		}
	}
});
