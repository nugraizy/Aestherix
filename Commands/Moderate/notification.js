import { readJSON, writeJSON } from "../../Helper/Modules/index.js";

export default {
	name: "notification",
	aliases: ["eventupd", "eventupdate", "notify"],
	description: "Enable or disable group event notification",
	category: "Moderation",
	usage: "!notification <enable/disable>",
	cooldown: 2,
	limit: 2,
	status: "enable",
	async run(message, client) {
		if (!message.isAdmin && !message.isOwner) return client[botNum].reply({ from: message.from, quoted: message.message }, "You are not admin. This commands is only for admins.");
		if (!message.isBotAdmin) return client[botNum].reply({ from: message.from, quoted: message.message }, "Bot is not admin, Please promote admin before using moderation commands.");
		if (!message.query) return client[botNum].reply({ from: message.from, quoted: message.message }, "Please specify a command\n\nEx: notification <enable/disable>");
		const data = readJSON("./Databases/Groups/settingsManager.json");
		switch (message.query.toLowerCase()) {
			case "enable":
			case "on":
				if (message[message.from].notification == "enable") return client[botNum].reply({ from: message.from, quoted: message.message }, "You already have this command enabled");
				message[message.from].notification = "enable";
				data[data.findIndex((v) => Object.keys(v)[0] == message.from)][message.from].notification = "enable";
				writeJSON("./Databases/Groups/settingsManager.json", data);
				client[botNum].reply({ from: message.from, quoted: message.message }, "You have successfully enabled group notification");
				break;
			case "disable":
			case "off":
				if (message[message.from].notification == "disable") return client[botNum].reply({ from: message.from, quoted: message.message }, "You already have this command disabled");
				message[message.from].notification = "disable";
				data[data.findIndex((v) => Object.keys(v)[0] == message.from)][message.from].notification = "disable";
				writeJSON("./Databases/Groups/settingsManager.json", data);
				client[botNum].reply({ from: message.from, quoted: message.message }, "You have successfully disabled group notification");
				break;
			default:
				return client[botNum].reply({ from: message.from, quoted: message.message }, "Please specify a command\n\nEx: notification <enable/disable>");
		}
	},
};
