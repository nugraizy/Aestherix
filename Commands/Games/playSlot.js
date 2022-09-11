/* global botNum */
import { slot as slots } from '../../Utils/Games/index.js';

export default {
	name: 'slotmachine',
	description: 'Play Slot Machine',
	usage: '!slot <bet>',
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

		await client[botNum].reply({ from, quoted: message }, capt);
	},
};
