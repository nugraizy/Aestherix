export default {
	name: "revoke",
	description: "Revoke group's invitation URL.",
	usage: "!revoke",
	aliases: ["rvk", "tarik"],
	category: "Moderation",
	cooldown: 2,
	limit: 2,
	async run(message, client, store) {
		if (!message.isAdmin) return client[botNum].reply(message.from, "You are not admin. This commands is only for admins.");
		if (!message.isBotAdmin) return client[botNum].reply(message.from, "Bot is not admin, Please promote admin before using moderation commands.");
		const code = (await client[botNum].updateGroup(message.from, undefined, "REVOKE"))[0];
		const buttons = [{ buttonId: `.retrieve Absolute URL : https://chat.whatsapp.com/${code}\nRAW : ${code}`, buttonText: { displayText: "SHOW URL" }, type: 1 }];
		if (message.query && message.type == "buttonsResponseMessage") {
			return await client[botNum].reply(message.from, message.body);
		}
		await client[botNum].buttonText(message.from, "URL is successfully revoked.", "Made by nanda", buttons, { quoted: message.message });
	},
};
