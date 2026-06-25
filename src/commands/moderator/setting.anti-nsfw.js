import configuration from '../../helper/config/connect.js';
import { pushDefaultSettings, updateGroupSetting } from '../../helper/database/adapters/group-settings.js';
import prisma from '../../helper/database/prisma.js';
import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'antinsfw',
	minifiedDescription: 'Anti NSFW',
	aliases: ['antiporn', 'noporn', 'nonsfw'],
	description: 'Enable or disable anti-porn.',
	category: 'Moderation',
	usage: '!antinsfw `<enable/disable>`',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run(message, client) {
		const locale = await getLocale(message.from);
		const L = useLocale(locale, 'common');

		if (!message.isBotAdmin) {
			return await client.reply(
				message.from,
				L.errors.botNotAdmin,
				message.message
			);
		}

		if (!message.query) {
			return await client.reply(message.from, t(locale, 'common.moderation.specifyCommand', ['antinsfw']), message.message);
		}

		const isEnable = configuration.groups.settings.get(message.from)?.antiNSFW === 'enable';

		switch (message.query.toLowerCase()) {
			case 'enable':
			case 'on':
				if (isEnable) {
					return await client.reply(message.from, L.errors.alreadyEnabled, message.message);
				}

				configuration.groups.settings.get(message.from).antiNSFW = 'enable';

				if (!(await updateGroupSetting(prisma, message.from, 'antiNSFW', 'enable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'antiNSFW', 'enable');
				}

				await client.reply(message.from, t(locale, 'common.moderation.enabled', ['anti-nsfw']), message.message);
				break;
			case 'disable':
			case 'off':
				if (!isEnable) {
					return await client.reply(message.from, L.errors.alreadyDisabled, message.message);
				}

				configuration.groups.settings.get(message.from).antiNSFW = 'disable';

				if (!(await updateGroupSetting(prisma, message.from, 'antiNSFW', 'disable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'antiNSFW', 'disable');
				}

				await client.reply(message.from, t(locale, 'common.moderation.disabled', ['anti-nsfw']), message.message);
				break;
			default:
				await client.reply(message.from, t(locale, 'common.moderation.specifyCommand', ['antinsfw']), message.message);
		}
	}
});
