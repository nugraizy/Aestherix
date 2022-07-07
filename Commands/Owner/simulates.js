import moment from "moment-timezone";
import { getRuntime } from "../../Helper/Modules/index.js";

const WAPresence = {
	available: "available",
	unavailable: "unavailable",
	composing: "composing",
	recording: "recording",
	paused: "paused",
};

export default {
	name: "simulates",
	description: "Simulates an event update",
	usage: "simulates <events>",
	aliases: ["simulate"],
	category: "Owner",
	cooldown: 0,
	limit: 0,
	async run({ isOwner, from, args, message }, client, store) {
		if (!isOwner) return client[botNum].reply({ from, quoted: message }, "You are not allowed to use this command");
		if (args.length == 1) return client[botNum].reply({ from, quoted: message }, "You must provide a status to simulate");
		const started = Date.now();
		try {
			switch (args[1]?.toLowerCase()) {
				case "online":
				case "on":
					{
						switch (args[2]?.toLowerCase()) {
							case "status":
							case "stats":
								{
									client[botNum].reply({ from, quoted: message }, Object.keys(global.presences).includes("available") ? "Available" : "Unavailable");
								}
								break;
							case "disable":
							case "off":
								{
									if ("unavailable" in global.presences) return client[botNum].reply({ from, quoted: message }, "Already offline");
									if ("available" in global.presences) delete global.presences.available;
									global.presences.unavailable = { status: WAPresence.unavailable, started };
									client[botNum].reply({ from, quoted: message }, "Simulate Available Presence Disabled");
								}
								break;
							case "enable":
							case "on":
								{
									if ("available" in global.presences) return client[botNum].reply({ from, quoted: message }, "Already online");
									if ("unavailable" in global.presences) delete global.presences.unavailable;
									global.presences.available = { status: WAPresence.available, started };
									client[botNum].reply({ from, quoted: message }, "Simulate Available Presence Enabled");
								}
								break;
							default:
								{
									client[botNum].reply({ from, quoted: message }, "Usage: !presence online [enable|disable|status]");
								}
								break;
						}
					}
					break;
				case "writing":
				case "mengetik":
				case "composing":
					{
						switch (args[2]?.toLowerCase()) {
							case "status":
							case "stats":
								{
									client[botNum].reply({ from, quoted: message }, Object.keys(global.presences).includes("composing") ? "Composing" : "Not composing");
								}
								break;
							case "disable":
							case "off":
								{
									if (!("composing" in global.presences)) return client[botNum].reply({ from, quoted: message }, "Already not writing");
									const messages = Object.keys(store.messages);
									pause(client, messages);
									clearInterval(global.presences.composing.interval);
									delete global.presences.composing;
									client[botNum].reply({ from, quoted: message }, "Simulate Composing Disabled");
								}
								break;
							case "enable":
							case "on":
								{
									if ("composing" in global.presences) return client[botNum].reply({ from, quoted: message }, "Already writing");
									global.presences.composing = {
										status: WAPresence.composing,
										started,
										interval: setInterval(() => {
											const messages = Object.keys(store.messages);
											events(client, messages, "composing");
										}, 8_000),
									};
									client[botNum].reply({ from, quoted: message }, "Simulate Composing Enabled");
								}
								break;
							default:
								{
									client[botNum].reply({ from, quoted: message }, "Usage: !presence composing [enable|disable|status]");
								}
								break;
						}
					}
					break;
				case "recording":
				case "vn":
					{
						switch (args[2]?.toLowerCase()) {
							case "status":
							case "stats":
								{
									client[botNum].reply({ from, quoted: message }, Object.keys(global.presences).includes("recording") ? "Recording" : "Not recording");
								}
								break;
							case "disable":
							case "off":
								{
									if (!("recording" in global.presences)) return client[botNum].reply({ from, quoted: message }, "Already not recording");
									const messages = Object.keys(store.messages);
									pause(client, messages);
									clearInterval(global.presences.recording.interval);
									delete global.presences.recording;
									client[botNum].reply({ from, quoted: message }, "Simulate Recording Disabled");
								}
								break;
							case "enable":
							case "on":
								{
									if ("recording" in global.presences) return client[botNum].reply({ from, quoted: message }, "Already recording");
									global.presences.recording = {
										status: WAPresence.recording,
										started,
										interval: setInterval(() => {
											const messages = Object.keys(store.messages);
											events(client, messages, "recording");
										}, 10_000),
									};
									client[botNum].reply({ from, quoted: message }, "Simulate Recording Enabled");
								}
								break;
							default:
								{
									client[botNum].reply({ from, quoted: message }, "Usage: !presence recording [enable|disable|status]");
								}
								break;
						}
					}
					break;
				case "bio": {
					switch (args[2]?.toLowerCase()) {
						case "status":
						case "stats":
							{
								client[botNum].reply({ from, quoted: message }, Object.keys(global.presences).includes("bio") ? "Enabled" : "Disabled");
							}
							break;
						case "disable":
						case "off":
							{
								if (!("bio" in global.presences)) return client[botNum].reply({ from, quoted: message }, "Already disabled");
								clearInterval(global.presences.bio.interval);
								delete global.presences.bio;
								client[botNum].reply({ from, quoted: message }, "Simulate Bio Disabled");
							}
							break;
						case "enable":
						case "on":
							{
								if ("bio" in global.presences) return client[botNum].reply({ from, quoted: message }, "Already enabled");
								global.presences.bio = { status: WAPresence.bio, started, interval: setInterval(() => events(client, [], "bio"), 10_000) };
								client[botNum].reply({ from, quoted: message }, "Simulate Bio Enabled");
							}
							break;
						default:
							{
								client[botNum].reply({ from, quoted: message }, "Usage: !presence bio [enable|disable|status]");
							}
							break;
					}
					break;
				}
				default:
					{
						client[botNum].reply({ from, quoted: message }, "Invalid command");
					}
					break;
			}
		} catch (e) {
			log(e);
		}
	},
};

const events = async (client, containers, presence) => {
	try {
		if (presence === "bio") {
			const time = moment().format("HH:mm:ss DD/MM");
			const uptime = getRuntime(process.uptime());
			const bio = `Made by nanda | Void bot info : UPTIME : ${uptime} | TIME : ${time}`;
			await client[botNum].setStatus(bio);
			return;
		}
		for (const container of containers) {
			if (global.presences[presence] == undefined) break;
			await client[botNum].sendPresenceUpdate(WAPresence[presence], container);
		}
	} catch (e) {
		log(e);
	}
};

const pause = async (client, containers) => {
	try {
		for (const container of containers) await client[botNum].sendPresenceUpdate(WAPresence.paused, container);
	} catch (e) {
		log(e);
	}
};
