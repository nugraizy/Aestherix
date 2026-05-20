import { generateWAMessageFromContent } from 'baileys';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'pinmessage',
	description: 'Pin message in chat.',
	usage: '!pinmessage',
	aliases: ['pinmsg'],
	category: 'Debugging',
	cooldown: 0,
	limit: 0,
	status: 'disable',
	run: async ({ from, mediaData }, client) => {
		const messageToPin = mediaData.extract();

		const messages = generateWAMessageFromContent(
			from,
			{
				pinInChatMessage: {
					key: messageToPin.key,
					senderTimestampMs: messageToPin.messageTimestamp,
					type: 'PIN_FOR_ALL'
				}
			},
			{ messageId: client.generateMessageID() }
		);

		messages.message.pinInChatMessage.type = 'PIN_FOR_ALL';
		messages.message.pinInChatMessage.senderTimestampMs = Number(messages.message.pinInChatMessage.senderTimestampMs);

		await client.relay(from, messages.message, {
			messageId: messages.key.id
		});
	}
});
