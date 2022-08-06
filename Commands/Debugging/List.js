import { generateWAMessageFromContent } from "@adiwajshing/baileys";

export default {
	name: "list",
	description: "Send list message.",
	category: "Debugging",
	usage: "!list",
	aliases: ["lst"],
	cooldown: 5,
	limit: 0,
	status: "enable",
	async run({ from, query }, client, store) {
		const row = Array(Number(query || 1)).fill({
			rows: [
				{
					title: "Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪",
					rowId: `Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`,
				},
			],
			title: "Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪",
		});
		const messages = generateWAMessageFromContent(
			from,
			{
				listMessage: {
					buttonText: "Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪",
					description: "List Message",
					listType: 1,
					footerText: "Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪",
					sections: row,
				},
			},
			{},
		);
		await client[botNum].relayMessage(from, messages.message, { messageId: messages.key.id });
	},
};
