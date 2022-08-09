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
		client[botNum].reply({ from, quoted: message }, `Pong! ${ping(message.messageTimestamp, Date.now())} seconds`);
	},
};

const ping = (timestamp, now) => {
	return moment.duration(now - moment(timestamp * 1000)).asSeconds();
};
