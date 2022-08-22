import { exec } from "child_process";
import path from "path";
import { __dirname } from "../../connect.js";
import { unlinkFile } from "../../Helper/Modules/index.js";
import { line } from "../../Utils/Stickers/index.js";

export default {
	name: "linesticker",
	description: "Find Line stickers.",
	usage: "!linesticker <query>",
	aliases: ["ls", "linestick", "linestickers"],
	category: "Converter",
	cooldown: 5,
	limit: 1,
	status: "enable",
	async run({ query, message, from, prettyNumber, filename }, client) {
		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, "Please enter a query");
		}
		let result = await line(query);
		if (result.length > 10) {
			result = result.slice(0, 10);
		}
		const capt = `Line Stickers\n\nAuthor : ${result[0].author.capitalize()}\nTot. Stickers : ${result.length}`;
		await client[botNum].sendMessage(from, { text: capt }, { quoted: message });
		for (const { stickers } of result) {
			const sticker = await client[botNum].prepareSticker(stickers.animated || stickers.static, path.join(__dirname, `Temporary Files/${filename}`), undefined, { author, packname });
			await client[botNum].sendMessage(from, { sticker }, { quoted: message });
		}
	},
};
