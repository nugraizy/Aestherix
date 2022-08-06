import { searchHashtag } from "../../Utils/Instagram/instaHashtag.js";

export default {
	name: "ighashtag",
	description: "Search for hashtag on Instagram",
	usage: "!ighashtag <keyword>",
	aliases: ["ighash"],
	category: "Search",
	cooldown: 2,
	limit: 4,
	status: "enable",
	async run({ query, from, message }, client) {
		log(await searchHashtag(query));
	},
};
