/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'waitmessages',
	description: 'Wait for users input then proceed.',
	usage: '!waitmessage',
	aliases: ['waitmsgs'],
	category: 'Debugging',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	run: async ({ from, sender, pushname, waitForInput, groupMetadata, message }, client) => {
		let wait = await waitForInput(client, {
			sender,
			from,
			message: 'What is your name?',
			expectedType: ['conversation', 'extendedTextMessage'],
			timeInSecond: 15
		});

		if (wait.timeout) {
			client[botNum].reply('Timeout! I will just call you ' + pushname, { from, quoted: message, groupMetadata });
		} else {
			client[botNum].reply(`Hi ${wait.message}. I'm Void Bot. Nice to know you!`, {
				from,
				quoted: wait.quoted,
				groupMetadata
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
			client[botNum].reply('Timeout! I consider the answer is yes :]', { from, quoted: message, groupMetadata });
		} else {
			if (['y', 'yes'].includes(wait.message.toLowerCase())) {
				client[botNum].reply('Thank you for your support!', { from, quoted: wait.quoted, groupMetadata });
			} else {
				client[botNum].reply('Sorry to hear that :[', { from, quoted: wait.quoted, groupMetadata });
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
			return client[botNum].reply('Timeout! I wish i did not speak to a wall. Have a good day.', {
				from,
				quoted: message,
				groupMetadata
			});
		} else {
			client[botNum].reply('Thank you for your feedback!', { from, quoted: wait.quoted, groupMetadata });
		}

		client[botNum].reply('Have a good day!', { from, quoted: message, groupMetadata });
	}
};
