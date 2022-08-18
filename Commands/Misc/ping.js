import moment from "moment-timezone";

export default {
	name: "ping",
	description: "Ping the bot or Show bot latency",
	usage: "!ping",
	aliases: ["pong"],
	category: "Misc",
	cooldown: 8,
	limit: 0,
	status: "enable",
	async run({ from, message }, client) {
		const ping = calculate(message.messageTimestamp, Date.now());
		client[botNum].reply({ from, quoted: message }, `Pong! ${ping} seconds`);
	},
};

const calculate = (t, n) => moment.duration(n - moment(t * 1000)).asSeconds();
