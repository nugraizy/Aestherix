import configuration from '../../helper/config/connect.js';
import { Context } from '../../core/context.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'waitsticker',
	minifiedDescription: 'Wait Sticker',
	description: 'Wait for users input then proceed.',
	usage: '!waitsticker',
	aliases: ['stickwait'],
	category: 'Debugging',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	run: async (messages, client, store) => {
		const { from, sender, waitForInput, message } = messages;
		const wait = await waitForInput(client, {
			sender,
			from,
			message: 'Send me media. I will convert it to sticker.',
			expectedType: ['imageMessage', 'videoMessage'],
			timeInSecond: 30
		});

		if (wait.timeout) {
			return client.reply(from, 'Timeout!', message);
		}

		if (wait.invalid) {
			return client.reply(from, 'Invalid media!', message);
		}

		const messageToConvert = await Context.from(wait.message, client, store);

		await configuration.registry.commands.get('sticker').run(messageToConvert, client);
	}
});
