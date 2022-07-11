import { slot as slots } from "../../Utils/Games/index.js";

export default {
	name: "slotmachine",
	description: "Play Slot Machine",
	usage: "!slot <bet>",
	category: "Games",
	aliases: ["slot"],
	cooldown: 2,
	limit: 2,
	async run({ from, message, query }, client) {
		let capt;
		const slot = slots(query);
		if (slot.win) {
			capt = `${slot.stringify}\n`;
			capt += `\nYou Won the Prices ${slot.win}!\nSlot Machine by Void.`;
		} else {
			capt = `${slot.stringify}\n`;
			capt += `\nYou Lose ${slot.lose}! Try again?\nSlot Machine by Void.`;
		}
		await client[botNum].reply({ from, quoted: message }, capt);
	},
};
