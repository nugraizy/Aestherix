import { writeJSON, readJSON } from "../../Helper/Modules/functions.js";

export default {
	name: "antidelete",
	aliases: ["antidelet", "antihapus"],
	description: "Enable or disable anti-delete",
	category: "Moderation",
	usage: "antidelete <enable/disable>",
	async run(message, client) {
		if (!message.query) return client[botNum].reply(message.from, "Please specify a command\n\nEx: antidelete <enable/disable>");
		const data = readJSON("./Databases/Groups/settingsManager.json");
		switch (message.query.toLowerCase()) {
			case "enable":
				if (message[message.from].antiDelete == "enable") return client[botNum].reply(message.from, "You already have this command enabled");
				message[message.from].antiDelete = "enable";
				data[data.findIndex((v) => Object.keys(v)[0] == message.from)][message.from].antiDelete = "enable";
				writeJSON("./Databases/Groups/settingsManager.json", data);
				client[botNum].reply(message.from, "You have successfully enabled anti-delete");
				break;
			case "disable":
				if (message[message.from].antiDelete == "disable") return client[botNum].reply(message.from, "You already have this command disabled");
				message[message.from].antiDelete = "disable";
				data[data.findIndex((v) => Object.keys(v)[0] == message.from)][message.from].antiDelete = "disable";
				writeJSON("./Databases/Groups/settingsManager.json", data);
				client[botNum].reply(message.from, "You have successfully disabled anti-delete");
				break;
			default:
				return client[botNum].reply(message.from, "Please specify a command\n\nEx: antidelete <enable/disable>");
		}
	},
};
