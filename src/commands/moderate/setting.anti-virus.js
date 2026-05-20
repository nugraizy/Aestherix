import configuration from '../../helper/config/connect.js';
import { pushDefaultSettings, updateGroupSetting } from '../../helper/database/adapters/group-settings.js';
import prisma from '../../helper/database/prisma.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'antivirus',
	minifiedDescription: 'Anti Virus',
	aliases: [],
	description: 'Enable or disable anti-virus file scanning.',
	category: 'Moderation',
	usage: '!antivirus `<enable/disable>`',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run(message, client) {
		if (!message.query) {
			return await client.reply(message.from, 'Please specify a command\n\nEx: antivirus <enable/disable>', message.message);
		}

		const isEnable = configuration.groups.settings.get(message.from)?.antiVirus === 'enable';

		switch (message.query.toLowerCase()) {
			case 'enable':
			case 'on':
				if (isEnable) {
					return await client.reply(message.from, 'Anti virus is already enabled.', message.message);
				}

				configuration.groups.settings.get(message.from).antiVirus = 'enable';

				if (!(await updateGroupSetting(prisma, message.from, 'antiVirus', 'enable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'antiVirus', 'enable');
				}

				await client.reply(message.from, 'Anti virus enabled.', message.message);
				break;
			case 'disable':
			case 'off':
				if (!isEnable) {
					return await client.reply(message.from, 'Anti virus is already disabled.', message.message);
				}

				configuration.groups.settings.get(message.from).antiVirus = 'disable';

				if (!(await updateGroupSetting(prisma, message.from, 'antiVirus', 'disable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'antiVirus', 'disable');
				}

				await client.reply(message.from, 'Anti virus disabled.', message.message);
				break;
			default:
				await client.reply(message.from, 'Please specify a command\n\nEx: antivirus <enable/disable>', message.message);
		}
	}
});
