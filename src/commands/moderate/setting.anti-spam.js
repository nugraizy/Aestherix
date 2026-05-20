import configuration from '../../helper/config/connect.js';
import { pushDefaultSettings, updateGroupSetting } from '../../helper/database/adapters/group-settings.js';
import prisma from '../../helper/database/prisma.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'antispam',
	minifiedDescription: 'Anti Spam',
	aliases: [],
	description: 'Enable or disable anti-spam protection.',
	category: 'Moderation',
	usage: '!antispam `<enable/disable>`',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run(message, client) {
		if (!message.query) {
			return await client.reply(message.from, 'Please specify a command\n\nEx: antispam <enable/disable>', message.message);
		}

		const isEnable = configuration.groups.settings.get(message.from)?.antiSpam === 'enable';

		switch (message.query.toLowerCase()) {
			case 'enable':
			case 'on':
				if (isEnable) {
					return await client.reply(message.from, 'Anti spam is already enabled.', message.message);
				}

				configuration.groups.settings.get(message.from).antiSpam = 'enable';

				if (!(await updateGroupSetting(prisma, message.from, 'antiSpam', 'enable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'antiSpam', 'enable');
				}

				await client.reply(message.from, 'Anti spam enabled.', message.message);
				break;
			case 'disable':
			case 'off':
				if (!isEnable) {
					return await client.reply(message.from, 'Anti spam is already disabled.', message.message);
				}

				configuration.groups.settings.get(message.from).antiSpam = 'disable';

				if (!(await updateGroupSetting(prisma, message.from, 'antiSpam', 'disable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'antiSpam', 'disable');
				}

				await client.reply(message.from, 'Anti spam disabled.', message.message);
				break;
			default:
				await client.reply(message.from, 'Please specify a command\n\nEx: antispam <enable/disable>', message.message);
		}
	}
});
