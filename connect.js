/**
 *   @BANNER  |  @BANNER  |  @BANNER  |  @BANNER  |  @BANNER  |  @BANNER  |  @BANNER  |  @BANNER  |
 *   @BANNER [ INFO ] this is a work done by @NANDA, coded by several people as team.
 *   @BANNER [ INFO ] this project starts at the beginning of 2022 by @NANDA. coded by our team since February 9, 2022.
 *   @BANNER [ INFO ] please do not remove this banner of information.
 */

/**
 *   @AUTHOR  |  @AUTHOR  |  @AUTHOR  |  @AUTHOR  |  @AUTHOR  |  @AUTHOR  |  @AUTHOR  |  @AUTHOR  |
 *   @NANDA         [ @GitHub ] https://github.com/nugraizy      [ @Instagram ] https://instagram.com/ngrdzy_
 *   @MRHRTZ        [ @GitHub ] https://github.com/MRHRTZ        [ @Instagram ] https://instagram.com/hanif_az.sq.62
 *   @Alphanum404   [ @GitHub ] https://github.com/Alphanum404   [ @Instagram ] https://instagram.com/aldiflynns
 *   @TobyG74       [ @GitHub ] https://github.com/TobyG74       [ @Instagram ] https://instagram.com/ini.tobz
 *   @Nafiz         [ @GitHub ] https://github.com/xbnfz01       [ @Instagram ] https://instagram.com/nfz.01
 */

import baileys, { jidDecode } from "@adiwajshing/baileys";
import { Boom } from "@hapi/boom";
import center from "center-align";
import { spawn } from "child_process";
import fs from "fs";
import meow from "meow";
import moment from "moment-timezone";
import mqtt from "mqtt";
import path from "path";
import P from "pino";
import { platform } from "process";
import Spinnies from "spinnies";
import { pathToFileURL } from "url";
import { getSpinner } from "./Helper/Misc/Spinner/spinners.js";
import { color, ERRLOG, INFOLOG, readJSON, romanize } from "./Helper/Modules/functions.js";
import { createExif } from "./Utils/Misc/createExif.js";
console.clear();

const { default: makeWASocket, DisconnectReason, makeInMemoryStore, useSingleFileAuthState, DEFAULT_CONNECTION_CONFIG } = baileys;
const moduleURL = new URL(import.meta.url);
export const __dirname = platform == "win32" ? path.dirname(moduleURL.pathname).slice(1) : path.dirname(moduleURL.pathname);
const { stdout } = process;

const spinners = new Spinnies({ color: "blue", succeedColor: "green", failColor: "redBright", spinner: getSpinner("dots") });

global.cli = parseCli();
global.OPTIONS = cli.flags;
const regexOption = [
	"prefix",
	"readOnly",
	"autoRead",
	"autoCorrect",
	"restrict",
	"onlyLogs",
	"noLogs",
	"selfMode",
	"debugMode",
	"multiCmd",
	"rainbow",
	"trace",
	"help",
	"watch",
	"coolDown",
	"noLoad",
	"json",
	"reset",
	"story",
	"offline",
	"noCall",
];
if (platform !== "win32" && !OPTIONS.noLoad) await printRandomAscii();
if (OPTIONS.reset) {
	const sessionName = `${cli.input[0] ?? "Session-debug"}`;
	if (fs.existsSync(`./Session/${sessionName}.json`)) fs.unlinkSync(`./Session/${sessionName}.json`);
	if (fs.existsSync(`./Media Files/Connection Databases/${sessionName}.json`)) fs.unlinkSync(`./Media Files/Connection Databases/${sessionName}.json`);
}

const { state, saveState } = useSingleFileAuthState(`./Session/${cli.input[0] ?? "Session-debug"}.json`);
const store = makeInMemoryStore({ logger: P().child({ level: "fatal", stream: "store" }) });
if (OPTIONS.json) {
	if (!fs.existsSync("./Media Files/Connection Databases/")) fs.mkdirSync("./Media Files/Connection Databases/");
	store.readFromFile(`./Media Files/Connection Databases/${cli.input[0] ?? "Session-debug"}.json`);
	setInterval(() => {
		store.writeToFile(`./Media Files/Connection Databases/${cli.input[0] ?? "Session-debug"}.json`);
	}, 2 * 1000);
}

export const runtime = Date.now();

for (const option of Object.keys(OPTIONS).filter((key) => OPTIONS[key] == true))
	if (!regexOption.includes(option)) ERRLOG(` ${color(option, "red")} ${color("is not a valid option", "white")}`);

