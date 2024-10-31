import { generateMessageID, generateWAMessageFromContent } from 'baileys';
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
	status: 'disable',
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

		await client.instance.relayMessage(from, messages.message, { messageId: messages.key.id });

		process.nextTick(() => {
			client.instance.processingMutex.mutex(() => client.instance.upsertMessage(messages, 'append'));
		});
	}
};
