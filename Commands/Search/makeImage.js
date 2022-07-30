import { createImage } from "../../Utils/Deepai/index.js";

export default {
	name: "makeimage",
	description: "Create an image based on your description",
	usage: "!makeimage <scenario>",
	category: "Search",
	aliases: ["createimage", "makeimg", "createimg"],
	limit: 2,
	cooldown: 2,
	status: "enable",
	async run({ query, from, message }, client) {
		if (!query) return client[botNum].reply({ from, quoted: message }, "You must provide a query.");
		try {
			await client[botNum].reply({ from, quoted: message }, "Creating. Please wait...");
			const result = await createImage(query);
			const caption = `\`\`\` • A.I Image Generator (powered by deepai.org)\`\`\``;
			await client[botNum].sendMessage(from, { image: { url: result }, caption }, { quoted: message });
		} catch (err) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${err.name}\n`;
			str += `Message : ${err.message}`;
			await client[botNum].reply({ from, quoted: message }, str);
			log(err);
		}
	},
};
