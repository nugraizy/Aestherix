import configuration from '../../helper/config/connect.js';
import { pushDefaultSettings, updateGroupSetting } from '../../helper/database/adapters/group-settings.js';
import prisma from '../../helper/database/prisma.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'notification',
	minifiedDescription: 'Enable/Disable Group Notification',
	aliases: ['eventupd', 'eventupdate', 'notify'],
	description: 'Enable or disable group event notification',
	category: 'Moderation',
	usage: '!notification `<enable/disable>`',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run(message, client) {
		if (!message.isBotAdmin) {
			return await client.reply(
				message.from,
				'Bot is not admin, Please promote admin before using moderation commands.',
				message.message
			);
		}

		if (!message.query) {
			return await client.reply(
				message.from,
				'Please specify a command\n\nEx: notification <enable/disable>',
				message.message
			);
		}

		const isEnable = configuration.groups.settings.get(message.from)?.notification === 'enable';

		switch (message.query.toLowerCase()) {
			case 'enable':
			case 'on':
				if (isEnable) {
					return await client.reply(message.from, 'You already have this command enabled', message.message);
				}

				configuration.groups.settings.get(message.from).notification = 'enable';

				if (!(await updateGroupSetting(prisma, message.from, 'notification', 'enable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'notification', 'enable');
				}

				await client.reply(message.from, 'You have successfully enabled group notification', message.message);
				break;
			case 'disable':
			case 'off':
				if (!isEnable) {
					return await client.reply(message.from, 'You already have this command disabled', message.message);
				}

				configuration.groups.settings.get(message.from).notification = 'disable';

				if (!(await updateGroupSetting(prisma, message.from, 'notification', 'disable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'notification', 'disable');
				}

				await client.reply(message.from, 'You have successfully disabled group notification', message.message);
				break;
			default:
				await client.reply(message.from, 'Please specify a command\n\nEx: notification <enable/disable>', message.message);
		}
	}
});
