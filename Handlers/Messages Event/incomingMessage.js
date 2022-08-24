import moment from "moment-timezone";
import similarity from "similarity";
import { log } from "util";
import { runtime } from "../../connect.js";
import { addLimit, checkAfk, color, delay, deleteAfk, getAfk, getTimeSince, INFOLOG, reassign } from "../../Helper/index.js";
let STATS_OFFLINE = true;
const EVALY = ["/>", "$>", "=>", "!>"];

moment.tz.setDefault("Asia/Jakarta").locale("id");

export default {
	async handler(message, client, cmds, store, user) {
		if (message == undefined) {
			return;
		}
		if (OPTIONS.debugMode && !message?.messages?.[0]?.key?.fromMe) {
			log(JSON.stringify(message, undefined, 2));
		}
		const time = moment().format("HH:mm:ss DD/MM");
		if (message.messages[0] && "messageStubParameters" in message.messages[0]) {
			return (await import("./stubMessage.js")).default.handler(client, message.messages[0], store);
		}
		message = await reassign(JSON.parse(JSON.stringify(message.messages[0])), client, store, false);
		if (
			!message ||
			"error" in message ||
			!message.message ||
			message.isBaileys ||
			message.type == "protocolMessage" ||
			message.type == "senderKeyDistributionMessage" ||
			!message.type
		) {
			return;
		}
		if (message.message.key && message.message.key.remoteJid == "status@broadcast" && OPTIONS.story) {
			return (await import("./storyMessage.js")).default.handler(client, message);
		}
		if (OPTIONS.offline) {
			if (STATS_OFFLINE) {
				await cmds.commands.get("simulates").run({ args: [".simulates", "online", "disable"], isOwner: true, from: false, message: message.message }, client, store);
				STATS_OFFLINE = false;
			}
			(await import("./offlineMessage.js")).default.handler(client, message);
		}

		if (OPTIONS.autoRead && !OPTIONS.offline) {
			client[botNum].readMessages([message.message.key]);
		}

		if (checkAfk(message.sender, message.from)) {
			const { reasons, since } = getAfk(message.sender, message.from);
			const time = getTimeSince(since);
			client[botNum].sendMessage(
				message.from,
				{
					text: `@${message.sender.split("@")[0]} is AFK since ${time} ago. Now they are out from AFK. Reason: ${reasons}`,
					mentions: [message.sender],
				},
				{ quoted: message.message },
			);
			deleteAfk(message.sender, message.from);
		}
		if (!message.isDisappearingChat && !message.isGroup) {
			client[botNum].sendMessage(message.from, { disappearingMessagesInChat: 24 * 60 * 60 });
		}
		if (message.bodyQuoted && checkAfk(message.mediaData.participant, message.from)) {
			const { reasons, since, name } = getAfk(message.mediaData.participant);
			const time = getTimeSince(since);
			client[botNum].reply({ from: message.from, quoted: message.message }, `${name} is AFK since ${time} ago. Reason: ${reasons}`);
		}
		if (message.mention.length > 0) {
			let caption = `You're Tagging People That Are AFK.\n\n`;
			const container = [];
			for (const mention of message.mention) {
				if (checkAfk(mention, message.from)) {
					const { reasons, since, name } = getAfk(mention, message.from);
					const time = getTimeSince(since);
					caption += `${name}\nSince : ${time} ago.\nReason : ${reasons}\n\n`;
					container.push(mention);
				}
			}
			if (container.length > 0) {
				client[botNum].reply({ from: message.from, quoted: message.message }, caption.trim());
			}
		}
		const runtimes = ((Date.now() - runtime) / 1000).toFixed(0);
		if (message.isCmd && message.from !== "status@broadcast") {
			let bodies = [];
			if (OPTIONS.multiCmd) {
				bodies = EVALY.includes(message.cmd) ? [message.body] : message.body.split("|");
			} else {
				bodies.push(message.body);
			}
			for (const body of bodies) {
				message.body = body.trim();
				message.args = message.body.split(/ +/g);
				message.cmd = message.body.toLowerCase().split(" ")[0].trim() || "";
				message.query = message.args.slice(1).join(" ").trim();
				const correctedCommand = [];
				if (OPTIONS.autoCorrect) {
					for (const cmd of Array.from(cmds.commands.keys())) {
						const correcting = similarity(message.args[0], cmd);
						if (correcting >= Math.min(0.6)) {
							correctedCommand.push({
								score: correcting,
								command: cmd,
							});
						}
					}
					for (const aliases of cmds.aliases) {
						const correcting = similarity(message.args[0], aliases);
						if (correcting >= Math.min(0.67)) {
							correctedCommand.push({
								score: correcting,
								command: aliases,
							});
						}
					}
				}
				if (correctedCommand.length != 0) {
					const HIGH_SCORE = correctedCommand.find(
						(x) =>
							Math.max.apply(
								null,
								correctedCommand.map((x) => x.score),
							) == x.score,
					);
					message.cmd = message.prefix + HIGH_SCORE.command.toLowerCase().split(" ")[0].trim() || "";
				}
				const Tempcmds =
					cmds.commands.get(message.cmd.slice(1).trim().toLowerCase()) ||
					Array.from(cmds.commands.values()).find((v) => v.aliases.includes(message.cmd.slice(1).trim().toLowerCase())) ||
					Array.from(cmds.commands.values()).find((v) => v.aliases.includes(message.cmd.trim().toLowerCase())) ||
					false;
				if (message.isGroup && !OPTIONS.noLogs) {
					INFOLOG(
						`[${color(time, "cyan")}]`,
						`${color(message.pushname.trim(), "white")} ${color(message.prettyNumber, "#ff71ce")} :`,
						`${color(message.prefix, "white")}${color(Tempcmds.name || message.cmd.slice(1).trim(), "#01cdfe")}`,
						`${color(message.query.substr(0, 20), "#05ffa1")}`,
						`${color(message.from, "#b967ff")}`,
						`${color("type", "#ff71ce")} : ${color(message.type, "#b967ff")}`,
						`${color(runtimes, "#f18f15")}${color(`s`, "#f5e700")}`,
					);
				} else if (!message.isGroup && !OPTIONS.noLogs) {
					INFOLOG(
						`[${color(time, "cyan")}]`,
						`${color(message.pushname.trim(), "white")} ${color(message.prettyNumber, "#ff71ce")} :`,
						`${color(message.prefix, "white")}${color(Tempcmds.name || message.cmd.slice(1).trim(), "#01cdfe")}`,
						`${color(message.query.trim().substr(0, 20), "#05ffa1")}`,
						`${color("type", "#ff71ce")} : ${color(message.type, "#b967ff")}`,
						`${color(runtimes, "#f18f15")}${color(`s`, "#f5e700")}`,
					);
				}
				if (Tempcmds && !message.isOwner) {
					if (OPTIONS.selfMode) {
						return;
					}
					if (OPTIONS.restrict && Tempcmds.restrict) {
						await client[botNum].reply({ from: message.from, quoted: message.message }, "This command is restricted and currently bot are on restricted mode.");
						continue;
					}
					const limit = addLimit({ id: message.sender, limit: Tempcmds.limit ?? 0, type: "MIN" });
					if (typeof limit == "object" && "message" in limit) {
						client[botNum].reply(
							{ from: message.from, quoted: message.message },
							`${limit.message}\nYour limit is ${limit.limits}\nBut this command (${Tempcmds.name}) need ${Tempcmds.limit}`,
						);
						continue;
					}
					if (limit == false) {
						return await client[botNum].reply({ from: message.from, quoted: message.message }, "You have reached the limit of this command.");
					}
					if (OPTIONS.coolDown) {
						if (user.cooldown.has(message.sender) && user.cooldown.get(message.sender).requests) {
							return await client[botNum].reply({ from: message.from, quoted: message.message }, `Please wait until your request is done`);
						}
						if (user.cooldown.has(message.sender) && user.cooldown.get(message.sender).has(Tempcmds.name)) {
							const time = user.cooldown.get(message.sender).get(Tempcmds.name);
							if (Date.now() > time) {
								user.cooldown.get(message.sender).delete(Tempcmds.name);
								user.cooldown.get(message.sender).requests = false;
							} else {
								return await client[botNum].reply(
									{ from: message.from, quoted: message.message },
									`${Tempcmds.name} is on cooldown for ${((time - Date.now()) / 1000).toFixed(1)} seconds.`,
								);
							}
						}
						if (!user.cooldown.has(message.sender)) {
							user.cooldown.set(message.sender, new Map());
						}
						if (!user.cooldown.get(message.sender).has(Tempcmds.name)) {
							user.cooldown.get(message.sender).set(Tempcmds.name, Date.now() + Tempcmds.cooldown * 1000);
						}
						user.cooldown.get(message.sender).get(Tempcmds.name);
						user.cooldown.get(message.sender).requests = true;
					}
				}
				if (Tempcmds) {
					if (OPTIONS.onlyLogs ? (message.cmd.startsWith("==>") || message.cmd.startsWith("//>") || message.cmd.startsWith("$$>") ? true : false) : true) {
						if (!message.isOwner && OPTIONS.selfMode) {
							return;
						}
						try {
							if (/-{1,2}((help(s)?|info|des(c|k)rip(t|s)i(on)?)|H)$/i.test(message.args[1]) && Tempcmds.name !== "eval") {
								const help = `Description : ${Tempcmds.description}\nUsage : ${Tempcmds.usage}\nCooldown : ${Tempcmds.cooldown}s\nAliases : ${Tempcmds.aliases
									.map((v) => `!${v.capitalize()}`)
									.join(", ")}.`;
								client[botNum].reply({ from: message.from, quoted: message.message }, help);
								continue;
							}
							if (Tempcmds.category == "Games" && message.isGroup && !message.isAdmin && !message.isOwner && message[message.from].games == "disable") {
								return await client[botNum].reply({ from: message.from, quoted: message.message }, "Game Mode is Disabled. Type !games enable to enable Game Mode");
							}
							if (Tempcmds.category == "Moderation" && message.isGroup && !message.isAdmin && !message.isOwner) {
								return await client[botNum].reply({ from: message.from, quoted: message.message }, "You are not Admin");
							}
							await Tempcmds.run(message, client, store);
							if (user.cooldown.has(message.sender) && user.cooldown.get(message.sender).requests) {
								user.cooldown.get(message.sender).requests = false;
							}
							await delay(300);
						} catch (err) {
							if (user.cooldown.has(message.sender) && user.cooldown.get(message.sender).requests) {
								user.cooldown.get(message.sender).requests = false;
							}
							let str = "Something went wrong.\nPlease send this error stack to the owner :\n\n";
							str += `Type : ${err.name}\n`;
							str += `Message : ${err.message}\n`;
							str += `Stack Trace : ${err.stack.substr(0, 20)}...`;
							await client[botNum].sendMessage(message.from, {
								text: str,
								footer: "Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪",
								templateButtons: [
									{ urlButton: { displayText: "Copy Stack Trace", url: `https://www.whatsapp.com/otp/copy/${err.stack}` } },
									{
										urlButton: { displayText: "Report to Owner", url: `https://wa.me/${message.settings.owner_number}?text=hi,%20bot%20mengalami%20error${encodeURI(`\n\n${err.stack}`)}` },
									},
									{ quickReplyButton: { displayText: "Report via Bot", id: `.report ${err.stack}` } },
								],
								headerType: 1,
							});
							log(err);
						}
					}
				}
			}
			return;
		}
		if (!message.isGroup && !OPTIONS.noLogs) {
			INFOLOG(
				`[${color(time, "cyan")}]`,
				`${color(message.pushname.trim(), "white")} ${color(message.prettyNumber, "#ff71ce")} :`,
				`${color(message.body?.trim()?.replace("\n", "")?.substr(0, 20), "#05ffa1")}`,
				`${color("type", "#ff71ce")} : ${color(message.type, "#b967ff")}`,
				`${color(runtimes, "#f18f15")}${color(`s`, "#f5e700")}`,
			);
		} else if (message.isGroup && !OPTIONS.noLogs) {
			INFOLOG(
				`[${color(time, "cyan")}]`,
				`${color(message.pushname.trim(), "white")} ${color(message.prettyNumber, "#ff71ce")} :`,
				`${color(message.body?.trim()?.replace("\n", "")?.substr(0, 20), "#05ffa1")}`,
				`${color(message.from, "#b967ff")}`,
				`${color("type", "#ff71ce")} : ${color(message.type, "#b967ff")}`,
				`${color(runtimes, "#f18f15")}${color(`s`, "#f5e700")}`,
			);
		}
		(await import("../Game Handlers/akinator.js")).default.handler(message, client, message);
		(await import("../Game Handlers/tebakGambar.js")).default.handler(message, client, message);
		(await import("../Game Handlers/sambungKata.js")).default.handler(message, client, message);
		(await import("../Game Handlers/wordle.js")).default.handler(message, client, message);
		(await import("./anonymousMessage.js")).default.handler(message, client);
		(await import("../Misc/groupURL.js")).default.handler(message, client);
		(await import("../Misc/antiNSFW.js")).default.handler(message, client, message);
	},
};
