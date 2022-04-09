import { generateWAMessageFromContent } from "@adiwajshing/baileys";

export default {
	name: "polling",
	description: "Send polling to a message.",
	category: "Debugging",
	usage: "!polling <emoji>",
	aliases: ["poll", "pollwith"],
	cooldown: 5,
	async run({ from, message, bodyQuoted, mediaData, query }, client, store) {
		const messages = generateWAMessageFromContent(
			from,
			{
				pollCreationMessage: {
					encKey: randomString(16),
					name: "Poll",
					selectableOptionsCount: 2,
					options: [],
				},
			},
			{},
		);
		await client[botNum].relayMessage(from, messages.message, { messageId: messages.key.id });
	},
};

function randomString(length) {
	let result = "";
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}
