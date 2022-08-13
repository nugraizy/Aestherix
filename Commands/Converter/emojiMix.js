import emojiReg from "emoji-regex";
import jsSplit from "js-split";
import path from "path";
import { __dirname } from "../../connect.js";
import { emojimix } from "../../Utils/Converter/index.js";

export default {
	name: "emojimixer",
	description: "Mix emoji.",
	usage: "!emojimix <Emoji1> <Emoji2>",
	aliases: ["emojimix", "emx"],
	category: "Converter",
	cooldown: 5,
	limit: 1,
	status: "enable",
	async run({ query, from, filename, message, prettyNumber }, client) {
		if (!query) return client[botNum].reply({ from, quoted: message }, "Please enter a query");
		const regex = query.match(emojiReg());
		if (!regex) return client[botNum].reply({ from, quoted: message }, "Please enter a valid emoji");
		if (regex.length < 2) return client[botNum].reply({ from, quoted: message }, "Please enter 2 valid emoji");
		const emojis = jsSplit(regex, 2);
		for (const arr of emojis) {
			if (arr.length == 1) continue;
			const result = await emojimix(arr[0], arr[1]);
			if (typeof result == "object" && "error" in result) return client[botNum].reply({ from, quoted: message }, result.error);
			const sticker = await client[botNum].prepareSticker(result, path.join(__dirname, `Temporary Files/${filename}`), undefined, { author, packname });
			await client[botNum].sendMessage(from, { sticker }, { quoted: message });
		}
	},
};
