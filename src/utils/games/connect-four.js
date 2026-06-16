import configuration from '../../helper/config/connect.js';

const ROWS = 6;
const COLS = 7;

const EMPTY = '⚪';
const RED = '🔴';
const YELLOW = '🟡';

const AI_PLAYER = 'BOT_AI';

const SCORES = {
	WIN: 1000,
	THREE: 100,
	TWO: 10,
	CENTER: 3
};

export class ConnectFour {
	constructor(player1, player2 = null, vsAI = false) {
		this.player1 = player1;
		this.player2 = player2;
		this.vsAI = vsAI;
		this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
		this.turn = RED;
		this.playerTurn = player1;
		this.gameTimeStarted = new Date().getTime();
		this.winner = null;
		this.isDraw = false;
		this.winCells = null;
		this.aiThinking = false;
	}

	static getSession(playerId) {
		const sessions = configuration.games.connectFour;

		for (const [key, session] of sessions.entries()) {
			if (session.player1 === playerId || session.player2 === playerId) {
				return { key, session };
			}
		}

		return null;
	}

	static getPendingGame() {
		const sessions = configuration.games.connectFour;

		for (const [key, session] of sessions.entries()) {
			if (!session.player2) {
				return { key, session };
			}
		}

		return null;
	}

	static deleteSession(playerId) {
		const result = ConnectFour.getSession(playerId);

		if (result) {
			configuration.games.connectFour.delete(result.key);
		}

		return result;
	}

	play() {
		configuration.games.connectFour.set(this.player1, this);
	}

	isPlayerInGame(playerId) {
		return this.player1 === playerId || this.player2 === playerId;
	}

	isTurn(playerId) {
		return this.playerTurn === playerId;
	}

	addPlayer(player2) {
		if (this.player2) {
			return { error: 'Game is already full.' };
		}

		this.player2 = player2;
		return { success: true };
	}

	startVsAI() {
		this.player2 = AI_PLAYER;
		this.vsAI = true;
		return { success: true };
	}

	dropDisc(col) {
		if (this.winner || this.isDraw) {
			return { error: 'Game is already over.' };
		}

		if (col < 0 || col >= COLS) {
			return { error: 'Invalid column. Choose 1-7.' };
		}

		if (this.board[0][col] !== EMPTY) {
			return { error: 'Column is full. Choose another column.' };
		}

		let row = ROWS - 1;

		while (row >= 0 && this.board[row][col] !== EMPTY) {
			row--;
		}

		const disc = this.turn;

		this.board[row][col] = disc;

		if (this.checkWin(row, col, disc)) {
			this.winner = this.playerTurn;
			return {
				status: 'win',
				winner: this.playerTurn,
				board: this.renderBoard(),
				duration: this.getGameDuration()
			};
		}

		if (this.isBoardFull()) {
			this.isDraw = true;
			return {
				status: 'draw',
				board: this.renderBoard(),
				duration: this.getGameDuration()
			};
		}

		this.changeTurn();

		return {
			status: 'continue',
			board: this.renderBoard(),
			turn: this.playerTurn
		};
	}

	getAIMove() {
		if (!this.vsAI || this.turn !== YELLOW) {
			return -1;
		}

		const validCols = this.getValidCols(this.board);

		if (validCols.length === 0) {
			return -1;
		}

		for (const col of validCols) {
			const row = this.getDropRow(this.board, col);

			if (row >= 0) {
				const newBoard = this.cloneBoard(this.board);

				newBoard[row][col] = YELLOW;

				if (this.checkWinOnBoard(newBoard, row, col, YELLOW)) {
					return col;
				}
			}
		}

		for (const col of validCols) {
			const row = this.getDropRow(this.board, col);

			if (row >= 0) {
				const newBoard = this.cloneBoard(this.board);

				newBoard[row][col] = RED;

				if (this.checkWinOnBoard(newBoard, row, col, RED)) {
					return col;
				}
			}
		}

		if (validCols.includes(3)) {
			return 3;
		}

		return validCols[Math.floor(Math.random() * validCols.length)];
	}

