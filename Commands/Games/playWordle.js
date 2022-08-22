import moment from "moment-timezone";
import { Wordle } from "../../Utils/Games/index.js";
import { INFOLOG, color } from "../../Helper/index.js";

export default {
	name: "wordle",
	description: "Play Wordle",
	usage: "!wordle <play/exit/info>",
	category: "Games",
	aliases: ["wordl"],
	cooldown: 2,
	limit: 2,
	status: "enable",
	async run({ from, message, query, args, sender, prettyNumber }, client) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, "Please specify arguments.\n\nUsage: !wordle <play/exit/info>");
		}
		if (args[1] == "play") {
			if (games.wordle.has(sender)) {
				return await client[botNum].reply({ from, quoted: wordle.messages }, "You are already playing Wordle.");
			}
			const wordle = new Wordle(sender);
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Wordle Game Answer : `, "#01cdfe")} ${color(wordle.word, "white")} to ${color(prettyNumber, "#ff71ce")}`);
			const data = await client[botNum].reply({ from, quoted: message }, `${wordle.board.join("")}\nTot. words : ${wordle.word.length}`);
			wordle.messages = data;
		} else if (args[1] == "exit") {
			if (!games.wordle.has(sender)) {
				return await client[botNum].reply({ from, quoted: message }, "You are not playing Wordle.");
			}
			const wordle = new Wordle(sender);
			wordle.exit();
			await client[botNum].reply({ from, quoted: message }, "You have exited Wordle.");
		} else if (args[1] == "info") {
			await client[botNum].reply(
				{ from, quoted: message },
				"This is a Wordle Game. You have given a clue how much the word length. And you have to guess the word, Every guessed word will checked and determined by how closed the input to the word is.\n\nGreen [🟩] : Correct Alphabet\nYellow [🟨] : Close\nBlack [⬛] : Not Close/Invalid\nWhite [⬜] : First Board Play.\n\nUsage: !wordle <play/exit/info>",
			);
		}
	},
};
