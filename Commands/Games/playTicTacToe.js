import { start, move } from "../../Utils/Games/ticTacToe.js";

export default {
	name: "playtictactoe",
	description: "Play Tic Tac Toe",
	usage: "!playtictactoe",
	category: "Games",
	aliases: ["ttt"],
	limit: 2,
	cooldown: 2,
	async run(message, client) {
		if (!message.query) {
			const starts = start(message.from);
			console.log(starts);
			if (!starts && (!message.query || message.mention.length > 0)) return client[botNum].reply(message.from, "You already have a game running!");
			client[botNum].reply(message.from, "You have started a game of Tic Tac Toe!");
			const board = starts.board.map((v, i) => (i == 2 || i == 5 || i == 8 ? `${v}\n` : v));
			client[botNum].sendMessage(
				message.from,
				{
					text: `@${starts.player1.split("@")[0]} vs ${starts.player2 == "computer" ? "computer" : `@${starts.player2.split("@")[0]}`}\n@${starts.player1.split("@")[0]} ${starts[starts.player1]}\n${starts.player2 == "computer" ? "computer" : `@${starts.player2.split("@")[0]}`} ${
						starts.player2 == "computer" ? starts["computer"] : starts[starts.player2]
					}\n\n${board.join("")}`,
					contextInfo: { mentionedJid: [starts.player1, starts.player2] },
				},
				{ quoted: message.message },
			);
		}
		if (/[1-9]/.test(message.query)) {
			let statistic = [];
			const moveResult = await move(message.from, message.query);
			if (moveResult.status == "NO_GAME") return client[botNum].reply(message.from, "You don't have a game running!");
			if (moveResult.status == "WRONG_TURN") return client[botNum].reply(message.from, "It's not your turn!");
			if (moveResult.status == "WRONG_MOVE") return client[botNum].reply(message.from, "That's not a valid move!");
			if (moveResult.status == "WINNER") {
				statistic = statistic = `Avg. P1 : ${moveResult.avgP1}${moveResult.avgP2 ? `\nAvg. P2 : ${moveResult.avgP2}` : ""}`;
				if (moveResult.botWinner) {
					return client[botNum].sendMessage(
						message.from,
						{
							text: `Computer won!\n\n@${moveResult.player1.split("@")[0]} vs ${moveResult.player2 == "computer" ? "computer" : `@${moveResult.player2.split("@")[0]}`}\n@${moveResult.player1.split("@")[0]} ${moveResult[moveResult.player1]}\n${
								moveResult.player2 == "computer" ? "computer" : `@${moveResult.player2.split("@")[0]}`
							} ${moveResult.player2 == "computer" ? moveResult["computer"] : moveResult[moveResult.player2]}\n\n${moveResult.board.map((v, i) => (i == 2 || i == 5 || i == 8 ? `${v}\n` : v)).join("")}\n\n${statistic}`,
							contextInfo: { mentionedJid: [moveResult.player1, moveResult.player2] },
						},
						{ quoted: message.message },
					);
				}
				return client[botNum].sendMessage(
					message.from,
					{
						text: `You Won!\n\n@${moveResult.player1.split("@")[0]} vs ${moveResult.player2 == "computer" ? "computer" : `@${moveResult.player2.split("@")[0]}`}\n@${moveResult.player1.split("@")[0]} ${moveResult[moveResult.player1]}\n${
							moveResult.player2 == "computer" ? "computer" : `@${moveResult.player2.split("@")[0]}`
						} ${moveResult.player2 == "computer" ? moveResult["computer"] : moveResult[moveResult.player2]}\n\n${moveResult.board.map((v, i) => (i == 2 || i == 5 || i == 8 ? `${v}\n` : v)).join("")}\n\n${statistic}`,
						contextInfo: { mentionedJid: [moveResult.player1, moveResult.player2] },
					},
					{ quoted: message.message },
				);
			}
			if (moveResult.status == "DRAW") {
				statistic = `Avg. P1 : ${moveResult.avgP1}${moveResult.avgP2 ? `\nAvg. P2 : ${moveResult.avgP2}` : ""}`;
				return client[botNum].sendMessage(
					message.from,
					{
						text: `It's a draw!\n\n@${moveResult.player1.split("@")[0]} vs ${moveResult.player2 == "computer" ? "computer" : `@${moveResult.player2.split("@")[0]}`}\n@${moveResult.player1.split("@")[0]} ${moveResult[moveResult.player1]}\n${
							moveResult.player2 == "computer" ? "computer" : `@${moveResult.player2.split("@")[0]}`
						} ${moveResult.player2 == "computer" ? moveResult["computer"] : moveResult[moveResult.player2]}\n\n${moveResult.board.map((v, i) => (i == 2 || i == 5 || i == 8 ? `${v}\n` : v)).join("")}\n\n${statistic}`,
						contextInfo: { mentionedJid: [moveResult.player1, moveResult.player2] },
					},
					{ quoted: message.message },
				);
			}
			if (moveResult.status == "OK")
				return client[botNum].sendMessage(
					message.from,
					{
						text: `@${moveResult.player1.split("@")[0]} vs ${moveResult.player2 == "computer" ? "computer" : `@${moveResult.player2.split("@")[0]}`}\n@${moveResult.player1.split("@")[0]} ${moveResult[moveResult.player1]}\n${
							moveResult.player2 == "computer" ? "computer" : `@${moveResult.player2.split("@")[0]}`
						} ${moveResult.player2 == "computer" ? moveResult["computer"] : moveResult[moveResult.player2]}\n\n${moveResult.board.map((v, i) => (i == 2 || i == 5 || i == 8 ? `${v}\n` : v)).join("")}`,
						contextInfo: { mentionedJid: [moveResult.player1, moveResult.player2] },
					},
					{ quoted: message.message },
				);
		}
	},
};
