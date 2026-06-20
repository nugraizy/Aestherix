import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { schedulerManager } from '../../helper/scheduler.js';
import { defineCommand } from '../_define.js';
import { getPrefix } from '../../helper/modules/prefix.js';

export default defineCommand({
	name: 'schedule',
	minifiedDescription: 'Schedule messages',
	description: 'Schedule recurring messages for groups.',
	usage: '!schedule `<add/list/cancel/cancelall>`',
	category: 'Misc',
	aliases: ['sched'],
	cooldown: 3,
	limit: 1,
	status: 'enable',
	async run({ from, message, query, args, sender }, client) {
		const locale = await getLocale(from);
		const prefix = getPrefix();
		const S = useLocale(locale, 'schedule', { prefix });

		if (!query) {
			return await client.reply(from, S.schedule.usage, message);
		}

		if (args[1] === 'list') {
			const schedules = schedulerManager.list(from);

			if (schedules.length === 0) {
				return await client.reply(from, S.schedule.noSchedules, message);
			}

			const list = schedules
				.map((s, i) =>
					S.schedule.listItem
						.replace('{0}', String(i + 1))
						.replace('{1}', s.message)
						.replace('{2}', s.cron)
						.replace('{3}', s.id)
				)
				.join('\n');

			await client.reply(from, `${S.schedule.listTitle}\n\n${list}`, message);
		} else if (args[1] === 'cancel') {
			const id = args[2];

			if (!id) {
				return await client.reply(from, S.errors.provideId, message);
			}

			const success = schedulerManager.cancel(id);

			if (success) {
				await client.reply(from, S.schedule.cancelled, message);
			} else {
				await client.reply(from, S.errors.notFound, message);
			}
		} else if (args[1] === 'cancelall') {
			const count = schedulerManager.cancelAll(from);

			await client.reply(from, S.schedule.cancelledAll.replace('{0}', String(count)), message);
		} else if (args[1] === 'add') {
			const timeStr = args[2];
			const msgMatch = query.match(/add\s+\S+\s+"([^"]+)"/);

			if (!timeStr || !msgMatch) {
				return await client.reply(from, S.errors.provideSchedule, message);
			}

			const scheduledMessage = msgMatch[1];
			const cronExpression = schedulerManager.parseCronExpression(timeStr);

			if (!cronExpression) {
				return await client.reply(from, S.errors.invalidTime, message);
			}

			const schedule = schedulerManager.add(from, sender, scheduledMessage, cronExpression);

			if (schedule) {
				await client.reply(
					from,
					S.schedule.created
						.replace('{0}', scheduledMessage)
						.replace('{1}', timeStr)
						.replace('{2}', cronExpression)
						.replace('{3}', schedule.id),
					message
				);
			} else {
				await client.reply(from, S.errors.failedCreate, message);
			}
		} else {
			await client.reply(from, S.errors.invalidArgs, message);
		}
	}
});
