import { pushDefaultSettings, updateGroupSetting } from '../../helper/database/adapters/group-settings.js';
import prisma from '../../helper/database/prisma.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'antiurl',
	minifiedDescription: 'Anti URL',
	aliases: ['antilink', 'antitautan'],
	description: 'Enable or disable anti-url.',
	category: 'Moderation',
	usage: '!antiurl `<enable/disable>`',
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
				'Please specify a command\n\nEx: antiurl <enable/disable>',
				message.message
			);
		}

		const isEnable = message?.[message?.from]?.antiURL === 'enable';

		switch (message.query.toLowerCase()) {
			case 'enable':
			case 'on':
				if (isEnable) {
					return await client.reply(message.from, 'You already have this command enabled', message.message);
				}

				message[message.from].antiURL = 'enable';
				if (!(await updateGroupSetting(prisma, message.from, 'antiURL', 'enable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'antiURL', 'enable');
				}

				await client.reply(message.from, 'You have successfully enabled anti-url', message.message);
				break;
			case 'disable':
			case 'off':
				if (!isEnable) {
					return await client.reply(message.from, 'You already have this command disabled', message.message);
				}

				message[message.from].antiURL = 'disable';
				if (!(await updateGroupSetting(prisma, message.from, 'antiURL', 'disable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'antiURL', 'disable');
				}

				await client.reply(message.from, 'You have successfully disabled anti-url', message.message);
				break;
			default:
				await client.reply(message.from, 'Please specify a command\n\nEx: antiurl <enable/disable>', message.message);
		}
	}
};
