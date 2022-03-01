export default {
	name: "retrieve",
	description: "Retrieve the group's invitation URL.",
	usage: "!retrieve",
	aliases: ["invite", "inv", "link"],
	category: "Moderation",
	cooldown: 2,
	limit: 2,
	async run(message, client, store) {
		if (!message.isAdmin) return client[botNum].reply(message.from, "You are not admin. This commands is only for admins.");
		if (!message.isBotAdmin) return client[botNum].reply(message.from, "Bot is not admin, Please promote admin before using moderation commands.");
		await client[botNum].reply(message.from, `Absolute URL : https://chat.whatsapp.com/${(await client[botNum].updateGroup(message.from, undefined, "RETRIEVE"))[0]}\nRAW : ${(await client[botNum].updateGroup(message.from, undefined, "RETRIEVE"))[0]}`);
	},
};
