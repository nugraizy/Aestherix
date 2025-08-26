import fs from 'fs-extra';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'notification',
	minifiedDescription: 'Enable/Disable Group Notification',
	aliases: ['eventupd', 'eventupdate', 'notify'],
	description: 'Enable or disable group event notification',
	category: 'Moderation',
	usage: '!notification `<enable/disable>`',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run(message, client) {
		if (!message.isBotAdmin) {
			return await client.instance.reply('Bot is not admin, Please promote admin before using moderation commands.', {
				from: message.from,
				quoted: message.message
			});
		}

		if (!message.query) {
			return await client.instance.reply('Please specify a command\n\nEx: notification <enable/disable>', {
				from: message.from,
				quoted: message.message
			});
		}

		const data = await fs.readJSON('./databases/groups/settingsManager.json');
		const isEnable = message?.[message?.from]?.notification === 'enable';

		switch (message.query.toLowerCase()) {
			case 'enable':
			case 'on':
				if (isEnable) {
					return await client.instance.reply('You already have this command enabled', {
						from: message.from,
						quoted: message.message
					});
				}

				message[message.from].notification = 'enable';
				data[data.findIndex((v) => Object.keys(v)[0] === message.from)][message.from].notification = 'enable';
				await fs.writeJSON('./databases/groups/settingsManager.json', data);

				await client.instance.reply('You have successfully enabled group notification', {
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

				message[message.from].notification = 'disable';
				data[data.findIndex((v) => Object.keys(v)[0] === message.from)][message.from].notification = 'disable';
				await fs.writeJSON('./databases/groups/settingsManager.json', data);

				await client.instance.reply('You have successfully disabled group notification', {
					from: message.from,
					quoted: message.message
				});
				break;
			default:
				await client.instance.reply('Please specify a command\n\nEx: notification <enable/disable>', {
					from: message.from,
					quoted: message.message
				});
		}
	}
};
