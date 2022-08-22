export default {
	name: "description",
	description: "Change the description of the group.",
	usage: "!description <texts>",
	aliases: ["desc"],
	category: "Moderation",
	cooldown: 4,
	limit: 2,
	status: "enable",
	async run({ isAdmin, isBotAdmin, isOwner, query, bodyQuoted, from, message }, client, store) {
		if (!isAdmin && !isOwner) {
			return await client[botNum].reply({ from, quoted: message }, "You are not admin. This commands is only for admins.");
		}
		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, "Please input the description.");
		}
		if (!isBotAdmin) {
			return await client[botNum].reply({ from, quoted: message }, "Bot is not admin, Please promote admin before using moderation commands.");
		}
		if (query) {
			return await client[botNum].updateGroup(from, undefined, "DESCRIPTION", query);
		}
		if (bodyQuoted) {
			return await client[botNum].updateGroup(from, undefined, "DESCRIPTION", bodyQuoted);
		}
	},
};
