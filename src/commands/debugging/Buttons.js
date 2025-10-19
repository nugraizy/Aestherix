import baileys, { generateWAMessageFromContent } from 'baileys';

const { proto } = baileys;

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'button',
	description: 'Send bug.',
	category: 'Debugging',
	usage: '!button',
	aliases: ['butt'],
	cooldown: 5,
	limit: 0,
	status: 'enable',
	async run({ from }, client) {
		const button = generateWAMessageFromContent(
			from,
			{
				buttonsMessage: {
					// contentText: 'Hi this is a button message',
					footerText: 'Hello World',
					text: 'hello',
					buttons: [
						{
							buttonId: '/help',
							buttonText: { displayText: 'HELP' },
							type: 1
						},
						{
							buttonId: '/helps',
							buttonText: { displayText: 'HELP' },
							type: 1
						}
					],
					headerType: 1
				}
			},
			{ messageId: client.instance.generateMessageID() }
		);

		await client.instance.relayMessage(from, button.message, { messageId: button.key.id });
		await client.instance.send(
			from,
			{
				text: 'Hi this is a button message',
				footer: 'Hello World',
				buttons: [
					{ buttonId: 'id1', buttonText: { displayText: 'Button 1' }, type: 1 },
					{ buttonId: 'id2', buttonText: { displayText: 'Button 2' }, type: 1 }
				],
				headerType: 1
			},
			{ viewOnce: true }
		);
	}
};
