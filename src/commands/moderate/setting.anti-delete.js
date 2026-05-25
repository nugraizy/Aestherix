import configuration from '../../helper/config/connect.js';
import { pushDefaultSettings, updateGroupSetting } from '../../helper/database/adapters/group-settings.js';
import prisma from '../../helper/database/prisma.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'antidelete',
	minifiedDescription: 'Anti Delete',
	aliases: ['antidelet', 'antihapus'],
	description: 'Enable or disable anti-delete.',
	category: 'Moderation',
	usage: '!antidelete `<enable/disable>`',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run(message, client) {
		if (!message.query) {
			return await client.reply(message.from, 'Please specify a command\n\nEx: antidelete <enable/disable>', message.message);
		}

		const isEnable = configuration.groups.settings.get(message.from)?.antiDelete === 'enable';

		switch (message.query.toLowerCase()) {
			case 'enable':
			case 'on':
				if (isEnable) {
					return await client.reply(message.from, 'You already have this command enabled', message.message);
				}

				configuration.groups.settings.get(message.from).antiDelete = 'enable';

				if (!(await updateGroupSetting(prisma, message.from, 'antiDelete', 'enable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'antiDelete', 'enable');
				}

				await client.reply(message.from, 'You have successfully enabled anti-delete', message.message);
				break;
			case 'disable':
			case 'off':
				if (!isEnable) {
					return await client.reply(message.from, 'You already have this command disabled', message.message);
				}

				configuration.groups.settings.get(message.from).antiDelete = 'disable';

				if (!(await updateGroupSetting(prisma, message.from, 'antiDelete', 'disable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'antiDelete', 'disable');
				}

				await client.reply(message.from, 'You have successfully disabled anti-delete', message.message);
				break;
			default:
				await client.reply(message.from, 'Please specify a command\n\nEx: antidelete <enable/disable>', message.message);
		}
	}
});
