export default {
	name: "leave",
	description: "Leave the group",
	usage: "!leave",
	aliases: ["out", "bye"],
	category: "Moderation",
	cooldown: 6,
	limit: 10,
	restrict: true,
	status: "enable",
	async run({ isAdmin, isOwner, from, isGroup, message }, client) {
		if (!isGroup) return client[botNum].reply({ from, quoted: message }, "This command only works in group.");
		if (!isAdmin && !isOwner) return client[botNum].reply({ from, quoted: message }, "You must be an admin to use this command.");
		const data = await client[botNum].reply({ from, quoted: message }, "I'll leave.");
		await client[botNum].groupLeave(from);
		await client[botNum].chatModify({ delete: true, lastMessages: [data] }, from);
	},
};
