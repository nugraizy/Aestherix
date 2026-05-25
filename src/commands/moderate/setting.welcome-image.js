import configuration from '../../helper/config/connect.js';
import { pushDefaultSettings, updateGroupSetting } from '../../helper/database/adapters/group-settings.js';
import prisma from '../../helper/database/prisma.js';
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
		if (!message.query) {
			return await client.reply(
				message.from,
				'Please specify a command\n\nEx: welcomeimage <enable/disable>',
				message.message
			);
		}

		const isEnable = configuration.groups.settings.get(message.from)?.welcomeImage === 'enable';

		switch (message.query.toLowerCase()) {
			case 'enable':
			case 'on':
				if (isEnable) {
					return await client.reply(message.from, 'Welcome image card is already enabled.', message.message);
				}

				configuration.groups.settings.get(message.from).welcomeImage = 'enable';

				if (!(await updateGroupSetting(prisma, message.from, 'welcomeImage', 'enable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'welcomeImage', 'enable');
				}

				await client.reply(message.from, 'Welcome image card enabled.', message.message);
				break;
			case 'disable':
			case 'off':
				if (!isEnable) {
					return await client.reply(message.from, 'Welcome image card is already disabled.', message.message);
				}

				configuration.groups.settings.get(message.from).welcomeImage = 'disable';

				if (!(await updateGroupSetting(prisma, message.from, 'welcomeImage', 'disable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'welcomeImage', 'disable');
				}

				await client.reply(message.from, 'Welcome image card disabled.', message.message);
				break;
			default:
				await client.reply(message.from, 'Please specify a command\n\nEx: welcomeimage <enable/disable>', message.message);
		}
	}
});
