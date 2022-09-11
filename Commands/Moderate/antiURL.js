/* global botNum */
import { readJSON, writeJSON } from '../../Helper/Modules/index.js';

export default {
	name: 'antiurl',
	aliases: ['antilink', 'antitautan'],
	description: 'Enable or disable anti-url',
	category: 'Moderation',
	usage: '!antiurl <enable/disable>',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run(message, client) {
		if (!message.isAdmin && !message.isOwner) {
			return await client[botNum].reply({ from: message.from, quoted: message.message }, 'You are not admin. This commands is only for admins.');
		}

		if (!message.isBotAdmin) {
			return await client[botNum].reply({ from: message.from, quoted: message.message }, 'Bot is not admin, Please promote admin before using moderation commands.');
		}

		if (!message.query) {
			return await client[botNum].reply({ from: message.from, quoted: message.message }, 'Please specify a command\n\nEx: antiurl <enable/disable>');
		}

		const data = readJSON('./Databases/Groups/settingsManager.json');
		const isEnable = message?.[message?.from]?.antiURL == 'enable';

		switch (message.query.toLowerCase()) {
			case 'enable':
			case 'on':
				if (isEnable) {
					return await client[botNum].reply({ from: message.from, quoted: message.message }, 'You already have this command enabled');
				}

				message[message.from].antiURL = 'enable';
				data[data.findIndex((v) => Object.keys(v)[0] == message.from)][message.from].antiURL = 'enable';
				writeJSON('./Databases/Groups/settingsManager.json', data);

				await client[botNum].reply({ from: message.from, quoted: message.message }, 'You have successfully enabled anti-url');
				break;
			case 'disable':
			case 'off':
				if (!isEnable) {
					return await client[botNum].reply({ from: message.from, quoted: message.message }, 'You already have this command disabled');
				}

				message[message.from].antiURL = 'disable';
				data[data.findIndex((v) => Object.keys(v)[0] == message.from)][message.from].antiURL = 'disable';
				writeJSON('./Databases/Groups/settingsManager.json', data);

				await client[botNum].reply({ from: message.from, quoted: message.message }, 'You have successfully disabled anti-url');
				break;
			default:
				await client[botNum].reply({ from: message.from, quoted: message.message }, 'Please specify a command\n\nEx: antiurl <enable/disable>');
		}
	},
};
