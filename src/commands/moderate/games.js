import fs from 'fs-extra';

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
			return await client.instance.reply(`Please specify a command\n\nEx: ${message.cmd} <enable/disable>`, {
				from: message.from,
				quoted: message.message
			});
		}

		const data = await fs.readJSON('./databases/groups/settingsManager.json');
		const isEnable = message?.[message?.from]?.games === 'enable';

		switch (message.query.toLowerCase()) {
			case 'enable':
			case 'on':
				if (isEnable) {
					return await client.instance.reply('You already have this command enabled', {
						from: message.from,
						quoted: message.message
					});
				}

				message[message.from].games = 'enable';
				data[data.findIndex((v) => Object.keys(v)[0] === message.from)][message.from].games = 'enable';
				await fs.writeJSON('./databases/groups/settingsManager.json', data);

				await client.instance.reply('You have successfully enabled games', {
					from: message.from,
					quoted: message.message
				});
				break;
			case 'disable':
			case 'off':
				if (!isEnable) {
					return await client.instance.reply('You already have this command disabled', {
						from: message.from,
						quoted: message.message
					});
				}

				message[message.from].games = 'disable';
				data[data.findIndex((v) => Object.keys(v)[0] === message.from)][message.from].games = 'disable';
				await fs.writeJSON('./databases/groups/settingsManager.json', data);

				await client.instance.reply('You have successfully disabled games', {
					from: message.from,
					quoted: message.message
				});
				break;
			default:
				await client.instance.reply(`Please specify a command\n\nEx: ${message.cmd} <enable/disable>`, {
					from: message.from,
					quoted: message.message
				});
		}
	}
};
