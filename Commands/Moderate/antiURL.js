import { writeJSON, readJSON } from "../../Helper/Modules/index.js";

export default {
	name: "antiurl",
	aliases: ["antilink", "antitautan"],
	description: "Enable or disable anti-url",
	category: "Moderation",
	usage: "antiurl <enable/disable>",
	cooldown: 2,
	limit: 2,
	status: "enable",
	async run(message, client) {
		if (!message.isAdmin && !message.isOwner) return client[botNum].reply({ from, quoted: message }, "You are not admin. This commands is only for admins.");
		if (!message.isBotAdmin) return client[botNum].reply({ from, quoted: message }, "Bot is not admin, Please promote admin before using moderation commands.");
		if (!message.query) return client[botNum].reply({ from: message.from, quoted: message.message }, "Please specify a command\n\nEx: antiurl <enable/disable>");
		const data = readJSON("./Databases/Groups/settingsManager.json");
		switch (message.query.toLowerCase()) {
			case "enable":
			case "on":
				if (message[message.from].antiURL == "enable") return client[botNum].reply({ from: message.from, quoted: message.message }, "You already have this command enabled");
				message[message.from].antiURL = "enable";
				data[data.findIndex((v) => Object.keys(v)[0] == message.from)][message.from].antiURL = "enable";
				writeJSON("./Databases/Groups/settingsManager.json", data);
				client[botNum].reply({ from: message.from, quoted: message.message }, "You have successfully enabled anti-url");
				break;
			case "disable":
			case "off":
				if (message[message.from].antiURL == "disable") return client[botNum].reply({ from: message.from, quoted: message.message }, "You already have this command disabled");
				message[message.from].antiURL = "disable";
				data[data.findIndex((v) => Object.keys(v)[0] == message.from)][message.from].antiURL = "disable";
				writeJSON("./Databases/Groups/settingsManager.json", data);
				client[botNum].reply({ from: message.from, quoted: message.message }, "You have successfully disabled anti-url");
				break;
			default:
				return client[botNum].reply({ from: message.from, quoted: message.message }, "Please specify a command\n\nEx: antiurl <enable/disable>");
		}
	},
};
