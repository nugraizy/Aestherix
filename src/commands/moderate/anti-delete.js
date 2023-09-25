import fs from 'fs-extra';

/**
 * @type {import('../types.js').Plugins}
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
			return await client[botNum].reply(
				{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
				'Please specify a command\n\nEx: antidelete <enable/disable>'
			);
		}

		const data = await fs.readJSON('./databases/groups/settingsManager.json');

		const isEnable = message?.[message?.from]?.antiDelete === 'enable';

		switch (message.query.toLowerCase()) {
			case 'enable':
			case 'on':
				if (isEnable) {
					return await client[botNum].reply(
						{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
						'You already have this command enabled'
					);
				}

				message[message.from].antiDelete = 'enable';
				data[data.findIndex((v) => Object.keys(v)[0] === message.from)][message.from].antiDelete = 'enable';
				await fs.writeJSON('./databases/groups/settingsManager.json', data);

				await client[botNum].reply(
					{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
					'You have successfully enabled anti-delete'
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

				message[message.from].antiDelete = 'disable';
				data[data.findIndex((v) => Object.keys(v)[0] === message.from)][message.from].antiDelete = 'disable';
				await fs.writeJSON('./databases/groups/settingsManager.json', data);

				await client[botNum].reply(
					{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
					'You have successfully disabled anti-delete'
				);
				break;
			default:
				await client[botNum].reply(
					{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
					'Please specify a command\n\nEx: antidelete <enable/disable>'
				);
		}
	}
};
