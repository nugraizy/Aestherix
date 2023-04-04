import { generateMessageID, generateWAMessageFromContent } from '@adiwajshing/baileys';

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
					selectableOptionsCount: 2,
					options: [
						{
							optionName: 'Option 1'
						},
						{
							optionName: 'Option 2'
						}
					]
				}
			},
			{}
		);

		await client[botNum].relayMessage(from, messages.message, { messageId: messages.key.id });
	}
};
