import { delay } from 'baileys';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'searchmessage',
	minifiedDescription: 'Search Messages',
	description: 'Search for a message in the current group',
	usage: '!searchmessage',
	aliases: ['findmessage', 'searchmsg', 'findmsg'],
	category: 'Helper',
	cooldown: 10,
	limit: 3,
	status: 'enable',
	async run({ from, query, message }, client) {
		let capt = `${__botName} Search\n\n`;
		const messages = await client.searchMessage(from, query);

		if (!messages.length) {
			capt += 'No message found.';
		} else {
			capt += `Found ${messages.length} messages.\n\n`;

			await client.reply(from, capt.trim(), message);

			for (const messageElement of messages) {
				await client.reply(from, 'Found it.', messageElement);
				await delay(200);
			}

			return;
		}

		await client.reply(from, capt.trim(), message);
	}
};
