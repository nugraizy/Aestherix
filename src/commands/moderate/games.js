import fs from 'fs-extra';

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'games',
	aliases: ['game'],
	description: 'Play games with your friends',
	category: 'Moderation',
	usage: '!games <enable/disable>',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run(message, client) {
		if (!message.query) {
			return await client[botNum].reply(
				{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
				`Please specify a command\n\nEx: ${message.cmd} <enable/disable>`
			);
		}

		const data = await fs.readJSON('./databases/groups/settingsManager.json');
		const isEnable = message?.[message?.from]?.games === 'enable';

		switch (message.query.toLowerCase()) {
			case 'enable':
			case 'on':
				if (isEnable) {
					return await client[botNum].reply(
						{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
						'You already have this command enabled'
					);
				}

				message[message.from].games = 'enable';
				data[data.findIndex((v) => Object.keys(v)[0] === message.from)][message.from].games = 'enable';
				await fs.writeJSON('./databases/groups/settingsManager.json', data);

				await client[botNum].reply(
					{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
					'You have successfully enabled games'
				);
				break;
			case 'disable':
			case 'off':
				if (!isEnable) {
					return await client[botNum].reply(
						{ from: message.from, quoted: message.message },
						'You already have this command disabled'
					);
				}

				message[message.from].games = 'disable';
				data[data.findIndex((v) => Object.keys(v)[0] === message.from)][message.from].games = 'disable';
				await fs.writeJSON('./databases/groups/settingsManager.json', data);

				await client[botNum].reply(
					{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
					'You have successfully disabled games'
				);
				break;
			default:
				await client[botNum].reply(
					{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
					`Please specify a command\n\nEx: ${message.cmd} <enable/disable>`
				);
		}
	}
};
