import { generateWAMessage, generateWAMessageFromContent } from "@adiwajshing/baileys";
import fs from "fs-extra";

export default {
	name: "product",
	description: "Send product.",
	category: "Debugging",
	usage: "!product",
	aliases: ["prd"],
	cooldown: 5,
	limit: 0,
	status: "enable",
	async run({ from, sender }, client, store) {
		const messages = await generateWAMessage(from, { image: await fs.readFile("./Media Files/blank.png") }, { upload: client[botNum].waUploadToServer });
		const content = generateWAMessageFromContent(
			from,
			{
				productMessage: {
					product: {
						productImage: messages.message.imageMessage,
						productId: "nandagans",
						title: "Nanda",
						description: "Nanda is a product description.",
						currencyCode: "IDR",
						priceAmount1000: 1_000_000,
						retailerId: "Made by Hidden Finder",
						url: "https://github.com/nugraizy/simplebotPRO3",
						productImageCount: 1,
						salePriceAmount1000: 1_000_000,
					},
					catalog: {
						catalogImage: messages.message.imageMessage,
						title: "Nanda Ganteng",
						description: "Nanda is a catalog description.",
					},
					businessOwnerJid: sender,
					body: "Nanda is a body",
					footer: "Nanda is a footer",
				},
			},
			{},
		);
		client[botNum].relayMessage(from, content.message, { messageId: content.key.id });
	},
};
