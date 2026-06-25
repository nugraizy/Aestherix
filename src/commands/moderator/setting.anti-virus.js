import configuration from '../../helper/config/connect.js';
import { pushDefaultSettings, updateGroupSetting } from '../../helper/database/adapters/group-settings.js';
import prisma from '../../helper/database/prisma.js';
import { getLocale, t } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'antivirus',
	minifiedDescription: 'Anti Virus',
	aliases: [],
	description: 'Enable or disable anti-virus file scanning.',
	category: 'Moderation',
	usage: '!antivirus `<enable/disable>`',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run(message, client) {
		const locale = await getLocale(message.from);

		if (!message.query) {
			return await client.reply(message.from, t(locale, 'common.moderation.specifyCommand', ['antivirus']), message.message);
		}

		const isEnable = configuration.groups.settings.get(message.from)?.antiVirus === 'enable';

		switch (message.query.toLowerCase()) {
			case 'enable':
			case 'on':
				if (isEnable) {
					return await client.reply(message.from, t(locale, 'common.moderation.alreadyEnabled', ['Anti virus']), message.message);
				}

				configuration.groups.settings.get(message.from).antiVirus = 'enable';

				if (!(await updateGroupSetting(prisma, message.from, 'antiVirus', 'enable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'antiVirus', 'enable');
				}

				await client.reply(message.from, t(locale, 'common.moderation.enabled', ['Anti virus']), message.message);
				break;
			case 'disable':
			case 'off':
				if (!isEnable) {
					return await client.reply(message.from, t(locale, 'common.moderation.alreadyDisabled', ['Anti virus']), message.message);
				}

				configuration.groups.settings.get(message.from).antiVirus = 'disable';

				if (!(await updateGroupSetting(prisma, message.from, 'antiVirus', 'disable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'antiVirus', 'disable');
				}

				await client.reply(message.from, t(locale, 'common.moderation.disabled', ['Anti virus']), message.message);
				break;
			default:
				await client.reply(message.from, t(locale, 'common.moderation.specifyCommand', ['antivirus']), message.message);
		}
	}
});
