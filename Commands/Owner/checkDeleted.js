import moment from "moment-timezone";
import { generateMessageID } from "@adiwajshing/baileys";
import fs from "fs";
import { getTimeSince } from "../../Helper/index.js";
const DB_PATH = `./Media Files/Connection Databases/${cli.input[0] ?? "Session-debug"}.json`;

export default {
	name: "checkdeleted",
	description: "Fetch every deleted messages in chat",
	usage: "!checkdeleted",
	aliases: ["cekdel", "checkdel"],
	category: "Owner",
	cooldown: 0,
	limit: 0,
	status: "enable",
	async run({ isOwner, from, message, args, cmd }, client, store) {
		if (!isOwner) return client[botNum].reply({ from, quoted: message }, "You are not allowed to use this command");
		const messages = OPTIONS.json ? JSON.parse(fs.readFileSync(DB_PATH)).messages[from] : await store.loadMessages(from);
		if (args[1] == "get") {
			const dataMessage = messages.find((v) => v.key.id == args[2]);
			(await import("../../Handlers/Messages Event/deletedMessage.js")).default.handler(client, dataMessage, true, store);
			return;
		}
		const dataMessages = messages.filter((v) => v.message?.protocolMessage && v.message.protocolMessage.type == "REVOKE");
		const row = [];
		let i = 0;
		for (const message of dataMessages) {
			row.push({
				rows: [
					{
						title: `${i + 1}. ${message.pushName.substr(0, 5)} ${getTimeSince(Number(message.messageTimestamp) * 1000)}`,
						rowId: `${cmd} get ${message.message.protocolMessage.key.id}`,
					},
				],
				title: `VOID BOT | ${message?.pushName ?? "No Name"}`,
			});
			i++;
		}
		await client[botNum].relayMessage(from, { listMessage: { buttonText: " • Fetch Deleted WhatsApp Message", description: "choosse one to fetch the metadata message", footerText: "and bot will send the message", listType: 1, sections: row } }, { messageId: generateMessageID() });
	},
};
