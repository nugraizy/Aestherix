import { delay } from "../../Helper/index.js";

export default {
	name: "groupbc",
	description: "Send Broadcast to all groups.",
	usage: "!groupbc <text>",
	aliases: ["gcbc"],
	category: "Owner",
	cooldown: 0,
	limit: 0,
	status: "enable",
	async run({ isOwner, from, query, message, sender }, client) {
		try {
			if (!isOwner) {
				return await client[botNum].reply({ from, quoted: message }, "You are not allowed to use this command");
			}
			if (!query) {
				return await client[botNum].reply({ from, quoted: message }, "You must enter text");
			}
			const getGroups = await client[botNum].groupFetchAllParticipating();
			const groups = Object.entries(getGroups)
				.slice(0)
				.map((entry) => entry[1]);
			const chats = check4Duplicate(groups.map((v) => v.id));
			let text = `\`\`\` • Group Broadcast \`\`\``;
			text += `\n\n${query.trim()}\n\n`;
			text += `\`\`\`Broadcast by @${sender.split("@")[0]}\`\`\``;
			for (let id of chats) {
				await delay(300);
				await client[botNum].sendMessage(id, { text, mentions: [sender] });
			}
		} catch (err) {
			log(err);
			await client[botNum].reply({ from, quoted: message }, err.stack);
		}
	},
};

const check4Duplicate = (chats) => {
	if (!Array.isArray(chats)) {
		return [];
	}
	const newChatIds = [];
	for (let id of chats) {
		if (!newChatIds.includes(id) && id !== "status@broadcast") {
			newChatIds.push(id);
		}
	}
	return newChatIds;
};
