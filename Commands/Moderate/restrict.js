export default {
	name: "restrict",
	description: "Restrict the group.",
	usage: "!restrict",
	aliases: ["restrictgroup", "restrictgroupchat"],
	category: "Moderation",
	cooldown: 2,
	limit: 2,
	async run({ groupMetadata, isAdmin, isBotAdmin, isOwner, from, message }, client, store) {
		if (!isAdmin && !isOwner) return client[botNum].reply({ from, quoted: message }, "You are not admin. This commands is only for admins.");
		if (!isBotAdmin) return client[botNum].reply({ from, quoted: message }, "Bot is not admin, Please promote admin before using moderation commands.");
		if (groupMetadata.restrict) return client[botNum].reply({ from, quoted: message }, "Group is already restricted.");
		await client[botNum].updateGroup(from, undefined, "LOCKED");
	},
};
