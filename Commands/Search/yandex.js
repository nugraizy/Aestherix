import fs from "fs";
import path from "path";
import { __dirname } from "../../connect.js";
import { isURL, removeDuplicatesArray } from "../../Helper/index.js";
import { yandex } from "../../Utils/Image Reverse Search/index.js";

export default {
	name: "yandex",
	description: "Reverse image search",
	usage: "!yandex <reply image/send image>",
	category: "Search",
	aliases: ["ri", "similar", "whatimage", "whatimg", "findimg"],
	limit: 2,
	cooldown: 2,
	status: "enable",
	async run({ isMediaImage, query, extractMediaData, filename, from, message, typeQuoted }, client) {
		if (!isURL(query) && !isMediaImage) return client[botNum].reply({ from, quoted: message }, "Please send/reply a image to find the similar image");
		let media = query && isURL(query) ? query : null;
		try {
			await client[botNum].reply({ from, quoted: message }, "Searching. Please wait...");
			if (isMediaImage)
				media = await client[botNum].downloadAndSaveMediaMessage(
					extractMediaData,
					path.join(__dirname, `Temporary Files/${filename}.${extractMediaData.mimetype.split("/")[1]}`),
					typeQuoted,
				);
			const result = await yandex(media);
			if ("error" in result) {
				if (isMediaImage) fs.unlinkSync(media);
				return client[botNum].reply({ from, quoted: message }, result.error);
			}
			let capt = "``` • Reverse Image Search```\n";
			capt += "Will sending a few similar or the actual images itself. Please wait...\n\n";
			for (const item of result.information) {
				capt += `Title: ${item.title}\nDescription: ${item.description}\n\n`;
			}
			await client[botNum].sendMessage(from, { image: { url: result.information[0].images }, caption: capt.trim() }, { quoted: message });
			let i = 0;
			const images = removeDuplicatesArray(result.information.map((item) => item.images));
			for (const image of images) {
				if (i == 5) break;
				await client[botNum].sendMessage(from, { image: { url: image } });
				i++;
			}
			if (isMediaImage) fs.unlinkSync(media);
		} catch (err) {
			if (isMediaImage) fs.unlinkSync(media);
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${err.name}\n`;
			str += `Message : ${err.message}`;
			await client[botNum].reply({ from, quoted: message }, str);
			log(err);
		}
	},
};
