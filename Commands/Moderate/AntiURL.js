import { writeJSON, readJSON } from "../../Helper/Modules/functions.js";

export default {
	name: "antiurl",
	aliases: ["antilink", "antitautan"],
	description: "Enable or disable anti-url",
	category: "Moderation",
	usage: "antiurl <enable/disable>",
	async run(message, client) {
		if (!message.query) return client[botNum].reply(message.from, "Please specify a command\n\nEx: antiurl <enable/disable>");
		const data = readJSON("./Databases/Groups/settingsManager.json");
		switch (message.query.toLowerCase()) {
			case "enable":
				if (message[message.from].antiURL == "enable") return client[botNum].reply(message.from, "You already have this command enabled");
				message[message.from].antiURL = "enable";
				data[data.findIndex((v) => Object.keys(v)[0] == message.from)][message.from].antiURL = "enable";
				writeJSON("./Databases/Groups/settingsManager.json", data);
				client[botNum].reply(message.from, "You have successfully enabled anti-url");
				break;
			case "disable":
				if (message[message.from].antiURL == "disable") return client[botNum].reply(message.from, "You already have this command disabled");
				message[message.from].antiURL = "disable";
				data[data.findIndex((v) => Object.keys(v)[0] == message.from)][message.from].antiURL = "disable";
				writeJSON("./Databases/Groups/settingsManager.json", data);
				client[botNum].reply(message.from, "You have successfully disabled anti-url");
				break;
			default:
				return client[botNum].reply(message.from, "Please specify a command\n\nEx: antiurl <enable/disable>");
		}
	},
};