const addSpinner = (name, options) => {
	if (!OPTIONS.noLoad) {
		spinners.add(name, options);
	}
};
const successSpinner = (name, options) => {
	if (!OPTIONS.noLoad) {
		spinners.succeed(name, options);
	}
};
const failSpinner = (name, options) => {
	if (!OPTIONS.noLoad) {
		spinners.fail(name, options);
	}
};

const clientMqttListen = mqtt.connect(process.env.MQTT_URL);
clientMqttListen.on("connect", () => {
	clientMqttListen.subscribe(process.env.MQTT_TOPIC, async (err) => {});
});

Number.prototype.toTime = function () {
	const minutes = Math.floor(this / 60_000);
	const seconds = ((this % 60_000) / 1000).toFixed(0);
	return seconds == 60 ? `${minutes + 1}:00` : `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

const start = async () => {
	if (OPTIONS.help) {
		log(cli.help);
		process.exit(0);
	}
	await loadCommands();
	await loadEveryCommand();
	createExif("Made by Nanda", "Void bot");
	const CONNECTION_CONFIG = {
		printQRInTerminal: true,
		version: DEFAULT_CONNECTION_CONFIG.version,
		logger: P({ level: OPTIONS.trace ? "trace" : "fatal" }),
		auth: state,
		markOnlineOnConnect: false,
		syncFullHistory: true,
	};
	const Client = makeWASocket(CONNECTION_CONFIG);
	store.bind(Client.ev);

	Client.ev.on("connection.update", async (connections) => {
		const { lastDisconnect, connection } = connections;
		if (connection == "connecting") addSpinner("Connecting", { text: "Connecting to WASocket..." });
		if (connection == "close") {
			const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
			if (reason == DisconnectReason.badSession) {
				log("Bad session, Please delete your previous session and do a rescan...");
				process.exit(0);
			} else if (reason == DisconnectReason.connectionLost) log("Connection lost, Quick reconnecting...");
			else if (reason == DisconnectReason.connectionReplaced) log("Connection replaced, Quick reconnecting...");
			else if (reason == DisconnectReason.loggedOut) {
				log("Logged out, Please delete your previous session and do a rescan...");
				process.exit(0);
			} else {
				if (reason == DisconnectReason.restartRequired) log("Restart required, Restarting your WebScoket...");
				else if (reason == DisconnectReason.timedOut) log("Timed out, Quick reconnecting...");
				else if (reason == DisconnectReason.connectionClosed) log("Connection closed, Quick reconnecting...");
				else log("Unknown reason, Quick reconnecting...");
				await start().catch((e) => log(e));
			}
		} else if (connection == "open") {
			global.client = {};
			global.botNum = Client.user.id;
			client[Client.user.id] = Client;
			successSpinner("Connecting", { text: "Connected to WASocket" });
			INFOLOG(color(center(`Bot Version  ${romanize(readJSON("./package.json").version)}\n\n`, stdout.columns), "#9f53ea"));
		}
	});

	Client.ev.on("messages.upsert", async (message) => {
		const Handler = (await import("./Handlers/Messages Event/incomingMessage.js")).default.handler;
		Handler(message, client, cmds, store, user);
	});

	Client.ev.on("auth-state.update", saveState);

	Client.ev.on("creds.update", saveState);

	Client.ev.on("messages.update", async (message) => {
		if (message?.[0]?.update?.status == 4 || message?.[0]?.update?.status == 3) return;
		const Handler = (await import("./Handlers/Messages Event/deletedMessage.js")).default.handler;
		message = store.messages[message[0].key.remoteJid]?.get(message[0].key.id);
		Handler(client, message, false, store);
	});

	Client.ev.on("presence.update", async (presence) => {
		const from = presence.id;
		const participant = Object.keys(presence.presences)[0];
		const presences = presence.presences[participant].lastKnownPresence;
		if (presences == "composing") {
			const Handler = (await import("./Handlers/Message Presence/composing.js")).default.handler;
			Handler(client, from, participant);
		}
	});

	Client.ev.on("call", async ([{ isGroup, status, id, from }]) => {
		if (OPTIONS.noCall && !isGroup && status == "offer") {
			const { user, server } = jidDecode(botNum);
			await client[botNum].sendNode({
				tag: "call",
				attrs: {
					from: `${user}@${server}`,
					to: from,
					id: client[botNum].generateMessageTag(),
				},
				content: [
					{
						tag: "reject",
						attrs: {
							"call-id": id,
							"call-creator": from,
							count: "512202",
						},
						content: null,
					},
				],
			});
			await client[botNum].updateBlockStatus(from, "block");
		}
	});

	Client.ev.on("group.participants.update", async (message) => {
		const Handler = (await import("./Handlers/Notification Handlers/participantsNotification.js")).default.handler;
		Handler(client, message, store);
	});

	Client.ev.on("group.settings.update", async (message) => {
		const Handler = (await import("./Handlers/Notification Handlers/groupSettingsNotification.js")).default.handler;
		Handler(client, message, store);
	});

	Client.ws.on("CB:notification,type:w:gp2", (update) => {
		if (update?.content?.[0].tag !== "description" && update?.content?.[0].tag !== "invite") return;
		const from = update?.attrs?.from || update?.content?.[0]?.attrs?.author;
		const name = update?.attrs?.notify;
		const action = update?.attrs?.content?.[0]?.tag || update?.content?.[0].tag;
		const content = update?.content?.[0]?.content?.[0]?.content?.toString() || update?.content?.[0]?.attrs.code || "";
		const participant = update?.attrs?.participant;
		client[botNum].ev.emit("group.settings.update", { from, name, action, participant, content });
	});

	Client.ws.on("CB:notification,type:picture", async (update) => {
		const from = update?.attrs?.from || update?.content?.[0]?.attrs?.author;
		const name = update?.attrs?.notify;
		const action = update?.content?.[0]?.tag;
		const participant = update?.content?.[0]?.attrs?.author;
		const content = action == "delete" ? null : await client[botNum].profilePictureUrl(from, "image").catch((e) => null);
		if (from.endsWith("@g.us")) client[botNum].ev.emit("group.settings.update", { from, name, action, participant, content });
		else client[botNum].ev.emit("profile.update", { from, name, action, participant, content });
	});

	Client.ev.on("contacts.update", () => {});

	clientMqttListen.on("message", async (topic, message) => {
		message = message.toString();
		const data = JSON.parse(message);
		if (!data.status) return;
		const content = `Spotify On ${data.is_playing ? "Play" : "Paused"} :                                                       ${data.artists} - ${
			data.trackTitle
		}  ( ${data.progress_ms.toTime()}${` - ${data?.duration_ms.toTime()}` ?? ""} )`;
		const myStatus = await client[botNum].fetchStatus(`${botNum.split(":")[0]}@s.whatsapp.net`);
		if (myStatus.status == content) return;
		await client[botNum].query({
			tag: "iq",
			attrs: { to: "@s.whatsapp.net", type: "set", xmlns: "status" },
			content: [{ tag: "status", attrs: {}, content: Buffer.from(content, "utf-8") }],
		});
	});
};
start().catch((e) => log(e));

function loadFiles(dir) {
	let files = [];
	const list = fs.readdirSync(dir);
	for (const file of list) {
		const path = `${dir}/${file}`;
		const stat = fs.statSync(path);
		if (stat?.isDirectory()) {
			files = files.concat(loadFiles(path));
		} else {
			files.push(path);
		}
	}
	return files;
}

async function loadCommands() {
	addSpinner("files", { text: "Loading Files..." });
	const commands = loadFiles("./Commands");
	successSpinner("files", { text: `Loaded ${commands.length} files` });
	addSpinner("commands", { text: "Loading Commands..." });
	if (OPTIONS.watch) addSpinner("watch", { text: "Watching for changes..." });
	for (const command of commands) {
		try {
			const cmd = (await import(pathToFileURL(path.join(__dirname, command)))).default;
			if (cmd.status != "disable") {
				if (OPTIONS.watch) await watchFile(path.join(__dirname, command), cmd.name);
				cmds.commands.set(cmd.name, { ...cmd, pathname: path.join(__dirname, command) });
				commandsPath.push(path.join(__dirname, command));
			}
		} catch (e) {
			log(e);
			ERRLOG(`${color(command, "red")} ${color("is causing error. Please check the file before running.", "white")}`);
		}
	}
	successSpinner("commands", { text: `Loaded ${cmds.commands.size} commands` });
	if (OPTIONS.watch) successSpinner("watch", { text: `Watched ${cmds.commands.size} commands` });
}

async function loadEveryCommand() {
	for (const command of cmds.commands) for (const aliases of command[1].aliases) cmds.aliases.push(aliases);
}

async function watchFile(module) {
	fs.watchFile(module, async (event, filename) => {
		const time = moment().format("HH:mm:ss DD/MM");
		if (fs.existsSync(module)) {
			INFOLOG(`[${color(time, "cyan")}]`, color(`${module.split("/").reverse()[0]} has been changed`, "#9f53ea"));
			await reloadModule(module, false);
		} else {
			await reloadModule(module, true);
		}
	});
}

async function reloadModule(module, isNewFile) {
	if (isNewFile) {
		try {
			const time = moment().format("HH:mm:ss DD/MM");
			const commands = loadFiles("./Commands");
			const afterCommands = commands.filter((v) => !commandsPath.includes(path.join(__dirname, v)))[0];
			try {
				commandsPath.push(path.join(__dirname, afterCommands));
				commandsPath.splice(commandsPath.indexOf(module), 1);
				const cmd = (await import(path.join(__dirname, afterCommands))).default;
				cmds.commands.set(cmd.name, cmd);
				watchFile(path.join(__dirname, afterCommands), cmd.name);
			} catch (e) {
				commandsPath.splice(commandsPath.indexOf(module), 1);
				cmds.commands.delete(Array.from(cmds.commands.values()).find((v) => v.pathname == module).name);
				fs.unwatchFile(module);
				return ERRLOG(`[${color(time, "cyan")}]`, color(`${module.split("/").reverse()[0]} is deleted`, "red"));
			} finally {
				INFOLOG(`[${color(time, "cyan")}]`, color(`${module.split("/").reverse()[0]} has been renamed to ${afterCommands.split("/").reverse()[0]}`, "#9f53ea"));
			}
		} catch (e) {
			log(e);
		}
		return;
	}
	try {
		fs.unwatchFile(module);
		const cmd = (await nocache(module)).default;
		cmds.commands.delete(cmd.name);
		cmds.commands.set(cmd.name, cmd);
		watchFile(module);
	} catch (e) {
		log(e);
	}
}

const nocache = async (module) => {
	const tempModules = `${module}?update=${Date.now()}`;
	return await import(tempModules);
};

function parseCli() {
	return meow(help(), {
		importMeta: import.meta,
		flags: {
			read_only: { type: "boolean", alias: "y" },
			auto_read: { type: "boolean", alias: "r" },
			restrict: { type: "boolean", alias: "e" },
			only_logs: { type: "boolean", alias: "o" },
			no_logs: { type: "boolean", alias: "n" },
			self_mode: { type: "boolean", alias: "s" },
			debug_mode: { type: "boolean", alias: "g" },
			multi_cmd: { type: "boolean", alias: "m" },
			rainbow: { type: "boolean", alias: "b" },
			trace: { type: "boolean", alias: "t" },
			help: { type: "boolean", alias: "h" },
			prefix: { type: "string", alias: "p" },
			watch: { type: "boolean", alias: "w" },
			cool_down: { type: "boolean", alias: "c" },
			auto_correct: { type: "boolean", alias: "a" },
			no_load: { type: "boolean", alias: "v" },
			json: { type: "boolean", alias: "j" },
			reset: { type: "boolean", alias: "k" },
			story: { type: "boolean", alias: "q" },
			offline: { type: "boolean", alias: "f" },
			no_call: { type: "boolean", alias: "d" },
		},
	});
}

async function printRandomAscii() {
	const randomAscii = fs.readdirSync("./Helper/Ascii/");
	spawn("bash", [`./Helper/Ascii/${randomAscii[Math.floor(Math.random() * randomAscii.length)]}`], {
		stdio: "inherit",
	});
}

function help() {
	return `
	Usage
	  $ node . <session> <options>

	Options
	  --prefix, -p         Set your custom prefix
	  --read_only, -y      Read only
	  --auto_read, -r      Auto read every incoming message
	  --restrict, -e       Restrict every moderator commands
	  --only_logs, -o      Only showing logs but will ignore every message and commands
	  --no_logs, -n        Not showing any logs in the meantime still respond for any commands
	  --self_mode, -s      Set self mode that only owner and the bot can use
	  --debug_mode, -g     Show every metadata of any message
	  --multi_cmd, -m      Loop every command on your script. Use | to seperate each commands
	  --rainbow, -b        make your logs rainbow colors
	  --trace, -t          Show errors
	  --watch, -w          Watch every file on your script and reload it when it changed
	  --cool_down, -c      Set cool down for every command
	  --auto_correct, -a   Enable a
	  --no_load, -v        Disable module load animation
	  --json, -j           Use JSON DB to store data of the WhatsApp connection
	  --reset, -k          Reset your WhatsApp connection session, and restart the script
	  --story, q           Auto download people story after the bot received the story
	  --offline, -f        Set your current presence to offline
	  --no_call, -d        Reject incoming call.
	  --help, -h           Show this message.

	Examples
	  $ node . --read_only -tr
`;
}
