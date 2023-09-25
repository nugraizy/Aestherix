import fs from 'fs-extra';

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'antinsfw',
	aliases: ['antiporn', 'noporn', 'nonsfw'],
	description: 'Enable or disable anti-porn',
	category: 'Moderation',
	usage: '!antinsfw <enable/disable>',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run(message, client) {
		if (!message.isBotAdmin) {
			return await client[botNum].reply(
				{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
				'Bot is not admin, Please promote admin before using moderation commands.'
			);
		}

		if (!message.query) {
			return await client[botNum].reply(
				{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
				'Please specify a command\n\nEx: antinsfw <enable/disable>'
			);
		}

		const data = await fs.readJSON('./databases/groups/settingsManager.json');
		const isEnable = message?.[message?.from]?.antiNSFW === 'enable';

		switch (message.query.toLowerCase()) {
			case 'enable':
			case 'on':
				if (isEnable) {
					return await client[botNum].reply(
						{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
						'You already have this command enabled'
					);
				}

				message[message.from].antiNSFW = 'enable';
				data[data.findIndex((v) => Object.keys(v)[0] === message.from)][message.from].antiNSFW = 'enable';
				await fs.writeJSON('./databases/groups/settingsManager.json', data);

				await client[botNum].reply(
					{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
					'You have successfully enabled anti-nsfw'
				);
				break;
			case 'disable':
			case 'off':
				if (!isEnable) {
					return await client[botNum].reply(
						{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
						'You already have this command disabled'
					);
				}

				message[message.from].antiNSFW = 'disable';
				data[data.findIndex((v) => Object.keys(v)[0] === message.from)][message.from].antiNSFW = 'disable';
				await fs.writeJSON('./databases/groups/settingsManager.json', data);

				await client[botNum].reply(
					{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
					'You have successfully disabled anti-nsfw'
				);
				break;
			default:
				await client[botNum].reply(
					{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
					'Please specify a command\n\nEx: antinsfw <enable/disable>'
				);
		}
	}
};
