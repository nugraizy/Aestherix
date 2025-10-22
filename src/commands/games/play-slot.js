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
	async run({ from, message, query }, client) {
		let capt;
		const slot = slots(query);

		if (slot.win) {
			capt = `${slot.stringify}\n`;
			capt += `\nYou Won the Prices ${slot.win}!\nSlot Machine by Void Bot. Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`;
		} else {
			capt = `${slot.stringify}\n`;
			capt += `\nYou Lose ${slot.lose}! Try again?\nSlot Machine by Void Bot. Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`;
		}

		await client.instance.reply(from, capt, message);
	}
};
