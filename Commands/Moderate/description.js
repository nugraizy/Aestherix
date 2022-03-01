export default {
	name: "description",
	description: "Change the description of the group.",
	usage: "!description <texts>",
	aliases: ["desc"],
	category: "Moderation",
	cooldown: 2,
	limit: 2,
	async run(message, client, store) {
		if (!message.isAdmin) return client[botNum].reply(message.from, "You are not admin. This commands is only for admins.");
		if (!message.query && !message.mention) return client[botNum].reply(message.from, "Please input the description.");
		if (!message.isBotAdmin) return client[botNum].reply(message.from, "Bot is not admin, Please promote admin before using moderation commands.");
		if (message.query) {
			return await client[botNum].updateGroup(message.from, undefined, "DESCRIPTION", message.query);
		}
		if (message.bodyQuoted) {
			return await client[botNum].updateGroup(message.from, undefined, "DESCRIPTION", message.bodyQuoted);
		}
	},
};
