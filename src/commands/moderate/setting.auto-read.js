import configuration from '../../helper/config/connect.js';
import { pushDefaultSettings, updateGroupSetting } from '../../helper/database/adapters/group-settings.js';
import prisma from '../../helper/database/prisma.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'autoread',
	minifiedDescription: 'Auto Read',
	aliases: ['autoread'],
	description: 'Enable or disable auto-read messages in this group.',
	category: 'Moderation',
	usage: '!autoread `<enable/disable>`',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run(message, client) {
		if (!message.query) {
			return await client.reply(message.from, 'Please specify a command\n\nEx: autoread <enable/disable>', message.message);
		}

		const isEnable = configuration.groups.settings.get(message.from)?.autoReader === 'enable';

		switch (message.query.toLowerCase()) {
			case 'enable':
			case 'on':
				if (isEnable) {
					return await client.reply(message.from, 'Auto read is already enabled.', message.message);
				}

				configuration.groups.settings.get(message.from).autoReader = 'enable';

				if (!(await updateGroupSetting(prisma, message.from, 'autoReader', 'enable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'autoReader', 'enable');
				}

				await client.reply(message.from, 'Auto read enabled.', message.message);
				break;
			case 'disable':
			case 'off':
				if (!isEnable) {
					return await client.reply(message.from, 'Auto read is already disabled.', message.message);
				}

				configuration.groups.settings.get(message.from).autoReader = 'disable';

				if (!(await updateGroupSetting(prisma, message.from, 'autoReader', 'disable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'autoReader', 'disable');
				}

				await client.reply(message.from, 'Auto read disabled.', message.message);
				break;
			default:
				await client.reply(message.from, 'Please specify a command\n\nEx: autoread <enable/disable>', message.message);
		}
	}
});
