import { deleteTictactoeSession, getTictactoeSession, TicTacToe } from '../../utils/games/index.js';
import { delay } from '../../utils/modules/index.js';

const WINNER_SETS = {
	O: '🚫',
	X: '❎'
};

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'playtictactoe',
	minifiedDescription: 'Play TicTacToe',
	description: 'Play Tic Tac Toe',
	usage: '!playtictactoe',
	category: 'Games',
	aliases: ['ttt'],
	limit: 2,
	cooldown: 2,
	status: 'enable',
	async run({ message, query, from, sender }, client) {
		const capt = (game, status) => `TicTacToe Games by ${__botName} Bot.
	${
		status
			? game.status === 'WINNER'
				? `${game.winner === __botName ? __botName : `@${game.winner.split('@')[0]}`} wins!`
				: game.status === 'DRAW'
					? 'Game is Draw!'
					: `${game.PLAYER_TURN === game.PLAYER_1 ? game.PLAYER_1_MODEL : game.PLAYER_2_MODEL} ${
							game.PLAYER_TURN === __botName ? __botName : `@${game.PLAYER_TURN.split('@')[0]}`
						}'s turn\n\n`
			: ''
	}
	${game.PLAYER_1_MODEL} @${game.PLAYER_1.split('@')[0]} vs ${game.PLAYER_2_MODEL} ${
		game.PLAYER_2 === __botName ? __botName : `@${game.PLAYER_2.split('@')[0]}`
	}
	
${game.BOARD.map((v, i) => {
	const ICON = WINNER_SETS[game.TURN];

	if (status && game.status !== 'DRAW') {
		v = i === game.WINNING_ORDER[0] || i === game.WINNING_ORDER[1] || i === game.WINNING_ORDER[2] ? v.replace(v, ICON) : v;
	}

	v =
		i === 2 || i === 5 || i === 8
			? i === 8
				? v
				: `${v}\n          ---------\n          `
			: i === 0
				? `          ${v}|`
				: `${v}|`;
	return v;
}).join('')}

Powered by Hidden Finder`;

		if (/(del|dlt|d)/i.test(query)) {
			const status = getTictactoeSession(sender);

			if (!status) {
				return await client.instance.reply(from, 'You do not have a game', message);
			}

			deleteTictactoeSession(sender);

			await client.instance.reply(from, 'Game deleted', message);
		}

		if (!query) {
			const game = new TicTacToe(sender, undefined, true);

			if (game?.error) {
				return await client.instance.reply(from, game.error, message);
			}

			await client.instance.send(
				from,
				{ text: capt(game, false), mentions: [game.PLAYER_1, game.PLAYER_2] },
				{ quoted: message }
			);
		}

		if (/[1-9]/.test(query)) {
			const game = getTictactoeSession(sender);

			if (!game) {
				return await client.instance.reply(from, 'You do not have a game', message);
			}

			const move = game.playMove(query, sender);

			if (move?.error) {
				return await client.instance.reply(from, move.error, message);
			}

			if (move.status === 'WINNER' || move.status === 'DRAW') {
				await client.instance.send(
					from,
					{ text: capt(move, true), mentions: [game.PLAYER_1, game.PLAYER_2] },
					{ quoted: message }
				);

				return deleteTictactoeSession(sender);
			}

			await client.instance.send(from, { text: capt(move), mentions: [game.PLAYER_1, game.PLAYER_2] }, { quoted: message });

			if (move.PLAYER_TURN === __botName) {
				const botGames = getTictactoeSession(sender);

				await client.instance.reply(from, `${__botName} Bot TURN`, message);
				await delay(1000);

				const botMove = botGames.playMove(botGames.displayPlayBoard(), __botName, sender);

				if (botMove.status === 'WINNER' || botMove.status === 'DRAW') {
					await client.instance.send(
						from,
						{ text: capt(botMove, true), mentions: [botGames.PLAYER_1, botGames.PLAYER_2] },
						{ quoted: message }
					);

					return deleteTictactoeSession(sender);
				}

				await client.instance.send(
					from,
					{ text: capt(botMove, false), mentions: [botGames.PLAYER_1, botGames.PLAYER_2] },
					{ quoted: message }
				);
			}
		}
	}
};
