import configuration from '../../helper/config/connect.js';
import { pushDefaultSettings, updateGroupSetting } from '../../helper/database/adapters/group-settings.js';
import prisma from '../../helper/database/prisma.js';
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
		if (!message.query) {
			return await client.reply(message.from, 'Please specify a command\n\nEx: antigroupurl <enable/disable>', message.message);
		}

		const isEnable = configuration.groups.settings.get(message.from)?.antiGroupURL === 'enable';

		switch (message.query.toLowerCase()) {
			case 'enable':
			case 'on':
				if (isEnable) {
					return await client.reply(message.from, 'Anti group URL is already enabled.', message.message);
				}

				configuration.groups.settings.get(message.from).antiGroupURL = 'enable';

				if (!(await updateGroupSetting(prisma, message.from, 'antiGroupURL', 'enable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'antiGroupURL', 'enable');
				}

				await client.reply(message.from, 'Anti group URL enabled.', message.message);
				break;
			case 'disable':
			case 'off':
				if (!isEnable) {
					return await client.reply(message.from, 'Anti group URL is already disabled.', message.message);
				}

				configuration.groups.settings.get(message.from).antiGroupURL = 'disable';

				if (!(await updateGroupSetting(prisma, message.from, 'antiGroupURL', 'disable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'antiGroupURL', 'disable');
				}

				await client.reply(message.from, 'Anti group URL disabled.', message.message);
				break;
			default:
				await client.reply(message.from, 'Please specify a command\n\nEx: antigroupurl <enable/disable>', message.message);
		}
	}
});
