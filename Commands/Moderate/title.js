export default {
	name: "title",
	description: "Change the title of the group.",
	usage: "!title <texts>",
	aliases: ["subject", "topic", "name"],
	category: "Moderation",
	cooldown: 2,
	limit: 2,
	async run(message, client, store) {
		if (!message.isAdmin) return client[botNum].reply(message.from, "You are not admin. This commands is only for admins.");
		if (!message.query) return client[botNum].reply(message.from, "Please input the title.");
		if (!message.isBotAdmin) return client[botNum].reply(message.from, "Bot is not admin, Please promote admin before using moderation commands.");
		if (message.query) {
			return await client[botNum].updateGroup(message.from, undefined, "SUBJECT", message.query);
		}
		if (message.bodyQuoted) {
			return await client[botNum].updateGroup(message.from, undefined, "SUBJECT", message.bodyQuoted);
		}
	},
};
