import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import baileys from "@adiwajshing/baileys";
import P from "pino";
import meow from "meow";
import { Collection } from "@discordjs/collection";
import { Boom } from "@hapi/boom";

const { default: makeWASocket, DisconnectReason, delay, BufferJSON, makeInMemoryStore, AnyMessageContent, useSingleFileAuthState, DEFAULT_CONNECTION_CONFIG } = baileys;
const { state, saveState } = useSingleFileAuthState("./session/Session-debug.json");
const CMD = {};
CMD.commands = new Collection();
CMD.prefix = "!";

function loadFiles(dir) {
	let files = [];
	const list = fs.readdirSync(dir);
	for (const file of list) {
		const path = dir + "/" + file;
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
	const commands = loadFiles("./commands");
	for (const command of commands) {
		const { default: commandModule } = await import(command);
		CMD.commands.set(commandModule.name, commandModule);
	}
}

const start = async () => {
	await loadCommands();

	const Client = makeWASocket({ printQRInTerminal: true, version: DEFAULT_CONNECTION_CONFIG.version, logger: P({ level: "fatal" }), auth: state });

	Client.ev.on("connection.update", (connections) => {
		const { lastDisconnect, qr, connection } = connections;
		const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
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
			console.log("Connected!");
		}
	});

	Client.ev.on("messages.upsert", async (message) => {
		const {
			default: { handler: Handler },
		} = await import("./handlers/incomingMessage.js");
		Handler(message, client, CMD);
	});

	Client.ev.on("auth-state.update", () => saveStated);
};
start().catch(console.error);
