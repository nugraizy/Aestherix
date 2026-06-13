import configuration from '../../helper/config/connect.js';
import { pushDefaultSettings, updateGroupSetting } from '../../helper/database/adapters/group-settings.js';
import prisma from '../../helper/database/prisma.js';
import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'autoread',
	minifiedDescription: 'Auto Read',
	aliases: ['autoread'],
	description: 'Enable or disable auto-read messages in this group.',
	category: 'Moderation',
	usage: '!autoread `<enable/disable>`',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run(message, client) {
		const locale = await getLocale(message.from);
		const L = useLocale(locale, 'common');

		if (!message.query) {
			return await client.reply(message.from, t(locale, 'moderation.specifyCommand', ['autoread']), message.message);
		}

		const isEnable = configuration.groups.settings.get(message.from)?.autoReader === 'enable';

		switch (message.query.toLowerCase()) {
			case 'enable':
			case 'on':
				if (isEnable) {
					return await client.reply(message.from, t(locale, 'moderation.alreadyEnabled', ['Auto read']), message.message);
				}

				configuration.groups.settings.get(message.from).autoReader = 'enable';

				if (!(await updateGroupSetting(prisma, message.from, 'autoReader', 'enable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'autoReader', 'enable');
				}

				await client.reply(message.from, t(locale, 'moderation.enabled', ['Auto read']), message.message);
				break;
			case 'disable':
			case 'off':
				if (!isEnable) {
					return await client.reply(message.from, t(locale, 'moderation.alreadyDisabled', ['Auto read']), message.message);
				}

				configuration.groups.settings.get(message.from).autoReader = 'disable';

				if (!(await updateGroupSetting(prisma, message.from, 'autoReader', 'disable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'autoReader', 'disable');
				}

				await client.reply(message.from, t(locale, 'moderation.disabled', ['Auto read']), message.message);
				break;
			default:
				await client.reply(message.from, t(locale, 'moderation.specifyCommand', ['autoread']), message.message);
		}
	}
});
