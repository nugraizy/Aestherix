import fs from 'fs-extra';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
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
			return await client.instance.reply(
				message.from,
				'Bot is not admin, Please promote admin before using moderation commands.',
				message.message
			);
		}

		if (!message.query) {
			return await client.instance.reply(
				message.from,
				'Please specify a command\n\nEx: antinsfw <enable/disable>',
				message.message
			);
		}

		const data = await fs.readJSON('./databases/groups/settingsManager.json');
		const isEnable = message?.[message?.from]?.antiNSFW === 'enable';

		switch (message.query.toLowerCase()) {
			case 'enable':
			case 'on':
				if (isEnable) {
					return await client.instance.reply(message.from, 'You already have this command enabled', message.message);
				}

				message[message.from].antiNSFW = 'enable';
				data[data.findIndex((v) => Object.keys(v)[0] === message.from)][message.from].antiNSFW = 'enable';
				await fs.writeJSON('./databases/groups/settingsManager.json', data);

				await client.instance.reply(message.from, 'You have successfully enabled anti-nsfw', message.message);
				break;
			case 'disable':
			case 'off':
				if (!isEnable) {
					return await client.instance.reply(message.from, 'You already have this command disabled', message.message);
				}

				message[message.from].antiNSFW = 'disable';
				data[data.findIndex((v) => Object.keys(v)[0] === message.from)][message.from].antiNSFW = 'disable';
				await fs.writeJSON('./databases/groups/settingsManager.json', data);

				await client.instance.reply(message.from, 'You have successfully disabled anti-nsfw', message.message);
				break;
			default:
				await client.instance.reply(
					message.from,
					'Please specify a command\n\nEx: antinsfw <enable/disable>',
					message.message
				);
		}
	}
};
