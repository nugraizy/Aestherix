import moment from "moment-timezone";
import { color, INFOLOG } from "../../Helper/Modules/functions.js";
import { startTG } from "../../Utils/Games/index.js";

export default {
	name: "tebakgambar",
	description: "Play Guess the image",
	usage: "!tebakgambar",
	aliases: ["tg"],
	category: "Games",
	cooldown: 2,
	limit: 2,
	status: "enable",
	async run(message, client) {
		const time = moment().format("HH:mm:ss DD/MM");
		INFOLOG(`[${color(time, "cyan")}]`, `${color(`Starting Guess The Image Games.`, "#01cdfe")}  to ${color(message.prettyNumber, "#ff71ce")}`);
		const game = await startTG(client, message.from, message, 20);
		if (game.status == "playing") {
			return client[botNum].reply({ from: message.from, quoted: game.data }, `Your game is already playing!\n${game.remaining}s left`);
		}
	},
};
