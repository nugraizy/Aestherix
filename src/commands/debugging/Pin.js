import { generateWAMessageFromContent } from 'baileys';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
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
			{ messageId: client.instance.generateMessageID() }
		);

		messages.message.pinInChatMessage.type = 'PIN_FOR_ALL';
		messages.message.pinInChatMessage.senderTimestampMs = Number(messages.message.pinInChatMessage.senderTimestampMs);

		await client.instance.relayMessage(from, messages.message, {
			messageId: messages.key.id,
			useCachedGroupMetadata: true
		});
	}
};
