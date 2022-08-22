export default {
	name: "lock",
	description: "Lock the group.",
	usage: "!lock",
	aliases: ["lockgroup", "lockgroupchat", "lockgroupchatroom"],
	category: "Moderation",
	cooldown: 2,
	limit: 2,
	status: "enable",
	async run({ groupMetadata, isAdmin, isOwner, isBotAdmin, from, message }, client, store) {
		if (!isAdmin && !isOwner) {
			return await client[botNum].reply({ from, quoted: message }, "You are not admin. This commands is only for admins.");
		}
		if (!isBotAdmin) {
			return await client[botNum].reply({ from, quoted: message }, "Bot is not admin, Please promote admin before using moderation commands.");
		}
		if (groupMetadata.announce) {
			return await client[botNum].reply({ from, quoted: message }, "Group is already locked.");
		}
		await client[botNum].updateGroup(from, undefined, "ANNOUNCEMENT");
	},
};
