import { slot as slots } from '../../utils/games/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'slotmachine',
	minifiedDescription: 'Play Slot',
	description: 'Play Slot Machine.',
	usage: '!slot `<bet>`',
	category: 'Games',
	aliases: ['slot'],
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ from, query, prefix }, client) {
		let capt;
		const slot = slots(query);

		if (slot.win) {
			capt = `${slot.stringify}\n`;
			capt += `\nYou Won the Prices ${slot.win}!`;
		} else {
			capt = `${slot.stringify}\n`;
			capt += `\nYou Lose ${slot.lose}! Try again?`;
		}

		const builder = new client.instance.TemplateBuilder.Native();

		const { message: messages } = await builder
			.mainBody(capt)
			.mainFooter(`Slot Game by ${__botName}`)
			.buttons(
				builder.button.reply({
					display: 'Play Again',
					id: `${prefix}slot`
				})
			)
			.render();

		client.instance.relay(from, messages, { messageId: client.instance.generateMessageID() });
	}
};
