import configuration from '../../helper/config/connect.js';
import { pushDefaultSettings, updateGroupSetting } from '../../helper/database/adapters/group-settings.js';
import prisma from '../../helper/database/prisma.js';
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
		if (!message.isBotAdmin) {
			return await client.reply(
				message.from,
				'Bot is not admin, Please promote admin before using moderation commands.',
				message.message
			);
		}

		if (!message.query) {
			return await client.reply(message.from, 'Please specify a command\n\nEx: antinsfw <enable/disable>', message.message);
		}

		const isEnable = configuration.groups.settings.get(message.from)?.antiNSFW === 'enable';

		switch (message.query.toLowerCase()) {
			case 'enable':
			case 'on':
				if (isEnable) {
					return await client.reply(message.from, 'You already have this command enabled', message.message);
				}

				configuration.groups.settings.get(message.from).antiNSFW = 'enable';

				if (!(await updateGroupSetting(prisma, message.from, 'antiNSFW', 'enable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'antiNSFW', 'enable');
				}

				await client.reply(message.from, 'You have successfully enabled anti-nsfw', message.message);
				break;
			case 'disable':
			case 'off':
				if (!isEnable) {
					return await client.reply(message.from, 'You already have this command disabled', message.message);
				}

				configuration.groups.settings.get(message.from).antiNSFW = 'disable';

				if (!(await updateGroupSetting(prisma, message.from, 'antiNSFW', 'disable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'antiNSFW', 'disable');
				}

				await client.reply(message.from, 'You have successfully disabled anti-nsfw', message.message);
				break;
			default:
				await client.reply(message.from, 'Please specify a command\n\nEx: antinsfw <enable/disable>', message.message);
		}
	}
});
