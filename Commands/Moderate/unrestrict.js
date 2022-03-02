export default {
	name: "unrestrict",
	description: "Unrestrict the group.",
	usage: "!unlock",
	aliases: ["unrestrict", "unrestrictgroup", "unrestrictgroupchat"],
	category: "Moderation",
	cooldown: 2,
	limit: 2,
	async run({ groupMetadata, isAdmin, isBotAdmin, from }, client, store) {
		if (!isAdmin) return client[botNum].reply(from, "You are not admin. This commands is only for admins.");
		if (!isBotAdmin) return client[botNum].reply(from, "Bot is not admin, Please promote admin before using moderation commands.");
		if (!groupMetadata.restrict) return client[botNum].reply(from, "Group is already unrestricted.");
		await client[botNum].updateGroup(from, undefined, "UNLOCKED");
	},
};
