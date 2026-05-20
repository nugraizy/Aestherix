import configuration from '../../helper/config/connect.js';
import { pushDefaultSettings, updateGroupSetting } from '../../helper/database/adapters/group-settings.js';
import prisma from '../../helper/database/prisma.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'welcome',
	minifiedDescription: 'Welcome Message',
	aliases: ['selamatdatang'],
	description: 'Enable or disable welcome message for new members.',
	category: 'Moderation',
	usage: '!welcome `<enable/disable>`',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run(message, client) {
		if (!message.query) {
			return await client.reply(message.from, 'Please specify a command\n\nEx: welcome <enable/disable>', message.message);
		}

		const isEnable = configuration.groups.settings.get(message.from)?.welcome === 'enable';

		switch (message.query.toLowerCase()) {
			case 'enable':
			case 'on':
				if (isEnable) {
					return await client.reply(message.from, 'Welcome message is already enabled.', message.message);
				}

				configuration.groups.settings.get(message.from).welcome = 'enable';

				if (!(await updateGroupSetting(prisma, message.from, 'welcome', 'enable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'welcome', 'enable');
				}

				await client.reply(message.from, 'Welcome message enabled.', message.message);
				break;
			case 'disable':
			case 'off':
				if (!isEnable) {
					return await client.reply(message.from, 'Welcome message is already disabled.', message.message);
				}

				configuration.groups.settings.get(message.from).welcome = 'disable';

				if (!(await updateGroupSetting(prisma, message.from, 'welcome', 'disable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'welcome', 'disable');
				}

				await client.reply(message.from, 'Welcome message disabled.', message.message);
				break;
			default:
				await client.reply(message.from, 'Please specify a command\n\nEx: welcome <enable/disable>', message.message);
		}
	}
});
