/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'waitmessages',
	minifiedDescription: 'Wait Messages',
	description: 'Wait for users input then proceed.',
	usage: '!waitmessage',
	aliases: ['waitmsgs'],
	category: 'Debugging',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	run: async ({ from, sender, pushname, waitForInput, message }, client) => {
		let wait = await waitForInput(client, {
			sender,
			from,
			message: 'What is your name?',
			expectedType: ['conversation', 'extendedTextMessage'],
			timeInSecond: 15
		});

		if (wait.timeout) {
			client.instance.reply(from, 'Timeout! I will just call you ' + pushname, message);
		} else {
			client.instance.reply(from, `Hi ${wait.message}. I'm ${__botName} Bot. Nice to know you!`, {
				from,
				quoted: wait.quoted
			});
		}

		wait = await waitForInput(client, {
			sender,
			from,
			message: 'Do you like our services?',
			expectedType: ['conversation', 'extendedTextMessage'],
			timeInSecond: 15
		});

		if (wait.timeout) {
			client.instance.reply(from, 'Timeout! I consider the answer is yes :]', message);
		} else {
			if (['y', 'yes'].includes(wait.message.toLowerCase())) {
				client.instance.reply(from, 'Thank you for your support!', { from, quoted: wait.quoted });
			} else {
				client.instance.reply(from, 'Sorry to hear that :[', { from, quoted: wait.quoted });
			}
		}

		wait = await waitForInput(client, {
			sender,
			from,
			message: 'Which services do you like the most and you do not like the most?',
			expectedType: ['conversation', 'extendedTextMessage'],
			timeInSecond: 15
		});

		if (wait.timeout) {
			return client.instance.reply(from, 'Timeout! I wish i did not speak to a wall. Have a good day.', message);
		} else {
			client.instance.reply(from, 'Thank you for your feedback!', { from, quoted: wait.quoted });
		}

		client.instance.reply(from, 'Have a good day!', message);
	}
};
