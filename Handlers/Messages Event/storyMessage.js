import moment from "moment-timezone";
import { INFOLOG, color } from "../../Helper/Modules/index.js";
import { runtime } from "../../connect.js";
import { generateWAMessageFromContent } from "@adiwajshing/baileys";
import { textStory } from "../../Helper/Canvas/index.js";

export default {
	async handler(client, message) {
		const time = moment().format("HH:mm:ss DD/MM");
		const runtimes = ((Date.now() - runtime) / 1000).toFixed(0);
		let caption = `\`\`\`Auto Fetch WhatsApp Story\`\`\`\n\n`;
		let messages;
		caption += `Name : ${message.pushname}\n`;
		caption += `Number : ${message.prettyNumber}\n`;
		caption += `Type : ${message.type}\n`;
		if (message.type == "extendedTextMessage") {
			caption += `Body : ${message.body}`;
			const buffer = await textStory(message.body, message.message.message.extendedTextMessage.backgroundArgb);
			return await client[botNum].sendMessage("0@s.whatsapp.net", { image: buffer, caption: caption.trim() });
		} else if (message.type == "videoMessage" || message.type == "imageMessage") {
			caption += `Caption : ${message.body}`;
			messages = generateWAMessageFromContent("0@s.whatsapp.net", { ...message.message.message }, {});
			messages.message[message.type].caption = caption;
			messages.message[message.type].contextInfo = {
				stanzaId: message.message.key.id,
				participant: message.message.key.participant,
				quotedMessage: message.message.message,
				remoteJid: message.message.key.remoteJid,
			};
			await client[botNum].relayMessage("0@s.whatsapp.net", messages.message, { messageId: messages.key.id });
		}
		INFOLOG(
			`[${color(time, "cyan")}]`,
			`${color(message.pushname.trim(), "white")} ${color(message.prettyNumber, "#ff71ce")} :`,
			`${color(message.body?.trim()?.replace("\n", "")?.substr(0, 20), "#05ffa1")}`,
			`${color(message.from, "#b967ff")}`,
			`${color("type", "#ff71ce")} : Story ${color(message.type, "#b967ff")}`,
			`${color(runtimes, "#f18f15")}${color(`s`, "#f5e700")}`,
		);
	},
};
