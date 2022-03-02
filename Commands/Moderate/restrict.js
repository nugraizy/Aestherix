export default {
	name: "restrict",
	description: "Restrict the group.",
	usage: "!restrict",
	aliases: ["restrictgroup", "restrictgroupchat"],
	category: "Moderation",
	cooldown: 2,
	limit: 2,
	async run({ groupMetadata, isAdmin, isBotAdmin, from }, client, store) {
		if (!isAdmin) return client[botNum].reply(from, "You are not admin. This commands is only for admins.");
		if (!isBotAdmin) return client[botNum].reply(from, "Bot is not admin, Please promote admin before using moderation commands.");
		if (groupMetadata.restrict) return client[botNum].reply(from, "Group is already restricted.");
		await client[botNum].updateGroup(from, undefined, "LOCKED");
	},
};
