import Timeout from "smart-timeout";
import { readJSON, writeJSON } from "../../Helper/Modules/functions.js";

export async function handler(message, client) {
	const {
		from,
		message: {
			key: { id },
		},
		body,
		sender,
		isAdmin,
		isFromMe,
		isBotAdmin,
	} = message;
	if (!regex(body)) return;
	if (!(await checkURL(client, body.match(/chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i)[0].replace("chat.whatsapp.com/", "")))) return;
	const data = readJSON("./Databases/Groups/settingsManager.json");
	if (Timeout.exists(sender)) {
		Timeout.clear(sender);
		await client[botNum].groupParticipantsUpdate(from, [sender], "remove");
		data[data.findIndex((v) => Object.keys(v)[0] == from)][from].URLSender.splice(
			data[data.findIndex((v) => Object.keys(v)[0] == from)][from].URLSender.findIndex((v) => v.sender == sender),
			1,
		);
		return writeJSON("./Databases/Groups/settingsManager.json", data);
	}
	if (message[from].antiURL == "enable" && !isAdmin && !isFromMe && !Timeout.exists(sender)) {
		client[botNum].sendMessage(from, { text: "Please don't send URLs or you'll be kicked in 10 seconds." }, { quoted: message.message });
		Timeout.set(
			sender,
			async function () {
				if (!isBotAdmin) return Timeout.clear(sender);
				await client[botNum].sendMessage(from, { text: "Time is out. You'll be kicked." }, { quoted: message.message });
				await client[botNum].groupParticipantsUpdate(from, [sender], "remove");
				data[data.findIndex((v) => Object.keys(v)[0] == from)][from].URLSender.splice(
					data[data.findIndex((v) => Object.keys(v)[0] == from)][from].URLSender.findIndex((v) => v.sender == sender),
					1,
				);
				writeJSON("./Databases/Groups/settingsManager.json", data);
				Timeout.clear(sender);
			},
			10_000,
		);
		data[data.findIndex((v) => Object.keys(v)[0] == from)][from].URLSender.push({ sender, id });
		writeJSON("./Databases/Groups/settingsManager.json", data);
	}
}

function regex(input) {
	return /chat.whatsapp.com\/([\w\d]*)/g.test(input);
}

async function checkURL(client, input) {
	try {
		const query = await client[botNum].query({
			tag: "iq",
			attrs: {
				type: "get",
				xmlns: "w:g2",
				to: "@g.us",
			},
			content: [{ tag: "invite", attrs: { code: input } }],
		});
		return true;
	} catch (e) {
		return false;
	}
}
