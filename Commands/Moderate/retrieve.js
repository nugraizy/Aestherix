export default {
	name: "retrieve",
	description: "Retrieve the group's invitation URL.",
	usage: "!retrieve",
	aliases: ["invite", "inv", "link"],
	category: "Moderation",
	cooldown: 2,
	limit: 2,
	async run({ isAdmin, isBotAdmin, from, message }, client, store) {
		if (!isAdmin) return client[botNum].reply({ from, quoted: message }, "You are not admin. This commands is only for admins.");
		if (!isBotAdmin) return client[botNum].reply({ from, quoted: message }, "Bot is not admin, Please promote admin before using moderation commands.");
		await client[botNum].reply({ from, quoted: message }, `Absolute URL : https://chat.whatsapp.com/${(await client[botNum].updateGroup(from, undefined, "RETRIEVE"))[0]}\nRAW : ${(await client[botNum].updateGroup(from, undefined, "RETRIEVE"))[0]}`);
	},
};
