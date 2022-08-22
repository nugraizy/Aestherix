import { delay } from "@adiwajshing/baileys";
import async from "async";
import mqtt from "mqtt";
import { spotifier } from "../../Utils/Spotifier/index.js";

const clientMqttListen = mqtt.connect(process.env.MQTT_URL);

export default {
	name: "spotifyplayer",
	description: "Simulates an spotify player on bio",
	usage: "!spotifyplayer <enable|disable>",
	aliases: ["spotifybio"],
	category: "Owner",
	cooldown: 0,
	limit: 0,
	status: "enable",
	async run({ isOwner, from, args, message, query }, client, store) {
		if (!isOwner) {
			return await client[botNum].reply({ from, quoted: message }, "You are not allowed to use this command");
		}
		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, "You must provide a status to simulate");
		}
		const started = Date.now();
		try {
			switch (args[1]?.toLowerCase()) {
				case "status":
				case "stats":
					{
						await client[botNum].reply({ from, quoted: message }, Object.keys(global.presences).includes("spotify") ? "Enabled" : "Disabled");
					}
					break;
				case "disable":
				case "off":
					{
						if (!("spotify" in global.presences)) {
							return await client[botNum].reply({ from, quoted: message }, "Already disabled");
						}
						clearTimeout(global.presences.spotify.timeout);
						delete global.presences.spotify;
						await client[botNum].reply({ from, quoted: message }, "Simulate Spotify Player Bio Disabled");
					}
					break;
				case "enable":
				case "on":
					{
						if ("spotify" in global.presences) {
							return await client[botNum].reply({ from, quoted: message }, "Already enabled");
						}
						global.presences.spotify = { started, timeout: setTimeout(() => updateSpotifyTracks(), 0) };
						await client[botNum].reply({ from, quoted: message }, "Simulate Spotify Player Bio Enabled");
					}
					break;
				default:
					{
						await client[botNum].reply({ from, quoted: message }, "Usage: !spotifyplayer [enable|disable|status]");
					}
					break;
			}
		} catch (e) {
			log(e);
		}
	},
};

async function updateSpotifyTracks() {
	async.forever(
		async (next) => {
			if (presences?.spotify?.timeout == undefined) {
				next();
			}
			await delay(5_000);
			const data = await spotifier.updateNowPlayingStates();
			if (data !== false) {
				clientMqttListen.publish(process.env.MQTT_TOPIC, JSON.stringify({ ...data, status: true }));
			}
		},
		async (err) => {},
	);
}
