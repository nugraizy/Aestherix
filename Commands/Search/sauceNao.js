import fs from "fs";
import path from "path";
import { __dirname } from "../../connect.js";
import { isURL } from "../../Helper/index.js";
import { sauceNao } from "../../Utils/Image Reverse Search/index.js";

export default {
	name: "saucenao",
	description: "Reverse image anime search",
	usage: "!saucenao <reply image/send image>",
	category: "Search",
	aliases: ["nao", "waitnao"],
	limit: 2,
	cooldown: 2,
	status: "enable",
	async run({ isMediaImage, query, extractMediaData, filename, from, message }, client) {
		if (!isURL(query) && !isMediaImage) return client[botNum].reply({ from, quoted: message }, "Please send/reply a image to find the similar image");
		let media = query && isURL(query) ? query : null;
		try {
			await client[botNum].reply({ from, quoted: message }, "Searching. Please wait...");
			if (isMediaImage)
				media = await client[botNum].downloadAndSaveMediaMessage(extractMediaData, path.join(__dirname, `Temporary Files/${filename}.${extractMediaData.mimetype.split("/")[1]}`));
			const result = await sauceNao(media);
			if ("error" in result) {
				if (isMediaImage) fs.unlinkSync(media);
				return client[botNum].reply({ from, quoted: message }, result.error);
			}
			if (result.title == "") return await client[botNum].reply({ from, quoted: message }, `Can't discover what anime is this. Try moe instead.`);
			const capt = `\`\`\` • What Anime ?\`\`\`
Title : ${result.title}
Description : ${result.description}
Similarity : ${result.similarity}%
Powered by sauce.nao`;
			await client[botNum].reply({ from, quoted: message }, capt.trim());
			if (isMediaImage) fs.unlinkSync(media);
		} catch (err) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${err.name}\n`;
			str += `Message : ${err.message}`;
			await client[botNum].reply({ from, quoted: message }, str);
			log(err);
		}
	},
};
