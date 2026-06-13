import configuration from '../../helper/config/connect.js';
import { pushDefaultSettings, updateGroupSetting } from '../../helper/database/adapters/group-settings.js';
import prisma from '../../helper/database/prisma.js';
import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'welcomeimage',
	minifiedDescription: 'Welcome Image Card',
	aliases: ['welcomeimg', 'greetimage'],
	description: 'Enable or disable the image card for welcome/leave notifications.',
	category: 'Moderation',
	usage: '!welcomeimage `<enable/disable>`',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run(message, client) {
		const locale = await getLocale(message.from);
		const L = useLocale(locale, 'common');

		if (!message.query) {
			return await client.reply(
				message.from,
				t(locale, 'moderation.specifyCommand', ['welcomeimage']),
				message.message
			);
		}

		const isEnable = configuration.groups.settings.get(message.from)?.welcomeImage === 'enable';

		switch (message.query.toLowerCase()) {
			case 'enable':
			case 'on':
				if (isEnable) {
					return await client.reply(message.from, t(locale, 'moderation.alreadyEnabled', ['Welcome image card']), message.message);
				}

				configuration.groups.settings.get(message.from).welcomeImage = 'enable';

				if (!(await updateGroupSetting(prisma, message.from, 'welcomeImage', 'enable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'welcomeImage', 'enable');
				}

				await client.reply(message.from, t(locale, 'moderation.enabled', ['Welcome image card']), message.message);
				break;
			case 'disable':
			case 'off':
				if (!isEnable) {
					return await client.reply(message.from, t(locale, 'moderation.alreadyDisabled', ['Welcome image card']), message.message);
				}

				configuration.groups.settings.get(message.from).welcomeImage = 'disable';

				if (!(await updateGroupSetting(prisma, message.from, 'welcomeImage', 'disable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'welcomeImage', 'disable');
				}

				await client.reply(message.from, t(locale, 'moderation.disabled', ['Welcome image card']), message.message);
				break;
			default:
				await client.reply(message.from, t(locale, 'moderation.specifyCommand', ['welcomeimage']), message.message);
		}
	}
});
