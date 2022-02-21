import { writeJSON, readJSON } from "../../Helper/Modules/index.js";

export default {
	name: "games",
	aliases: ["game"],
	description: "Play games with your friends",
	category: "Moderation",
	usage: "games <enable/disable>",
	async run(message, client) {
		if (!message.query) return client[botNum].reply(message.from, `Please specify a command\n\nEx: ${message.cmd} <enable/disable>`);
		const data = readJSON("./Databases/Groups/settingsManager.json");
		switch (message.query.toLowerCase()) {
			case "enable":
				if (message[message.from].games == "enable") return client[botNum].reply(message.from, "You already have this command enabled");
				message[message.from].games = "enable";
				data[data.findIndex((v) => Object.keys(v)[0] == message.from)][message.from].games = "enable";
				writeJSON("./Databases/Groups/settingsManager.json", data);
				client[botNum].reply(message.from, "You have successfully enabled games");
				break;
			case "disable":
				if (message[message.from].games == "disable") return client[botNum].reply(message.from, "You already have this command disabled");
				message[message.from].games = "disable";
				data[data.findIndex((v) => Object.keys(v)[0] == message.from)][message.from].games = "disable";
				writeJSON("./Databases/Groups/settingsManager.json", data);
				client[botNum].reply(message.from, "You have successfully disabled games");
				break;
			default:
				return client[botNum].reply(message.from, `Please specify a command\n\nEx: ${message.cmd} <enable/disable>`);
		}
	},
};
