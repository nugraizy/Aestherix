/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'waitmessage',
	description: 'Wait for users input then proceed.',
	usage: '!waitmessage',
	aliases: ['waitmsg'],
	category: 'Debugging',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	run: async ({ from, sender, pushname, waitForInput, groupMetadata, message }, client) => {
		const wait = await waitForInput(client, {
			sender,
			from,
			message: 'What is your name?',
			expectedType: ['conversation', 'extendedTextMessage'],
			timeInSecond: 15
		});

		if (wait.timeout) {
			return client[botNum].reply('Timeout! I will just call you ' + pushname, { from, quoted: message, groupMetadata });
		}

		client[botNum].reply('hi there ' + wait.message, { from, quoted: wait.quoted, groupMetadata });
	}
};
