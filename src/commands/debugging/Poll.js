import { generateWAMessageFromContent } from 'baileys';
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
					encKey: client.generateMessageID(),
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
			{ messageId: client.generateMessageID() }
		);

		await client.relay(from, messages.message, { messageId: messages.key.id });

		process.nextTick(() => {
			client.processingMutex.mutex(() => client.upsertMessage(messages, 'append'));
		});
	}
};
