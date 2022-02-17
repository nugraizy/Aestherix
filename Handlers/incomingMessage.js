import moment from "moment-timezone";
import similarity from "similarity";
import { delay } from "@adiwajshing/baileys";
import { isBigger, isNotSame, isNotZero, isSame, INFOLOG, color } from "../Helper/Modules/functions.js";

moment.tz.setDefault("Asia/Jakarta").locale("id");

export default {
	async handler(message, client, CMD) {
		const time = moment().format("HH:mm:ss DD/MM");
		const { reassign } = await import("../Helper/Modules/reassignMessagesObject.js");
		const { tebak } = await import("./index.js");
		message = await reassign(JSON.parse(JSON.stringify(message.messages[0])), client);
		if ("error" in message) return;
		if (isSame(typeof message, "string")) return;
		if (!message.message) return;
		if (message.isBaileys) return;
		if (message.key && message.key.remoteJid == "status@broadcast") return;
		if (isSame(message.type, "protocolMessage") || isSame(message.type, "senderKeyDistributionMessage") || !message.type) return;
		if (message.isCmd) {
			let bodies = [];
			if (OPTIONS.multiCmd) {
				bodies = message.body.split("|");
			} else bodies.push(message.body);
			for (const body of bodies) {
				message.body = body.trim();
				message.args = message.body.split(/ +/g);
				message.cmd = message.body.toLowerCase().split(" ")[0].trim() || "";
				message.query = message.args.slice(1).join(" ").trim();
				const correctedCommand = [];
				if (OPTIONS.autoCorrect && isNotSame(message.args[0], `${message.prf}menu`)) {
					for (const aliases of CMD.aliases) {
						const correcting = similarity(message.args[0], aliases);
						if (isBigger(correcting, Math.min(0.67)))
							correctedCommand.push({
								score: correcting,
								command: aliases,
							});
					}
				}
				if (isNotZero(correctedCommand.length)) {
					const HIGH_SCORE = correctedCommand.find((x) =>
						isSame(
							Math.max.apply(
								null,
								correctedCommand.map((x) => x.score),
							),
							x.score,
						),
					);
					message.cmd = message.prf + HIGH_SCORE.command.toLowerCase().split(" ")[0].trim() || "";
				}
				const TempCMD = CMD.commands.get(message.cmd.slice(1).trim().toLowerCase()) || CMD.commands.find((v) => v.aliases.includes(message.cmd.slice(1).trim().toLowerCase())) || CMD.commands.find((v) => v.aliases.includes(message.cmd.trim().toLowerCase())) || false;
				if (message.isGroup) {
					INFOLOG(
						`[${color(time, "cyan")}]`,
						`${color(message.pushname, "white")} ${color(message.prettyNumber, "#ff71ce")} :`,
						`${color(message.prefix, "white")}${color(CMD.name || message.cmd.slice(1), "#01cdfe")}`,
						`${color(message.query.substr(0, 20), "#05ffa1")}`,
						`${color(message.from, "#b967ff")}`,
						`${color("type", "#ff71ce")} : ${color(message.type, "#b967ff")}`,
					);
				} else
					INFOLOG(
						`[${color(time, "cyan")}]`,
						`${color(message.pushname, "white")} ${color(message.prettyNumber, "#ff71ce")} :`,
						`${color(message.prefix, "white")}${color(CMD.name || message.cmd.slice(1), "#01cdfe")}`,
						`${color(message.query.substr(0, 20), "#05ffa1")}`,
						`${color("type", "#ff71ce")} : ${color(message.type, "#b967ff")}`,
					);
				if (TempCMD) {
					try {
						TempCMD.run(message, client);
						await delay(200);
					} catch (err) {
						let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
						str += `Type : ${err.name}\n`;
						str += `Message : ${err.message}`;
						await client[botNum].reply(message.from, str);
						console.log(err);
					}
				}
			}
		} else {
			if (!message.isGroup) INFOLOG(`[${color(time, "cyan")}]`, `${color(message.pushname, "white")} ${color(message.prettyNumber, "#ff71ce")} :`, `${color(message.body.trim().replace("\n", "").substr(0, 20), "#05ffa1")}`, `${color("type", "#ff71ce")} : ${color(message.type, "#b967ff")}`);
			else {
				INFOLOG(
					`[${color(time, "cyan")}]`,
					`${color(message.pushname, "white")} ${color(message.prettyNumber, "#ff71ce")} :`,
					`${color(message.body.trim().replace("\n", "").substr(0, 20), "#05ffa1")}`,
					`${color(message.from, "#b967ff")}`,
					`${color("type", "#ff71ce")} : ${color(message.type, "#b967ff")}`,
				);
			}
			tebak(message, client);
		}
	},
};
