import configuration from '../../helper/config/connect.js';
import { pushDefaultSettings, updateGroupSetting } from '../../helper/database/adapters/group-settings.js';
import prisma from '../../helper/database/prisma.js';
import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'setleave',
	minifiedDescription: 'Leave Message Setting',
	aliases: ['leavesetting', 'goodbye-setting'],
	description: 'Enable or disable leave message when members exit.',
	category: 'Moderation',
	usage: '!setleave `<enable/disable>`',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run(message, client) {
		const locale = await getLocale(message.from);
		const L = useLocale(locale, 'common');

		if (!message.query) {
			return await client.reply(message.from, t(locale, 'moderation.specifyCommand', ['setleave']), message.message);
		}

		const isEnable = configuration.groups.settings.get(message.from)?.leave === 'enable';

		switch (message.query.toLowerCase()) {
			case 'enable':
			case 'on':
				if (isEnable) {
					return await client.reply(message.from, t(locale, 'moderation.alreadyEnabled', ['Leave message']), message.message);
				}

				configuration.groups.settings.get(message.from).leave = 'enable';

				if (!(await updateGroupSetting(prisma, message.from, 'leave', 'enable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'leave', 'enable');
				}

				await client.reply(message.from, t(locale, 'moderation.enabled', ['Leave message']), message.message);
				break;
			case 'disable':
			case 'off':
				if (!isEnable) {
					return await client.reply(message.from, t(locale, 'moderation.alreadyDisabled', ['Leave message']), message.message);
				}

				configuration.groups.settings.get(message.from).leave = 'disable';

				if (!(await updateGroupSetting(prisma, message.from, 'leave', 'disable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'leave', 'disable');
				}

				await client.reply(message.from, t(locale, 'moderation.disabled', ['Leave message']), message.message);
				break;
			default:
				await client.reply(message.from, t(locale, 'moderation.specifyCommand', ['setleave']), message.message);
		}
	}
});
