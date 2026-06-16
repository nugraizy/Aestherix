import { BOT_NAME } from '../../core/constants.js';

import { getLocale } from '../../helper/i18n/index.js';
import { slot as slots } from '../../utils/games/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'slotmachine',
	minifiedDescription: 'Play Slot',
	description: 'Play Slot Machine.',
	usage: '!slot `<bet>`',
	category: 'Games',
	aliases: ['slot'],
	cooldown: 1,
	limit: 0,
	status: 'enable',
	async run({ from, query, prefix }, client) {
		const locale = await getLocale(from);

		let capt;
		const slot = slots(query);

		if (slot.win) {
			capt = `${slot.stringify}\n`;
			capt += `\nYou Won the Prices ${slot.win}!`;
		} else {
			capt = `${slot.stringify}\n`;
			capt += `\nYou Lose ${slot.lose}! Try again?`;
		}

		const builder = new client.TemplateBuilder.Native();

		await builder
			.destination(from)
			.body(capt)
			.footer(`Slot Game by ${BOT_NAME}`)
			.buttons(
				builder.button.reply({
					display: 'Play Again',
					id: `${prefix}slot`
				})
			)
			.send();
	}
});
