import dotenv from "dotenv";
dotenv.config();
console.clear();
import { spawn } from "child_process";
await printRandomAscii();

import fs from "fs";
import baileys from "@adiwajshing/baileys";
import P from "pino";
import meow from "meow";
import * as Discord from "@discordjs/collection";
import { Boom } from "@hapi/boom";
import Spinnies from "spinnies";
import path from "path";
import { EventEmitter } from "events";
import center from "center-align";
import { getSpinner } from "./Helper/Misc/spinners.js";
import { readJSON, INFOLOG, color, romanize, ERRLOG } from "./Helper/Modules/functions.js";
EventEmitter.prototype.setMaxListeners(0);

const { default: makeWASocket, DisconnectReason, makeInMemoryStore, useSingleFileAuthState, DEFAULT_CONNECTION_CONFIG } = baileys;
const { state, saveState } = useSingleFileAuthState("./Session/Session-debug.json");
const moduleURL = new URL(import.meta.url);
export const __dirname = path.dirname(moduleURL.pathname);
const { stdout } = process;
global.commandsPath = [];
global.cmds = {};
global.user = {};
global.presences = {};
global.functions = {};
user.cooldown = new Discord.Collection();
cmds.commands = new Discord.Collection();
cmds.aliases = [];

const spinners = new Spinnies({ color: "blue", succeedColor: "green", failColor: "redBright", spinner: getSpinner("dots") });
const addSpinner = (name, options) => spinners.add(name, options);
const successSpinner = (name, options) => spinners.succeed(name, options);
const failSpinner = (name, options) => spinners.fail(name, options);

const cli = parseCli();
global.OPTIONS = cli.flags;
const regexOption = ["prefix", "readOnly", "autoRead", "autoCorrect", "restrict", "onlyLogs", "noLogs", "selfMode", "debugMode", "multiCmd", "rainbow", "trace", "help", "watch"];

const store = makeInMemoryStore({ logger: P().child({ level: "fatal", stream: "store" }) });

export const runtime = Date.now();

for (const option of Object.keys(OPTIONS).filter((key) => OPTIONS[key] == true)) if (!regexOption.includes(option)) ERRLOG(` ${color(option, "red")} ${color("is not a valid option", "white")}`);

const start = async () => {
	if (OPTIONS.help) return console.log(cli.help);
	await loadCommands();
	await loadEveryCommand();

	const Client = makeWASocket({ printQRInTerminal: true, version: DEFAULT_CONNECTION_CONFIG.version, logger: P({ level: "fatal" }), auth: state });
	store.bind(Client.ev);

	Client.ev.on("connection.update", (connections) => {
		const { lastDisconnect, qr, connection } = connections;
		const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
		if (connection == "connecting") addSpinner("Connecting", { text: "Connecting to WASocket..." });
		if (connection == "close") {
			if (reason == DisconnectReason.badSession) console.log("Bad session, Please delete your previous session and do a rescan...");
			else if (reason == DisconnectReason.connectionClose) console.log("Connection closed, Quick reconnecting...");
			else if (reason == DisconnectReason.connectionLose) console.log("Connection lost, Quick reconnecting...");
			else if (reason == DisconnectReason.connectionReplaced) console.log("Connection replaced, Quick reconnecting...");
			else if (reason == DisconnectReason.loggedOut) console.log("Logged out, Please delete your previous session and do a rescan...");
			else {
				if (reason == DisconnectReason.restartRequired) console.log("Restart required, Restarting your WebScoket...");
				else if (reason == DisconnectReason.timedOut) console.log("Timed out, Quick reconnecting...");
				else console.log("Unknown reason, Quick reconnecting...");
				start().catch((e) => console.log(e));
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
		message = store.messages[message[0].key.remoteJid].get(message[0].key.id);
		Handler(client, message, store);
	});
};
start().catch((e) => console.log(e));

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
			const cmd = (await import(path.join(__dirname, command))).default;
			if (OPTIONS.watch) await watchFile(path.join(__dirname, command), cmd.name);
			cmds.commands.set(cmd.name, { ...cmd, pathname: path.join(__dirname, command) });
			commandsPath.push(path.join(__dirname, command));
		} catch (e) {
			ERRLOG(`${color(command, "red")} ${color("is causing error. Please check the file before running.", "white")}`);
		}
	}
	successSpinner("commands", { text: `Loaded ${cmds.commands.size} commands` });
	if (OPTIONS.watch) successSpinner("watch", { text: `Watched ${cmds.commands.size} commands` });
}

async function loadEveryCommand() {
	for (const command of cmds.commands) {
		for (const aliases of command[1].aliases) {
			cmds.aliases.push(aliases);
		}
	}
}

async function watchFile(module) {
	fs.watchFile(module, async (event, filename) => {
		if (fs.existsSync(module)) {
			INFOLOG(color(`${module.split("/").reverse()[0]} has been changed`, "#9f53ea"));
			await reloadModule(module, false);
		} else {
			await reloadModule(module, true);
		}
	});
}

async function reloadModule(module, isNewFile) {
	if (isNewFile) {
		try {
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
				return ERRLOG(color(`${module.split("/").reverse()[0]} is deleted`, "red"));
			} finally {
				INFOLOG(color(`${module.split("/").reverse()[0]} has been renamed to ${afterCommands.split("/").reverse()[0]}`, "#9f53ea"));
			}
		} catch (e) {
			console.log(e);
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
		console.log(e);
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
	  --help, -h         Show this message.

	Examples
	  $ node . --read_only -tr
`;
}
