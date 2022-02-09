import fs from "fs";
import moment from "moment";

function infoLog(...info) {
	console.log(...info);
}
function isSame(a, b) {
	return a === b;
}

export default {
	async handler(message, client, CMD) {
		const { reassign } = await import("../Helper/reassignMessagesObject.js");
		message = await reassign(JSON.parse(JSON.stringify(message.messages[0])), client);
		if (!message.message) return;
		if (message.key && message.key.remoteJid == "status@broadcast") return;
		if (message.type == "protocolMessage" || message.type == "senderKeyDistributionMessage" || !message.type) return;
		if (message.isCmd) {
			CMD = CMD.commands.get(message.cmd.slice(1).trim().toLowerCase()) || CMD.commands.find((v) => v.aliases.includes(message.cmd.slice(1).trim().toLowerCase())) || false;
			if (CMD) {
				try {
					CMD.run(message, client, message.query);
				} catch (e) {
					console.log(e);
				}
			}
		}
	},
};
