import configuration from '../../helper/config/connect.js';
import { pushDefaultSettings, updateGroupSetting } from '../../helper/database/adapters/group-settings.js';
import prisma from '../../helper/database/prisma.js';
import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'welcomemsg',
	minifiedDescription: 'Set Welcome Message',
	aliases: ['setwelcome'],
	description: 'Set the welcome message template. Use {groupName} and {participant} as placeholders.',
	category: 'Moderation',
	usage: '!welcomemsg `<message>`',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run(message, client) {
		const locale = await getLocale(message.from);

		if (!message.query) {
			return await client.reply(
				message.from,
				t(locale, 'common.moderation.templateRequired', ['welcomemsg', 'Welcome {participant} to {groupName}!...']),
				message.message
			);
		}

		if (!(await updateGroupSetting(prisma, message.from, 'welcomeMessage', message.query))) {
			await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
			await updateGroupSetting(prisma, message.from, 'welcomeMessage', message.query);
		}

		configuration.groups.settings.get(message.from).welcomeMessage = message.query;

		await client.reply(message.from, t(locale, 'common.moderation.welcomeMsgUpdated', [message.query]), message.message);
	}
});
