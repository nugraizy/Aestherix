import fs from 'fs-extra';

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
			return await client.instance.reply(
				message.from,
				'Bot is not admin, Please promote admin before using moderation commands.',
				message.message
			);
		}

		if (!message.query) {
			return await client.instance.reply(
				message.from,
				'Please specify a command\n\nEx: antiurl <enable/disable>',
				message.message
			);
		}

		const data = await fs.readJSON('./databases/groups/settingsManager.json');
		const isEnable = message?.[message?.from]?.antiURL === 'enable';

		switch (message.query.toLowerCase()) {
			case 'enable':
			case 'on':
				if (isEnable) {
					return await client.instance.reply(message.from, 'You already have this command enabled', message.message);
				}

				message[message.from].antiURL = 'enable';
				data[data.findIndex((v) => Object.keys(v)[0] === message.from)][message.from].antiURL = 'enable';
				await fs.writeJSON('./databases/groups/settingsManager.json', data);

				await client.instance.reply(message.from, 'You have successfully enabled anti-url', message.message);
				break;
			case 'disable':
			case 'off':
				if (!isEnable) {
					return await client.instance.reply(message.from, 'You already have this command disabled', message.message);
				}

				message[message.from].antiURL = 'disable';
				data[data.findIndex((v) => Object.keys(v)[0] === message.from)][message.from].antiURL = 'disable';
				await fs.writeJSON('./databases/groups/settingsManager.json', data);

				await client.instance.reply(message.from, 'You have successfully disabled anti-url', message.message);
				break;
			default:
				await client.instance.reply(message.from, 'Please specify a command\n\nEx: antiurl <enable/disable>', message.message);
		}
	}
};
