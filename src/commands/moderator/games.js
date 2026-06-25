import configuration from '../../helper/config/connect.js';
import { pushDefaultSettings, updateGroupSetting } from '../../helper/database/adapters/group-settings.js';
import prisma from '../../helper/database/prisma.js';
import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'games',
	minifiedDescription: 'Enable/Disable Games Mode',
	aliases: ['game'],
	description: 'Play games with your friends',
	category: 'Moderation',
	usage: '!games `<enable/disable>`',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run(message, client) {
		const locale = await getLocale(message.from);
		const L = useLocale(locale, 'common');

		if (!message.query) {
			return await client.reply(
				message.from,
				t(locale, 'common.moderation.specifyCommand', [message.cmd]),
				message.message
			);
		}

		const isEnable = configuration.groups.settings.get(message.from)?.games === 'enable';

		switch (message.query.toLowerCase()) {
			case 'enable':
			case 'on':
				if (isEnable) {
					return await client.reply(message.from, L.errors.alreadyEnabled, message.message);
				}

				configuration.groups.settings.get(message.from).games = 'enable';

				if (!(await updateGroupSetting(prisma, message.from, 'games', 'enable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'games', 'enable');
				}

				await client.reply(message.from, t(locale, 'common.moderation.enabled', ['games']), message.message);
				break;
			case 'disable':
			case 'off':
				if (!isEnable) {
					return await client.reply(message.from, L.errors.alreadyDisabled, message.message);
				}

				configuration.groups.settings.get(message.from).games = 'disable';

				if (!(await updateGroupSetting(prisma, message.from, 'games', 'disable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'games', 'disable');
				}

				await client.reply(message.from, t(locale, 'common.moderation.disabled', ['games']), message.message);
				break;
			default:
				await client.reply(message.from, t(locale, 'common.moderation.specifyCommand', [message.cmd]), message.message);
		}
	}
});
