import { generateMessageID, generateWAMessageFromContent } from '@adiwajshing/baileys';
import { randomBytes } from 'crypto';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'polling',
	description: 'Send polling.',
	category: 'Debugging',
	usage: '!polling',
	aliases: ['poll', 'pollwith'],
	cooldown: 5,
	limit: 0,
	status: 'enable',
	async run({ from }, client) {
		const messages = generateWAMessageFromContent(
			from,
			{
				pollCreationMessage: {
					encKey: generateMessageID(),
					name: 'Poll',
					selectableOptionsCount: 1,
					options: [
						{
							optionName: 'Option 1'
						},
						{
							optionName: 'Option 2'
						}
					]
				},
				messageContextInfo: {
					messageSecret: randomBytes(32)
				}
			},
			{}
		);

		await client[botNum].relayMessage(from, messages.message, { messageId: messages.key.id });

		process.nextTick(() => {
			client[botNum].processingMutex.mutex(() => client[botNum].upsertMessage(messages, 'append'));
		});
	}
};
