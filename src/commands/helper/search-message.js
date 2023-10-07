import { delay } from '@adiwajshing/baileys';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'searchmessage',
	description: 'Search for a message in the current group',
	usage: '!searchmessage',
	aliases: ['findmessage', 'searchmsg', 'findmsg'],
	category: 'Helper',
	cooldown: 10,
	limit: 3,
	status: 'enable',
	async run({ from, query, message, groupMetadata }, client) {
		let capt = 'Void Bot Search\n\n';
		const messages = await client[botNum].searchMessage(from, query);

		if (messages.length === 0) {
			capt += 'No message found.';
		} else {
			capt += `Found ${messages.length} messages.\n\n`;

			await client[botNum].reply(capt.trim(), { from, quoted: message, groupMetadata });

			for (const messageElement of messages) {
				await client[botNum].reply('Found it.', { from, quoted: messageElement, groupMetadata });
				await delay(200);
			}

			return;
		}

		await client[botNum].reply(capt.trim(), { from, quoted: message, groupMetadata });
	}
};
