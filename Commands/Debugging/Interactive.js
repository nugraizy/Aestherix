import { generateMessageID, generateWAMessageFromContent } from "@adiwajshing/baileys";
import { readBuffer } from "../../Helper/index.js";

export default {
	name: "interactive",
	description: "Send interactive.",
	category: "Debugging",
	usage: "!interactive",
	aliases: ["inter"],
	cooldown: 5,
	limit: 0,
	status: "enable",
	async run({ from, message, sender, mediaData, query }, client, store) {
		const image = await client[botNum].prepareMedia(readBuffer("./Media Files/blank.png"), "imageMessage");
		const messages = generateWAMessageFromContent(
			from,
			{
				interactiveMessage: {
					header: {
						title: "Nanda title",
						subtitle: "Nanda subtitle",
						hasMediaAttachment: true,
						imageMessage: image.message.imageMessage,
					},
					body: {
						text: "Nanda text",
					},
					footer: {
						text: "Nanda footer",
					},
					nativeFlowMessage: {
						buttons: [
							{
								name: "Nanda button name",
								buttonParamsJson: "Nanda button params json",
							},
						],
					},
				},
			},
			{},
		);
		client[botNum].relayMessage(from, messages.message, { messageId: messages.key.id });
	},
};
