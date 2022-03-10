import path from "path";
import { __dirname } from "../../connect.js";
import { isURL, removeDuplicatesArray } from "../../Helper/index.js";
import { reverseImageSearch } from "../../Utils/Yandex/index.js";

export default {
	name: "reverseimagesearch",
	description: "Reverse image search",
	usage: "!reverseimagesearch <reply image/send image>",
	category: "Search",
	aliases: ["ri", "similar", "whatimage", "whatimg", "findimg"],
	limit: 2,
	cooldown: 2,
	async run({ isMediaImage, query, extractMediaData, filename, from, message }, client) {
		if (!isURL(query) && !isMediaImage) return client[botNum].reply(from, "Please send/reply a image to find the similar image");
		try {
			let media = query && isURL(query) ? query : null;
			await client[botNum].reply(from, "Searching. Please wait...");
			if (isMediaImage) media = await client[botNum].downloadAndSaveMediaMessage(extractMediaData, path.join(__dirname, `Temporary Files/${filename}.${extractMediaData.mimetype.split("/")[1]}`));
			const result = await reverseImageSearch(media);
			if ("error" in result) return client[botNum].reply(from, result.error);
			let capt = "Reverse Image Search\n";
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
		} catch (err) {
			log(err);
		}
	},
};
