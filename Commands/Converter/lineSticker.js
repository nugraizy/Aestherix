import { exec } from "child_process";
import path from "path";
import { __dirname } from "../../connect.js";
import { unlinkFile } from "../../Helper/Modules/index.js";
import { convertMediaToSticker } from "../../Utils/Converter/index.js";
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
		if (!query) return client[botNum].reply({ from, quoted: message }, "Please enter a query");
		let result = await line(query);
		if (result.length > 10) result = result.slice(0, 10);
		const capt = `Line Stickers\n\nAuthor : ${result[0].author.capitalize()}\nTot. Stickers : ${result.length}`;
		await client[botNum].sendMessage(from, { text: capt }, { quoted: message });
		for (const { stickers } of result) {
			if (stickers.animated) {
				exec(`wget -O "${path.join(__dirname, `Temporary Files/${filename}`)}" "${stickers.animated}"`, async (err) => {
					const sticker = await convertMediaToSticker(path.join(__dirname, `Temporary Files/${filename}`), prettyNumber, path.join(__dirname, `Temporary Files/${filename}.webp`));
					await client[botNum].sendMessage(from, { sticker }, { quoted: message });
				});
				continue;
			}
			const sticker = await convertMediaToSticker(
				stickers.static,
				prettyNumber,
				path.join(__dirname, `Temporary Files/${filename}${stickers.static.split("/")[stickers.static.split("/").length - 1].split(";")[0].split(".")[0]}.webp`),
			);
			await client[botNum].sendMessage(from, { sticker }, { quoted: message });
		}
		unlinkFile(path.join(__dirname, `Temporary Files/${filename}`));
	},
};
