import { delay } from "@adiwajshing/baileys";
import { TicTacToe, GetTicTacToeSession, DeleteTicTacToeSession } from "../../Utils/Games/index.js";

export default {
	name: "buu",
	description: "Play Tic Tac Toe",
	usage: "!playtictactoe",
	category: "Games",
	aliases: ["ttt"],
	limit: 2,
	cooldown: 2,
	async run({ message, query, from, sender }, client) {
		try {
			if (/(del|dlt|d)/i.test(query)) DeleteTicTacToeSession(sender);
			if (!query) {
				const game = new TicTacToe(sender, undefined, true);
				if ("error" in game) return client[botNum].reply(from, game.error);
				const capt = (game) => `TicTacToe Games by Void Bot.
				
	${game.PLAYER_1_MODEL} @${game.PLAYER_1.split("@")[0]} vs ${game.PLAYER_2_MODEL} ${game.PLAYER_2 == "Void Bot" ? "Void Bot" : `@${game.PLAYER_2.split("@")[0]}`}
	
	${game.BOARD.map((v, i) => (i == 2 || i == 5 || i == 8 ? `${v}\n` : v)).join("")}`;
				await client[botNum].sendMessage(from, { text: capt(game), contextInfo: { mentionedJid: [game.PLAYER_1, game.PLAYER_2] } }, { quoted: message });
			}
			if (/[1-9]/.test(query)) {
				const game = GetTicTacToeSession(sender);
				if (!game) return client[botNum].reply(from, "You don't have a game");
				const move = game.playMove(query, sender);
				if ("error" in move) return client[botNum].reply(from, move.error);
				const capt = (game) => `TicTacToe Games by Void Bot.
	${
		game.status == "WINNER"
			? `${game.winner == "Void Bot" ? "Void Bot" : `@${game.winner.split("@")[0]}`} wins!`
			: game.status == "DRAW"
			? "Game is Draw!"
			: `${game.PLAYER_TURN == game.PLAYER_1 ? game.PLAYER_1_MODEL : game.PLAYER_2_MODEL} ${game.PLAYER_TURN == "Void Bot" ? "Void Bot" : `@${game.PLAYER_TURN.split("@")[0]}`}'s turn`
	}
				
	${game.PLAYER_1_MODEL} @${game.PLAYER_1.split("@")[0]} vs ${game.PLAYER_2_MODEL} ${game.PLAYER_2 == "Void Bot" ? "Void Bot" : `@${game.PLAYER_2.split("@")[0]}`}
	
	${game.BOARD.map((v, i) => (i == 2 || i == 5 || i == 8 ? `${v}\n` : v)).join("")}`;
				await client[botNum].sendMessage(from, { text: capt(move), contextInfo: { mentionedJid: [game.PLAYER_1, game.PLAYER_2] } }, { quoted: message });
				if (game.status == "WINNER" || game.status == "DRAW") return DeleteTicTacToeSession(sender);
				if (move.PLAYER_TURN == "Void Bot") {
					const botGames = GetTicTacToeSession(sender);
					await client[botNum].reply(from, "Void Bot's TURN");
					await delay(1000);
					const botMove = botGames.playMove(botGames.displayPlayBoard(), "Void Bot", sender);
					await client[botNum].sendMessage(from, { text: capt(botMove), contextInfo: { mentionedJid: [botGames.PLAYER_1, botGames.PLAYER_2] } }, { quoted: message });
				}
			}
		} catch (error) {
			console.log(error);
			client[botNum].reply(from, `An error occured\n\n${error.message}`);
		}
	},
};
