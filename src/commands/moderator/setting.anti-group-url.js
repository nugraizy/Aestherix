import configuration from '../../helper/config/connect.js';
import { pushDefaultSettings, updateGroupSetting } from '../../helper/database/adapters/group-settings.js';
import prisma from '../../helper/database/prisma.js';
import { getLocale, t } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'antigroupurl',
	minifiedDescription: 'Anti Group URL',
	aliases: ['antigrouplink'],
	description: 'Enable or disable anti group URL (blocks other group invite links).',
	category: 'Moderation',
	usage: '!antigroupurl `<enable/disable>`',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run(message, client) {
		const locale = await getLocale(message.from);

		if (!message.query) {
			return await client.reply(
				message.from,
				t(locale, 'moderation.specifyCommand', ['antigroupurl']),
				message.message
			);
		}

		const isEnable = configuration.groups.settings.get(message.from)?.antiGroupURL === 'enable';

		switch (message.query.toLowerCase()) {
			case 'enable':
			case 'on':
				if (isEnable) {
					return await client.reply(message.from, t(locale, 'moderation.alreadyEnabled', ['Anti group URL']), message.message);
				}

				configuration.groups.settings.get(message.from).antiGroupURL = 'enable';

				if (!(await updateGroupSetting(prisma, message.from, 'antiGroupURL', 'enable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'antiGroupURL', 'enable');
				}

				await client.reply(message.from, t(locale, 'moderation.enabled', ['Anti group URL']), message.message);
				break;
			case 'disable':
			case 'off':
				if (!isEnable) {
					return await client.reply(message.from, t(locale, 'moderation.alreadyDisabled', ['Anti group URL']), message.message);
				}

				configuration.groups.settings.get(message.from).antiGroupURL = 'disable';

				if (!(await updateGroupSetting(prisma, message.from, 'antiGroupURL', 'disable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'antiGroupURL', 'disable');
				}

				await client.reply(message.from, t(locale, 'moderation.disabled', ['Anti group URL']), message.message);
				break;
			default:
				await client.reply(message.from, t(locale, 'moderation.specifyCommand', ['antigroupurl']), message.message);
		}
	}
});
