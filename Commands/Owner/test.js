import { spotifier } from "../../Utils/Spotifier/index.js";

export default {
	name: "test",
	description: "Set the bot's name",
	usage: "!setname <name>",
	aliases: ["setnick", "nick", "name"],
	category: "Owner",
	cooldown: 0,
	limit: 0,
	status: "enable",
	async run({ isOwner, from, query, message }, client) {
		if (!isOwner) return client[botNum].reply({ from, quoted: message }, "You are not allowed to use this command");
		log(await spotifier.startNewPlayback("3mQRkeRLmccmDwXnvL6Ct7"));
	},
};