	async playAITurn() {
		if (!this.vsAI || this.turn !== YELLOW || this.winner || this.isDraw) {
			return null;
		}

		this.aiThinking = true;

		await new Promise((resolve) => setTimeout(resolve, 500));

		try {
			const col = this.getAIMove();

			this.aiThinking = false;

			if (col >= 0) {
				return this.dropDisc(col);
			}

			return null;
		} catch {
			this.aiThinking = false;

			const validCols = this.getValidCols(this.board);

			if (validCols.length > 0) {
				return this.dropDisc(validCols[0]);
			}

			return null;
		}
	}

	minimax(board, depth, alpha, beta, isMaximizing) {
		const validCols = this.getValidCols(board);

		if (depth === 0 || validCols.length === 0) {
			if (validCols.length === 0) {
				return { score: 0, col: -1 };
			}

			return { score: this.evaluateBoard(board), col: validCols[0] };
		}

		if (isMaximizing) {
			let bestScore = -Infinity;
			let bestCol = validCols[0];

			for (const col of validCols) {
				const newBoard = this.cloneBoard(board);
				const row = this.getDropRow(newBoard, col);

				newBoard[row][col] = YELLOW;

				if (this.checkWinOnBoard(newBoard, row, col, YELLOW)) {
					return { score: SCORES.WIN, col };
				}

				const score = this.minimax(newBoard, depth - 1, alpha, beta, false).score;

				if (score > bestScore) {
					bestScore = score;
					bestCol = col;
				}

				alpha = Math.max(alpha, bestScore);

				if (alpha >= beta) {
					break;
				}
			}

			return { score: bestScore, col: bestCol };
		} else {
			let bestScore = Infinity;
			let bestCol = validCols[0];

			for (const col of validCols) {
				const newBoard = this.cloneBoard(board);
				const row = this.getDropRow(newBoard, col);

				newBoard[row][col] = RED;

				if (this.checkWinOnBoard(newBoard, row, col, RED)) {
					return { score: -SCORES.WIN, col };
				}

				const score = this.minimax(newBoard, depth - 1, alpha, beta, true).score;

				if (score < bestScore) {
					bestScore = score;
					bestCol = col;
				}

				beta = Math.min(beta, bestScore);

				if (alpha >= beta) {
					break;
				}
			}

			return { score: bestScore, col: bestCol };
		}
	}

	getValidCols(board) {
		const cols = [];

		for (let c = 0; c < COLS; c++) {
			if (board[0][c] === EMPTY) {
				cols.push(c);
			}
		}

		return cols;
	}

	getDropRow(board, col) {
		let row = ROWS - 1;

		while (row >= 0 && board[row][col] !== EMPTY) {
			row--;
		}

		return row;
	}

	cloneBoard(board) {
		return board.map((row) => [...row]);
	}

	evaluateBoard(board) {
		let score = 0;

		score += this.evaluateCenter(board);

		score += this.evaluateLines(board, YELLOW);
		score -= this.evaluateLines(board, RED);

		return score;
	}

	evaluateCenter(board) {
		let count = 0;

		for (let r = 0; r < ROWS; r++) {
			if (board[r][3] === YELLOW) {
				count++;
			}
		}

		return count * SCORES.CENTER;
	}

	evaluateLines(board, disc) {
		let score = 0;

		for (let r = 0; r < ROWS; r++) {
			for (let c = 0; c < COLS - 3; c++) {
				const line = [board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3]];

				score += this.evaluateLine(line, disc);
			}
		}

