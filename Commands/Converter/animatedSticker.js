import { bindWaitForConnectionUpdate } from "@adiwajshing/baileys";
import { attp } from "../../Helper/Canvas/animatedImage.js";

export default {
	name: "animatedsticker",
	description: "Generate animated sticker",
	category: "Converter",
	usage: "attp <text> [--color] [--fonts]",
	aliases: ["attp"],
	async run(message, client, parseError) {
		if (!message.query) message.query = "Mana text nya?";
		try {
			const { buffer } = await attp(message.sender, message.query);
			await client[botNum].sendMessage(message.from, { sticker: new Buffer.from(buffer, "base64") }, { quoted: message.message });
		} catch (err) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${err.name}\n`;
			str += `Message : ${err.message}`;
			await client[botNum].reply(message.from, str);
			console.log(err);
		}
	},
};
