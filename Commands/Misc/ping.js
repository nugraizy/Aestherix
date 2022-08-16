import moment from "moment-timezone";

export default {
	name: "ping",
	description: "Ping the bot",
	usage: "!ping",
	aliases: ["pong"],
	category: "Misc",
	cooldown: 8,
	limit: 0,
	status: "enable",
	async run({ from, message }, client) {
		client[botNum].reply({ from, quoted: message }, `Pong! ${moment.duration(Date.now() - moment(message.messageTimestamp * 1000)).asSeconds()} seconds`);
	},
};
