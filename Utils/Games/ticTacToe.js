import configuration from '../../connect.js';
import { shuffleArray } from '../../Helper/Modules/index.js';

const COMBOS = [
	[0, 1, 2],
	[3, 4, 5],
	[6, 7, 8],
	[0, 3, 6],
	[1, 4, 7],
	[2, 5, 8],
	[0, 4, 8],
	[2, 4, 6],
];
const MODEL = {
	PLAYER1: '⭕',
	PLAYER2: '❌',
};

const RANDOM_TURN_BASED_ON_MODEL = (player1, player2) => {
	const players = player2 == 'Void Bot' ? [player1, player2] : shuffleArray([player1, player2]);

	return {
		player1: players[0],
		player2: players[1],
		player1model: MODEL.PLAYER1,
		player2model: MODEL.PLAYER2,
	};
};

export const DeleteTicTacToeSession = (session) => {
	const key = Array.from(configuration.games.tictactoe.values()).find((game) => game.PLAYER_1 == session || game.PLAYER_2 == session) || null;

	if (key !== null && key.PLAYER_1 == session) {
		return configuration.games.tictactoe.delete(key.PLAYER_1);
	} else if (key !== null && key.player2 == session) {
		return configuration.games.tictactoe.delete(key.PLAYER_2);
	}

	return null;
};

export const GetTicTacToeSession = (session) => {
	const key = Array.from(configuration.games.tictactoe.values()).find((game) => game.PLAYER_1 == session || game.PLAYER_2 == session) || null;

	if (key !== null && key.PLAYER_1 == session) {
		return key;
	} else if (key !== null && key.PLAYER_2 == session) {
		return key;
	}

	return null;
};

export class TicTacToe {
	constructor(player1, player2 = 'Void Bot', newGame) {
		const container = RANDOM_TURN_BASED_ON_MODEL(player1, player2);

		this.COMBO = COMBOS;
		this.PLAYER_1 = container.player1;
		this.PLAYER_2 = container.player2;
		this.PLAYER_1_MODEL = container.player1model;
		this.PLAYER_2_MODEL = container.player2model;
		this.TURN = 'O';
		this.PLAYER_TURN = container.player1;
		this.BOARD = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
		this.WINNING_ORDER = [null, null, null];
		this.PLAY_BOARD = new Array(9).fill('');

		if (this.checkGameStatus() && newGame) {
			return { error: 'Game already exists' };
		}

		this.setGame();
	}

	getKey(dari) {
		const key = Array.from(configuration.games.tictactoe.values()).find((game) => game.PLAYER_1 == dari || game.PLAYER_2 == dari) || null;

		if (key !== null && key.PLAYER_1 == dari) {
			return key;
		}

		return null;
	}

	checkGameStatus() {
		return this.getKey(this.PLAYER_1);
	}

	setGame() {
		return configuration.games.tictactoe.set(this.PLAYER_1, this);
	}

	displayBoard() {
		return this.BOARD;
	}

	displayPlayBoard() {
		return this.PLAY_BOARD;
	}

	deleteGame() {
		return configuration.games.tictactoe.delete(this.PLAYER_1);
	}

	playMove(location, player, pcRival) {
		if (!this.isTurn(player)) {
			return { error: 'It is not your turn' };
		}

		if (player == 'Void Bot') {
			location = this.minimax(location, 0, true, pcRival).move;
			this.BOARD[player == 'Void Bot' ? location : location - 1] = this.PLAYER_TURN == this.PLAYER_1 ? this.PLAYER_1_MODEL : this.PLAYER_2_MODEL;
			this.PLAY_BOARD[player == 'Void Bot' ? location : location - 1] = this.PLAYER_TURN == this.PLAYER_1 ? this.PLAYER_1_MODEL : this.PLAYER_2_MODEL;

			if (this.isWinner(this.PLAYER_TURN == this.PLAYER_1 ? this.PLAYER_1_MODEL : this.PLAYER_2_MODEL)) {
				return { status: 'WINNER', winner: player, ...this };
			}

			if (this.isDraw()) {
				return { status: 'DRAW', ...this };
			}

			this.changeTurn();
			return this;
		}

		if (this.isCorrectMove(location)) {
			this.BOARD[player == 'Void Bot' ? location : location - 1] = this.PLAYER_TURN == this.PLAYER_1 ? this.PLAYER_1_MODEL : this.PLAYER_2_MODEL;
			this.PLAY_BOARD[player == 'Void Bot' ? location : location - 1] = this.PLAYER_TURN == this.PLAYER_1 ? this.PLAYER_1_MODEL : this.PLAYER_2_MODEL;

			if (this.isWinner(this.PLAYER_TURN == this.PLAYER_1 ? this.PLAYER_1_MODEL : this.PLAYER_2_MODEL)) {
				return { status: 'WINNER', winner: player, ...this };
			}

			if (this.isDraw()) {
				return { status: 'DRAW', ...this };
			}

			this.changeTurn();
			return this;
		} else {
			return { error: 'Invalid move' };
		}
	}

	isWinner(player) {
		for (const combo of this.COMBO) {
			const [a, b, c] = combo;

			if (this.PLAY_BOARD[a] === player && this.PLAY_BOARD[b] === player && this.PLAY_BOARD[c] === player) {
				this.WINNING_ORDER = [a, b, c];
				return true;
			}
		}

		return false;
	}

	isCorrectMove(location) {
		const model = this.BOARD[location - 1];

		return model !== '❌' && model !== '⭕';
	}

	isTurn(player) {
		return this.PLAYER_TURN == player;
	}

	isDraw() {
		return this.PLAY_BOARD.every((row) => row == '❌' || row == '⭕');
	}

	changeTurn() {
		this.TURN = this.TURN === 'O' ? 'X' : 'O';
		this.PLAYER_TURN = this.PLAYER_TURN === this.PLAYER_1 ? this.PLAYER_2 : this.PLAYER_1;
	}

	minimax(board, depth, isMaximizing, players) {
		if (this.isWinner(this.PLAYER_1_MODEL)) {
			return { score: 10 - depth };
		}

		if (this.isWinner(this.PLAYER_2_MODEL)) {
			return { score: depth - 10 };
		}

		if (board.every((v) => v !== '')) {
			return { score: 0 };
		}

		let bestScore = isMaximizing ? -Infinity : Infinity;
		let bestMove = null;

		for (let i = 0; i < board.length; i++) {
			if (board[i] === '') {
				board[i] = isMaximizing ? this.PLAYER_1_MODEL : this.PLAYER_2_MODEL;
				const { score } = this.minimax(board, depth + 1, !isMaximizing, players);

				board[i] = '';

				if (isMaximizing && score > bestScore) {
					bestScore = score;
					bestMove = i;
				} else if (!isMaximizing && score < bestScore) {
					bestScore = score;
					bestMove = i;
				}
			}
		}

		return { score: bestScore, move: bestMove };
	}
}
