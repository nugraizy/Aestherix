export default {
	name: "searchmessage",
	description: "Search for a message in the current group",
	usage: "!searchmessage",
	aliases: ["findmessage", "searchmsg", "findmsg"],
	category: "Helper",
	cooldown: 10,
	limit: 3,
	async run({ from, query }, client) {
		let capt = `Void Bot Search\n\n`;
		const messages = await client[botNum].searchMessage(from, query);
		if (messages.length == 0) capt += `No message found.`;
		else {
			capt += `Found ${messages.length} messages.\n\n`;
			await client[botNum].reply(from, capt.trim());
			for (let i = 0; i < messages.length; i++) {
				const a = await client[botNum].reply(from, "Found it.", messages[i]);
			}
			return messages;
		}
		await client.reply(from, capt.trim());
		return messages;
	},
};
