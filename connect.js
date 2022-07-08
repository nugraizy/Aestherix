import dotenv from "dotenv";
dotenv.config();
console.clear();
import { spawn } from "child_process";
await printRandomAscii();

import fs from "fs";
import { pathToFileURL } from "url";
import baileys from "@adiwajshing/baileys";
import P from "pino";
import meow from "meow";
import { Boom } from "@hapi/boom";
import Spinnies from "spinnies";
import path from "path";
import { EventEmitter } from "events";
import center from "center-align";
import moment from "moment-timezone";
import { platform } from "process";
import { getSpinner } from "./Helper/Misc/Spinner/spinners.js";
import { readJSON, INFOLOG, color, romanize, ERRLOG } from "./Helper/Modules/functions.js";
EventEmitter.prototype.setMaxListeners(0);

const { default: makeWASocket, DisconnectReason, makeInMemoryStore, useSingleFileAuthState, DEFAULT_CONNECTION_CONFIG } = baileys;
const { state, saveState } = useSingleFileAuthState("./Session/Session-debug.json");
const moduleURL = new URL(import.meta.url);
export const __dirname = platform == "win32" ? path.dirname(moduleURL.pathname).slice(1) : path.dirname(moduleURL.pathname);
const { stdout } = process;
global.cmds = {};
global.user = {};
global.presences = {};
global.functions = {};
global.games = {};
global.intervals = {};
global.anonymous = new Map();
intervals.tebakGambar = new Map();
intervals.sudoku = new Map();
intervals.url = new Map();
intervals.anonymous = new Map();
games.tebakGambar = new Map();
games.sudoku = new Map();
games.akinator = new Map();
games.tictactoe = new Map();
user.cooldown = new Map();
cmds.commands = new Map();
user.afk = new Map();
global.commandsPath = [];
cmds.aliases = [];
global.log = console.log;

const spinners = new Spinnies({ color: "blue", succeedColor: "green", failColor: "redBright", spinner: getSpinner("dots") });
const addSpinner = (name, options) => spinners.add(name, options);
const successSpinner = (name, options) => spinners.succeed(name, options);
const failSpinner = (name, options) => spinners.fail(name, options);

const cli = parseCli();
global.OPTIONS = cli.flags;
const regexOption = ["prefix", "readOnly", "autoRead", "autoCorrect", "restrict", "onlyLogs", "noLogs", "selfMode", "debugMode", "multiCmd", "rainbow", "trace", "help", "watch", "coolDown"];

const store = makeInMemoryStore({ logger: P().child({ level: "fatal", stream: "store" }) });

export const runtime = Date.now();

for (const option of Object.keys(OPTIONS).filter((key) => OPTIONS[key] == true)) if (!regexOption.includes(option)) ERRLOG(` ${color(option, "red")} ${color("is not a valid option", "white")}`);

const start = async () => {
	if (OPTIONS.help) return log(cli.help);
	await loadCommands();
	await loadEveryCommand();

	const Client = makeWASocket({ printQRInTerminal: true, version: DEFAULT_CONNECTION_CONFIG.version, logger: P({ level: "fatal" }), auth: state });
	store.bind(Client.ev);

	Client.ev.on("connection.update", async (connections) => {
		const { lastDisconnect, qr, connection } = connections;
		if (connection == "connecting") addSpinner("Connecting", { text: "Connecting to WASocket..." });
		if (connection == "close") {
			const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
			if (reason == DisconnectReason.badSession) log("Bad session, Please delete your previous session and do a rescan...");
			else if (reason == DisconnectReason.connectionLost) log("Connection lost, Quick reconnecting...");
			else if (reason == DisconnectReason.connectionReplaced) log("Connection replaced, Quick reconnecting...");
			else if (reason == DisconnectReason.loggedOut) log("Logged out, Please delete your previous session and do a rescan...");
			else {
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
			INFOLOG(color(center(`λ ʙᴏᴛ  ᴠᴇʀꜱɪᴏɴ  ${romanize(readJSON("./package.json").version)}\n\n`, stdout.columns), "#9f53ea"));
		}
	});

	Client.ev.on("messages.upsert", async (message) => {
		const Handler = (await import("./Handlers/Messages Event/incomingMessage.js")).default.handler;
		Handler(message, client, cmds, store, user);
	});

	Client.ev.on("auth-state.update", () => saveState);

	Client.ev.on("messages.update", async (message) => {
		const Handler = (await import("./Handlers/Messages Event/deletedMessage.js")).default.handler;
		message = store.messages[message[0].key.remoteJid]?.get(message[0].key.id);
		Handler(client, message, store);
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
};
start().catch((e) => log(e));

function loadFiles(dir) {
	let files = [];
	const list = fs.readdirSync(dir);
	for (const file of list) {
		const path = `${dir}/${file}`;
		const stat = fs.statSync(path);
		if (stat && stat.isDirectory()) {
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
			if (OPTIONS.watch) await watchFile(path.join(__dirname, command), cmd.name);
			cmds.commands.set(cmd.name, { ...cmd, pathname: path.join(__dirname, command) });
			commandsPath.push(path.join(__dirname, command));
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
			const afterCommands = commands.filter((v) => commandsPath.indexOf(path.join(__dirname, v)) < 0)[0];
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
	  --prefix, -p       Set your custom prefix
	  --read_only, -y    Read only
	  --auto_read, -r    Auto read every incoming message
	  --restrict, -e     Restrict every moderator commands
	  --only_logs, -o    Only showing logs but will ignore every message and commands
	  --no_logs, -n      Not showing any logs in the meantime still respond for any commands
	  --self_mode, -s    Set self mode that only owner and the bot can use
	  --debug_mode, -g   Show every metadata of any message
	  --multi_cmd, -m    Loop every command on your script. Use | to seperate each commands
	  --rainbow, -b      make your logs rainbow colors
	  --trace, -t        Show errors
	  --watch, -w        Watch every file on your script and reload it when it changed
	  --cool_down, -c    Set cool down for every command
	  --help, -h         Show this message.

	Examples
	  $ node . --read_only -tr
`;
}
