import dotenv from "dotenv";
dotenv.config();
console.clear();
import { spawn } from "child_process";
printRandomAscii();

import fs from "fs";
import baileys from "@adiwajshing/baileys";
import P from "pino";
import meow from "meow";
import * as Discord from "@discordjs/collection";
import { Boom } from "@hapi/boom";
import Spinnies from "spinnies";
import { getSpinner } from "./Helper/Misc/spinners.js";

const { default: makeWASocket, DisconnectReason, delay, BufferJSON, makeInMemoryStore, AnyMessageContent, useSingleFileAuthState, DEFAULT_CONNECTION_CONFIG } = baileys;
const { state, saveState } = useSingleFileAuthState("./session/Session-debug.json");
const CMD = {};
CMD.commands = new Discord.Collection();
CMD.aliases = [];

const spinners = new Spinnies({ color: "blue", succeedColor: "green", failColor: "redBright", spinner: getSpinner("aesthetic") });
const addSpinner = (name, options) => spinners.add(name, options);
const successSpinner = (name, options) => spinners.succeed(name, options);
const failSpinner = (name, options) => spinners.fail(name, options);

const cli = parseCli();

global.OPTIONS = cli.flags;
const regexOption = ["prefix", "readOnly", "autoRead", "autoCorrect", "restrict", "onlyLogs", "noLogs", "selfMode", "debugMode", "multiCmd", "rainbow", "trace", "help"];

const start = async () => {
	if (OPTIONS.help) return console.log(cli.help);
	await loadCommands();
	await loadEveryCommand();
	successSpinner("commands", { text: `Loaded ${CMD.commands.size} commands` });

	const Client = makeWASocket({ printQRInTerminal: true, version: DEFAULT_CONNECTION_CONFIG.version, logger: P({ level: "fatal" }), auth: state });

	Client.ev.on("connection.update", (connections) => {
		const { lastDisconnect, qr, connection } = connections;
		const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
		if (connection == "connecting") {
			addSpinner("Connecting", { text: "Connecting to WASocket..." });
		}
		if (connection == "close") {
			if (reason == DisconnectReason.badSession) {
				console.log("Bad session, Please delete your previous session and do a rescan...");
			} else if (reason == DisconnectReason.connectionClose) {
				console.log("Connection closed, Quick reconnecting...");
			} else if (reason == DisconnectReason.connectionLose) {
				console.log("Connection lost, Quick reconnecting...");
			} else if (reason == DisconnectReason.connectionReplaced) {
				console.log("Connection replaced, Quick reconnecting...");
			} else if (reason == DisconnectReason.loggedOut) {
				console.log("Logged out, Please delete your previous session and do a rescan...");
			} else {
				if (reason == DisconnectReason.restartRequired) {
					console.log("Restart required, Restarting your WebScoket...");
				} else {
					switch (reason) {
						case DisconnectReason.timedOut:
							console.log("Timed out, Quick reconnecting...");
							break;
						default:
							console.log("Unknown reason, Quick reconnecting...");
							break;
					}
				}
				start();
			}
		} else if (connection == "open") {
			global.client = {};
			global.botNum = Client.user.id;
			client[Client.user.id] = Client;
			successSpinner("Connecting", { text: "Connected to WASocket" });
		}
	});

	Client.ev.on("messages.upsert", async (message) => {
		const {
			default: { handler: Handler },
		} = await import("./Handlers/incomingMessage.js");
		Handler(message, client, CMD);
	});

	Client.ev.on("auth-state.update", () => saveStated);
};
start().catch(console.error);

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
	for (const command of commands) {
		const { default: commandModule } = await import(command);
		CMD.commands.set(commandModule.name, commandModule);
	}
}

async function loadEveryCommand() {
	for (const command of CMD.commands) {
		for (const aliases of command[1].aliases) {
			CMD.aliases.push(aliases);
		}
	}
}

function parseCli() {
	return meow(
		`
	Usage
	  $ node . <session>  <options>

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
	  --help, -h         Show this message.

	Examples
	  $ node . --read_only -tr
`,
		{
			importMeta: import.meta,
			flags: {
				read_only: {
					type: "boolean",
					alias: "y",
				},
				auto_read: {
					type: "boolean",
					alias: "r",
				},
				restrict: {
					type: "boolean",
					alias: "e",
				},
				only_logs: {
					type: "boolean",
					alias: "o",
				},
				no_logs: {
					type: "boolean",
					alias: "n",
				},
				self_mode: {
					type: "boolean",
					alias: "s",
				},
				debug_mode: {
					type: "boolean",
					alias: "g",
				},
				multi_cmd: {
					type: "boolean",
					alias: "m",
				},
				rainbow: {
					type: "boolean",
					alias: "b",
				},
				trace: {
					type: "boolean",
					alias: "t",
				},
				help: {
					type: "boolean",
					alias: "h",
				},
				prefix: {
					type: "string",
					alias: "p",
				},
			},
		},
	);
}

function printRandomAscii() {
	const randomAscii = fs.readdirSync("./Helper/Ascii/");
	spawn("bash", [`./Helper/Ascii/${randomAscii[Math.floor(Math.random() * randomAscii.length)]}`], {
		stdio: "inherit",
	});
}
