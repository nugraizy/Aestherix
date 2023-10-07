import fs from 'fs-extra';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
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
		if (!message.isBotAdmin) {
			return await client[botNum].reply('Bot is not admin, Please promote admin before using moderation commands.', {
				groupMetadata: message.groupMetadata,
				from: message.from,
				quoted: message.message
			});
		}

		if (!message.query) {
			return await client[botNum].reply('Please specify a command\n\nEx: antiurl <enable/disable>', {
				groupMetadata: message.groupMetadata,
				from: message.from,
				quoted: message.message
			});
		}

		const data = await fs.readJSON('./databases/groups/settingsManager.json');
		const isEnable = message?.[message?.from]?.antiURL === 'enable';

		switch (message.query.toLowerCase()) {
			case 'enable':
			case 'on':
				if (isEnable) {
					return await client[botNum].reply('You already have this command enabled', {
						groupMetadata: message.groupMetadata,
						from: message.from,
						quoted: message.message
					});
				}

				message[message.from].antiURL = 'enable';
				data[data.findIndex((v) => Object.keys(v)[0] === message.from)][message.from].antiURL = 'enable';
				await fs.writeJSON('./databases/groups/settingsManager.json', data);

				await client[botNum].reply('You have successfully enabled anti-url', {
					groupMetadata: message.groupMetadata,
					from: message.from,
					quoted: message.message
				});
				break;
			case 'disable':
			case 'off':
				if (!isEnable) {
					return await client[botNum].reply('You already have this command disabled', {
						groupMetadata: message.groupMetadata,
						from: message.from,
						quoted: message.message
					});
				}

				message[message.from].antiURL = 'disable';
				data[data.findIndex((v) => Object.keys(v)[0] === message.from)][message.from].antiURL = 'disable';
				await fs.writeJSON('./databases/groups/settingsManager.json', data);

				await client[botNum].reply('You have successfully disabled anti-url', {
					groupMetadata: message.groupMetadata,
					from: message.from,
					quoted: message.message
				});
				break;
			default:
				await client[botNum].reply('Please specify a command\n\nEx: antiurl <enable/disable>', {
					groupMetadata: message.groupMetadata,
					from: message.from,
					quoted: message.message
				});
		}
	}
};
