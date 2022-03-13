import path from "path";
import emojiReg from "emoji-regex";
import { emojimix } from "../../Utils/Converter/index.js";
import { convertMediaToSticker } from "../../Utils/Converter/index.js";
import { createExif } from "../../Utils/Misc/index.js";
import { __dirname } from "../../connect.js";

export default {
	name: "emojimixer",
	description: "Mix emoji.",
	usage: "!emojimix <Emoji1> <Emoji2>",
	aliases: ["emojimix", "emx"],
	category: "Converter",
	cooldown: 5,
	limit: 1,
	async run({ query, from, filename, message, prettyNumber }, client) {
		if (!query) return client[botNum].reply(from, "Please enter a query");
		const regex = query.match(emojiReg());
		if (!regex) return client[botNum].reply(from, "Please enter a valid emoji");
		if (regex.length != 2) return client[botNum].reply(from, "Please enter 2 valid emoji");
		const result = await emojimix(regex[0], regex[1]);
		if (typeof result == "object" && "error" in result) return client[botNum].reply(from, result.error);
		createExif("Made by Nanda", "Void bot");
		const sticker = await convertMediaToSticker(result, prettyNumber, path.join(__dirname, `Temporary Files/${filename}${result.split("/")[result.split("/").length - 1].split(".")[0]}.webp`));
		await client[botNum].sendMessage(from, { sticker }, { quoted: message });
	},
};
