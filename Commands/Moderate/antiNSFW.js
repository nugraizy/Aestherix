import { readJSON, writeJSON } from "../../Helper/Modules/index.js";

export default {
	name: "antinsfw",
	aliases: ["antiporn", "noporn", "nonsfw"],
	description: "Enable or disable anti-porn",
	category: "Moderation",
	usage: "!antinsfw <enable/disable>",
	cooldown: 2,
	limit: 2,
	status: "enable",
	async run(message, client) {
		if (!message.isAdmin && !message.isOwner) {
			return await client[botNum].reply({ from: message.from, quoted: message.message }, "You are not admin. This commands is only for admins.");
		}
		if (!message.isBotAdmin) {
			return await client[botNum].reply({ from: message.from, quoted: message.message }, "Bot is not admin, Please promote admin before using moderation commands.");
		}
		if (!message.query) {
			return await client[botNum].reply({ from: message.from, quoted: message.message }, "Please specify a command\n\nEx: antinsfw <enable/disable>");
		}
		const data = readJSON("./Databases/Groups/settingsManager.json");
		switch (message.query.toLowerCase()) {
			case "enable":
			case "on":
				if (message[message.from].antiNSFW == "enable") {
					return await client[botNum].reply({ from: message.from, quoted: message.message }, "You already have this command enabled");
				}
				message[message.from].antiNSFW = "enable";
				data[data.findIndex((v) => Object.keys(v)[0] == message.from)][message.from].antiNSFW = "enable";
				writeJSON("./Databases/Groups/settingsManager.json", data);
				client[botNum].reply({ from: message.from, quoted: message.message }, "You have successfully enabled anti-nsfw");
				break;
			case "disable":
			case "off":
				if (message[message.from].antiNSFW == "disable") {
					return await client[botNum].reply({ from: message.from, quoted: message.message }, "You already have this command disabled");
				}
				message[message.from].antiNSFW = "disable";
				data[data.findIndex((v) => Object.keys(v)[0] == message.from)][message.from].antiNSFW = "disable";
				writeJSON("./Databases/Groups/settingsManager.json", data);
				client[botNum].reply({ from: message.from, quoted: message.message }, "You have successfully disabled anti-nsfw");
				break;
			default:
				return await client[botNum].reply({ from: message.from, quoted: message.message }, "Please specify a command\n\nEx: antinsfw <enable/disable>");
		}
	},
};
