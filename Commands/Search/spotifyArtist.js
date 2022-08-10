import { generateMessageID } from "@adiwajshing/baileys";
import { removeDuplicatesArray } from "../../Helper/index.js";
import { spotifier } from "../../Utils/Spotifier/index.js";

export default {
	name: "spotifyartist",
	description: "Find artist on Spotify",
	usage: "!spotifyartist <query>",
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
				log(await spotifier.searchArtist(querie));
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
	return /(https?:\/\/open.spotify.com\/(track|user|artist|album)\/[a-zA-Z0-9]+(\/playlist\/[a-zA-Z0-9]+|)|spotify:(track|user|artist|album):[a-zA-Z0-9]+(:playlist:[a-zA-Z0-9]+|))/.test(
		input,
	);
}
