import path from "path";
import { telegram } from "../../Utils/Stickers/index.js";
import { convertMediaToSticker } from "../../Utils/Converter/index.js";
import { createExif } from "../../Utils/Misc/index.js";
import { __dirname } from "../../connect.js";

export default {
	name: "telegramsticker",
	description: "Find Telegram stickers.",
	usage: "!telegramsticker <query>",
	aliases: ["ts", "telestick", "telegramstickers"],
	category: "Converter",
	cooldown: 5,
	limit: 1,
	async run({ query, message, from, prettyNumber, filename }, client) {
		if (!query) return client[botNum].reply({ from, quoted: message }, "Please enter a query");
		const result = await telegram(query);
		if (result.stickers.length > 10) result.stickers = result.stickers.slice(0, 10);
		const capt = `Telegram Stickers\n\nName : ${result.name.capitalize()}\nTitle : ${result.title.capitalize()}\nTot. Stickers : ${result.stickers.length}`;
		await client[botNum].sendMessage(from, { text: capt }, { quoted: message });
		createExif("Made by Nanda", "Void bot");
		for (const stickers of result.stickers) {
			const sticker = await convertMediaToSticker(stickers, prettyNumber, path.join(__dirname, `Temporary Files/${filename}${stickers.split("/")[stickers.split("/").length - 1]}`));
			await client[botNum].sendMessage(from, { sticker }, { quoted: message });
		}
	},
};
