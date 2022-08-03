import { generateMessageID } from "@adiwajshing/baileys";
import { spotifier } from "../../Utils/Spotifier/index.js";
import { removeDuplicatesArray } from "../../Helper/index.js";

export default {
	name: "spotifyalbum",
	description: "Find album on Spotify",
	usage: "!spotifyalbum <query>",
	category: "Search",
	aliases: ["spotifyal"],
	limit: 5,
	cooldown: 4,
	status: "enable",
	async run({ query, from, message }, client) {
		if (!query) return client[botNum].reply({ from, quoted: message }, "You must provide a query.");
		try {
			query = removeDuplicatesArray(query.split(","));
			for (const querie of query) {
				let result;
				let images;
				let tracks;
				let id;
				const source = (ids) => `https://open.spotify.com${ids}`;
				if (regex(querie)) {
					id = querie.match(/https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:album\/|\?uri=spotify:album:)((\w|-){22})/)[1];
					result = await spotifier.getAlbum(id);
					if (!result.status) {
						await client[botNum].reply({ from, quoted: message }, result.message);
						continue;
					}
				} else {
					result = await spotifier.searchAlbum(querie);
					if (!result.status) {
						await client[botNum].reply({ from, quoted: message }, result.message);
						continue;
					}
					id = result.data.items[0].id;
					result = await spotifier.getAlbum(id);
				}
				tracks = await spotifier.getAlbumTracks(id);
				images = result.albums[0].images[0].url;
				let caption = "";
				let count = 0;
				const rows = [];
				for (const { artists, name, duration_ms } of tracks.items) {
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
						image: new Buffer.from(await fetchBUFFER(images), "base64"),
						caption: `\`\`\` • Spotify Album \`\`\``,
						templateButtons: [
							{
								urlButton: {
									displayText: "Image Source",
									url: images,
								},
							},
							{
								urlButton: {
									displayText: "Open Album On Spotify",
									url: source(`/album/${id}`),
								},
							},
							{
								urlButton: {
									displayText: "Open Song On Spotify",
									url: source(`/track/${tracks.items[0].id}`),
								},
							},
							{
								quickReplyButton: { displayText: "Download", id: `.spotifydl ${tracks.items[0].artists[0].name} - ${tracks.items[0].name}` },
							},
						],
						footer: caption,
					},
					{ quoted: message },
				);
				await client[botNum].relayMessage(from, { listMessage: { buttonText: " • Fetch More Spotify Tracks from this Album", description: "\t", footerText: "```Looking for some more? Choose between these options.```", listType: 1, sections: rows } }, { messageId: generateMessageID() });
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
