import configuration from '../../helper/config/connect.js';
import { reassign } from '../../helper/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'waitsticker',
	description: 'Wait for users input then proceed.',
	usage: '!waitsticker',
	aliases: ['stickwait'],
	category: 'Debugging',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	run: async (messages, client, store) => {
		const { from, sender, waitForInput, groupMetadata, message } = messages;
		const wait = await waitForInput(client, {
			sender,
			from,
			message: 'Send me media. I will convert it to sticker.',
			expectedType: ['imageMessage', 'videoMessage'],
			timeInSecond: 30
		});

		if (wait.timeout) {
			return client[botNum].reply('Timeout!', { from, quoted: message, groupMetadata });
		}

		if (wait.invalid) {
			return client[botNum].reply('Invalid media!', { from, quoted: message, groupMetadata });
		}

		const messageToConvert = await reassign(wait.message, client, store);

		await configuration.cmds.commands.get('sticker').run(messageToConvert, client);
	}
};
