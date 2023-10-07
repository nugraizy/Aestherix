import fs from 'fs-extra';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'antidelete',
	aliases: ['antidelet', 'antihapus'],
	description: 'Enable or disable anti-delete',
	category: 'Moderation',
	usage: '!antidelete <enable/disable>',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run(message, client) {
		if (!message.query) {
			return await client[botNum].reply('Please specify a command\n\nEx: antidelete <enable/disable>', {
				groupMetadata: message.groupMetadata,
				from: message.from,
				quoted: message.message
			});
		}

		const data = await fs.readJSON('./databases/groups/settingsManager.json');

		const isEnable = message?.[message?.from]?.antiDelete === 'enable';

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

				message[message.from].antiDelete = 'enable';
				data[data.findIndex((v) => Object.keys(v)[0] === message.from)][message.from].antiDelete = 'enable';
				await fs.writeJSON('./databases/groups/settingsManager.json', data);

				await client[botNum].reply('You have successfully enabled anti-delete', {
					from: message.from,
					quoted: message.message,
					groupMetadata: message.groupMetadata
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

				message[message.from].antiDelete = 'disable';
				data[data.findIndex((v) => Object.keys(v)[0] === message.from)][message.from].antiDelete = 'disable';
				await fs.writeJSON('./databases/groups/settingsManager.json', data);

				await client[botNum].reply('You have successfully disabled anti-delete', {
					groupMetadata: message.groupMetadata,
					from: message.from,
					quoted: message.message
				});
				break;
			default:
				await client[botNum].reply('Please specify a command\n\nEx: antidelete <enable/disable>', {
					groupMetadata: message.groupMetadata,
					from: message.from,
					quoted: message.message
				});
		}
	}
};