		for (let r = 0; r < ROWS - 3; r++) {
			for (let c = 0; c < COLS; c++) {
				const line = [board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]];

				score += this.evaluateLine(line, disc);
			}
		}

		for (let r = 0; r < ROWS - 3; r++) {
			for (let c = 0; c < COLS - 3; c++) {
				const line = [board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]];

				score += this.evaluateLine(line, disc);
			}
		}

		for (let r = 3; r < ROWS; r++) {
			for (let c = 0; c < COLS - 3; c++) {
				const line = [board[r][c], board[r - 1][c + 1], board[r - 2][c + 2], board[r - 3][c + 3]];

				score += this.evaluateLine(line, disc);
			}
		}

		return score;
	}

	evaluateLine(line, disc) {
		const empty = line.filter((c) => c === EMPTY).length;
		const filled = line.filter((c) => c === disc).length;

		if (filled === 4) {
			return SCORES.WIN;
		}

		if (filled === 3 && empty === 1) {
			return SCORES.THREE;
		}

		if (filled === 2 && empty === 2) {
			return SCORES.TWO;
		}

		return 0;
	}

	checkWinOnBoard(board, row, col, disc) {
		const directions = [
			[0, 1],
			[1, 0],
			[1, 1],
			[1, -1]
		];

		for (const [dr, dc] of directions) {
			let count = 1;

			for (let i = 1; i < 4; i++) {
				const r = row + dr * i;
				const c = col + dc * i;

				if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === disc) {
					count++;
				} else {
					break;
				}
			}

			for (let i = 1; i < 4; i++) {
				const r = row - dr * i;
				const c = col - dc * i;

				if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === disc) {
					count++;
				} else {
					break;
				}
			}

			if (count >= 4) {
				return true;
			}
		}

		return false;
	}

	checkWin(row, col, disc) {
		const directions = [
			[0, 1],
			[1, 0],
			[1, 1],
			[1, -1]
		];

		for (const [dr, dc] of directions) {
			const cells = [[row, col]];

			for (let i = 1; i < 4; i++) {
				const r = row + dr * i;
				const c = col + dc * i;

				if (r >= 0 && r < ROWS && c >= 0 && c < COLS && this.board[r][c] === disc) {
					cells.push([r, c]);
				} else {
					break;
				}
			}

			for (let i = 1; i < 4; i++) {
				const r = row - dr * i;
				const c = col - dc * i;

				if (r >= 0 && r < ROWS && c >= 0 && c < COLS && this.board[r][c] === disc) {
					cells.push([r, c]);
				} else {
					break;
				}
			}

			if (cells.length >= 4) {
				this.winCells = cells;
				return true;
			}
		}

		return false;
	}

	isBoardFull() {
		return this.board[0].every((cell) => cell !== EMPTY);
	}

	changeTurn() {
		if (this.turn === RED) {
			this.turn = YELLOW;
			this.playerTurn = this.player2;
		} else {
			this.turn = RED;
			this.playerTurn = this.player1;
		}
	}

	renderBoard(highlight = false) {
		const columnNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣'];
		let output = '';

		for (let r = 0; r < ROWS; r++) {
			const row = [];

			for (let c = 0; c < COLS; c++) {
				if (highlight && this.winCells && this.winCells.some(([wr, wc]) => wr === r && wc === c)) {
					row.push('💥');
				} else {
					row.push(this.board[r][c]);
				}
			}

			output += row.join('') + '\n';
		}

		output += columnNumbers.join('');

		return output;
	}

	getGameDuration() {
		const endTime = new Date().getTime();
		const durationMs = endTime - this.gameTimeStarted;

		const seconds = Math.floor((durationMs / 1000) % 60);
		const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
		const hours = Math.floor(durationMs / (1000 * 60 * 60));

		const parts = [];

		if (hours > 0) {
			parts.push(`${hours}h`);
		}

		if (minutes > 0) {
			parts.push(`${minutes}m`);
		}

		if (seconds > 0 || parts.length === 0) {
			parts.push(`${seconds}s`);
		}

		return parts.join(' ');
	}
}
