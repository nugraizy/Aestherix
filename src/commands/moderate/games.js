import { pushDefaultSettings, updateGroupSetting } from '../../helper/database/adapters/group-settings.js';
import prisma from '../../helper/database/prisma.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'games',
	minifiedDescription: 'Enable/Disable Games Mode',
	aliases: ['game'],
	description: 'Play games with your friends',
	category: 'Moderation',
	usage: '!games `<enable/disable>`',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run(message, client) {
		if (!message.query) {
			return await client.instance.reply(
				message.from,
				`Please specify a command\n\nEx: ${message.cmd} <enable/disable>`,
				message.message
			);
		}

		const isEnable = message?.[message?.from]?.games === 'enable';

		switch (message.query.toLowerCase()) {
			case 'enable':
			case 'on':
				if (isEnable) {
					return await client.instance.reply(message.from, 'You already have this command enabled', message.message);
				}

				message[message.from].games = 'enable';
				if (!(await updateGroupSetting(prisma, message.from, 'games', 'enable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'games', 'enable');
				}

				await client.instance.reply(message.from, 'You have successfully enabled games', message.message);
				break;
			case 'disable':
			case 'off':
				if (!isEnable) {
					return await client.instance.reply(message.from, 'You already have this command disabled', message.message);
				}

				message[message.from].games = 'disable';
				if (!(await updateGroupSetting(prisma, message.from, 'games', 'disable'))) {
					await pushDefaultSettings(prisma, message.from, message.groupName, message.groupDescription);
					await updateGroupSetting(prisma, message.from, 'games', 'disable');
				}

				await client.instance.reply(message.from, 'You have successfully disabled games', message.message);
				break;
			default:
				await client.instance.reply(
					message.from,
					`Please specify a command\n\nEx: ${message.cmd} <enable/disable>`,
					message.message
				);
		}
	}
};
