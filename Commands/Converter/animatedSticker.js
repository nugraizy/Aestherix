import { attp } from "../../Helper/Canvas/animatedImage.js";

export default {
	name: "animatedsticker",
	description: "Generate animated sticker",
	category: "Converter",
	usage: "attp <text> [--color] [--fonts]",
	aliases: ["attp"],
	async run({ from, query, message, sender }, client) {
		if (!query) query = "Mana text nya?";
		try {
			const { buffer } = await attp(sender, query);
			await client[botNum].sendMessage(from, { sticker: new Buffer.from(buffer, "base64") }, { quoted: message });
		} catch (err) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${err.name}\n`;
			str += `Message : ${err.message}`;
			await client[botNum].reply(from, str);
			console.log(err);
		}
	},
};
