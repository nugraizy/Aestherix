import { writeJSON, readJSON } from "../../Helper/Modules/index.js";

export default {
	name: "antidelete",
	aliases: ["antidelet", "antihapus"],
	description: "Enable or disable anti-delete",
	category: "Moderation",
	usage: "!antidelete <enable/disable>",
	cooldown: 2,
	limit: 2,
	status: "enable",
	async run(message, client) {
		if (!message.isAdmin && !message.isOwner) return client[botNum].reply({ from, quoted: message }, "You are not admin. This commands is only for admins.");
		if (!message.query) return client[botNum].reply({ from: message.from, quoted: message.message }, "Please specify a command\n\nEx: antidelete <enable/disable>");
		const data = readJSON("./Databases/Groups/settingsManager.json");
		switch (message.query.toLowerCase()) {
			case "enable":
			case "on":
				if (message[message.from].antiDelete == "enable") return client[botNum].reply({ from: message.from, quoted: message.message }, "You already have this command enabled");
				message[message.from].antiDelete = "enable";
				data[data.findIndex((v) => Object.keys(v)[0] == message.from)][message.from].antiDelete = "enable";
				writeJSON("./Databases/Groups/settingsManager.json", data);
				client[botNum].reply({ from: message.from, quoted: message.message }, "You have successfully enabled anti-delete");
				break;
			case "disable":
			case "off":
				if (message[message.from].antiDelete == "disable") return client[botNum].reply({ from: message.from, quoted: message.message }, "You already have this command disabled");
				message[message.from].antiDelete = "disable";
				data[data.findIndex((v) => Object.keys(v)[0] == message.from)][message.from].antiDelete = "disable";
				writeJSON("./Databases/Groups/settingsManager.json", data);
				client[botNum].reply({ from: message.from, quoted: message.message }, "You have successfully disabled anti-delete");
				break;
			default:
				return client[botNum].reply({ from: message.from, quoted: message.message }, "Please specify a command\n\nEx: antidelete <enable/disable>");
		}
	},
};
