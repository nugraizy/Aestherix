import { generateMessageID } from "@adiwajshing/baileys";
import { spotifier } from "../../Utils/Spotifier/index.js";
import { removeDuplicatesArray, fetchBUFFER } from "../../Helper/index.js";

export default {
	name: "spotifytracks",
	description: "Find song on Spotify",
	usage: "!spotifytracks <query>",
	category: "Search",
	aliases: ["spotifyt"],
	limit: 4,
	cooldown: 2,
	status: "enable",
	async run({ query, from, message }, client) {
		if (!query) return client[botNum].reply({ from, quoted: message }, "You must provide a query.");
		try {
			query = removeDuplicatesArray(query.split(","));
			for (const querie of query) {
				const result = regex(querie) ? await spotifier.getTracks(querie.match(/https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:track\/|\?uri=spotify:track:)((\w|-){22})/)[1]) : await spotifier.searchTracks(querie);
				if (!result.status) {
					await client[botNum].reply({ from, quoted: message }, result.message);
					continue;
				}
				let caption = "";
				let count = 0;
				const rows = [];
				for (const { artists, name, duration_ms } of result?.data?.items ?? result.tracks) {
					if (count == 0) {
						caption += `Title : ${name}\n`;
						caption += `Artists : ${artists
							.map((v) => v.name)
							.map((v, i) => (artists.length !== 1 && i + 1 == artists.length ? `and ${v}` : v))
							.join(", ")}\n`;
						caption += `Duration : ${duration_ms.toTime()}\n`;
					} else {
						rows.push({
							rows: [
								{
									title: `${count}. ${artists
										.map((v) => v.name)
										.map((v, i) => (artists.length !== 1 && i + 1 == artists.length ? `and ${v}` : v))
										.join(", ")} - ${name}`,
									rowId: `.spotifydl ${name} - ${artists[0].name}`,
								},
							],
							title: `VOID BOT | Powered by Spotify`,
						});
					}
					count++;
				}
				await client[botNum].sendMessage(
					from,
					{
						image: new Buffer.from(await fetchBUFFER(result?.data?.items?.[0]?.album?.images?.[0]?.url ?? result.tracks[0].album.images[0].url), "base64"),
						caption: `\`\`\` • Spotify Tracks \`\`\``,
						templateButtons: [
							{
								urlButton: {
									displayText: "Image Source",
									url: result?.data?.items?.[0]?.album?.images?.[0]?.url ?? result.tracks[0].album.images[0].url,
								},
							},
							{
								urlButton: {
									displayText: "Open On Spotify",
									url: result?.data?.items?.[0]?.external_urls?.spotify ?? result.tracks[0].external_urls.spotify,
								},
							},
							{
								quickReplyButton: { displayText: "Download", id: `.spotifydl ${result?.data?.items?.[0]?.name ?? result.tracks[0].name} - ${result?.data?.items?.[0]?.artists?.[0]?.name ?? result.tracks[0].external_urls.spotify}` },
							},
						],
						footer: caption,
					},
					{ quoted: message },
				);
				await client[botNum].relayMessage(from, { listMessage: { buttonText: " • Fetch More Spotify by your Keyword", description: "\t", footerText: "```Looking for some more? Choose between these options.```", listType: 1, sections: rows } }, { messageId: generateMessageID() });
			}
		} catch (err) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${err.name}\n`;
			str += `Message : ${err.message}`;
			await client[botNum].reply({ from, quoted: message }, str);
			log(err);
		}
	},
};

function regex(input) {
	return /(https?:\/\/open.spotify.com\/(track|user|artist|album)\/[a-zA-Z0-9]+(\/playlist\/[a-zA-Z0-9]+|)|spotify:(track|user|artist|album):[a-zA-Z0-9]+(:playlist:[a-zA-Z0-9]+|))/.test(input);
}
