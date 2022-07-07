export default {
	name: "lock",
	description: "Lock the group.",
	usage: "!lock",
	aliases: ["lockgroup", "lockgroupchat", "lockgroupchatroom"],
	category: "Moderation",
	cooldown: 2,
	limit: 2,
	async run({ groupMetadata, isAdmin, isBotAdmin, from, message }, client, store) {
		if (!isAdmin) return client[botNum].reply({ from, quoted: message }, "You are not admin. This commands is only for admins.");
		if (!isBotAdmin) return client[botNum].reply({ from, quoted: message }, "Bot is not admin, Please promote admin before using moderation commands.");
		if (groupMetadata.announce) return client[botNum].reply({ from, quoted: message }, "Group is already locked.");
		await client[botNum].updateGroup(from, undefined, "ANNOUNCEMENT");
	},
};
