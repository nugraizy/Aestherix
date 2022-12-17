/* global botNum */

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
		await client[botNum].sendMessage(from, {
			text: 'Hi this is a button message',
			footer: 'Hello World',
			buttons: [
				{ buttonId: 'id1', buttonText: { displayText: 'Button 1' }, type: 1 },
				{ buttonId: 'id2', buttonText: { displayText: 'Button 2' }, type: 1 },
			],
			headerType: 1,
		});
	},
};
