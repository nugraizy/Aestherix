import { startTG } from "../../Utils/Games/index.js";

export default {
	name: "tebakgambar",
	description: "Play Guess the image",
	usage: "!tebakgambar",
	aliases: ["tg"],
	category: "Games",
	cooldown: 2,
	limit: 2,
	async run(message, client) {
		const game = await startTG(client, message.from, message, 20);
		if (game.status == "playing") {
			return client[botNum].reply(message.from, `Your game is already playing!\n${game.remaining}s left`, game.data);
		}
	},
};
