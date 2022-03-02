export default {
	name: "revoke",
	description: "Revoke group's invitation URL.",
	usage: "!revoke",
	aliases: ["rvk", "tarik"],
	category: "Moderation",
	cooldown: 2,
	limit: 2,
	async run({ isAdmin, isBotAdmin, from, query, type, body, message }, client, store) {
		if (!isAdmin) return client[botNum].reply(from, "You are not admin. This commands is only for admins.");
		if (!isBotAdmin) return client[botNum].reply(from, "Bot is not admin, Please promote admin before using moderation commands.");
		const code = (await client[botNum].updateGroup(from, undefined, "REVOKE"))[0];
		const buttons = [{ buttonId: `.retrieve Absolute URL : https://chat.whatsapp.com/${code}\nRAW : ${code}`, buttonText: { displayText: "SHOW URL" }, type: 1 }];
		if (query && type == "buttonsResponseMessage") {
			return await client[botNum].reply(from, body);
		}
		await client[botNum].buttonText(from, "URL is successfully revoked.", "Made by nanda", buttons, { quoted: message });
	},
};
