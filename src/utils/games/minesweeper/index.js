import configuration from '../../../helper/config/connect.js';

const DIFFICULTIES = {
	easy: { rows: 9, cols: 9, mines: 10 },
	medium: { rows: 16, cols: 16, mines: 40 },
	hard: { rows: 16, cols: 30, mines: 99 }
};

const CELL = {
	HIDDEN: '⬜',
	FLAG: '🚩',
	MINE: '💥',
	EMPTY: '⬛'
};

const NUMBER_EMOJI = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];

export class Minesweeper {
	constructor(playerId, difficulty = 'easy') {
		this.playerId = playerId;
		this.difficulty = difficulty;

		const config = DIFFICULTIES[difficulty] || DIFFICULTIES.easy;

		this.rows = config.rows;
		this.cols = config.cols;
		this.totalMines = config.mines;
		this.board = [];
		this.revealed = [];
		this.flagged = [];
		this.phase = 'playing';
		this.gameTimeStarted = new Date().getTime();
		this.firstMove = true;

		this.initBoard();
	}

	static getSession(playerId) {
		return configuration.games.minesweeper.get(playerId);
	}

	static deleteSession(playerId) {
		configuration.games.minesweeper.delete(playerId);
	}

	play() {
		configuration.games.minesweeper.set(this.playerId, this);
	}

	initBoard() {
		this.board = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
		this.revealed = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
		this.flagged = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
	}

	placeMines(excludeRow, excludeCol) {
		let placed = 0;

		while (placed < this.totalMines) {
			const row = Math.floor(Math.random() * this.rows);
			const col = Math.floor(Math.random() * this.cols);

			if (this.board[row][col] === -1) {
				continue;
			}

			if (Math.abs(row - excludeRow) <= 1 && Math.abs(col - excludeCol) <= 1) {
				continue;
			}

			this.board[row][col] = -1;
			placed++;
		}

		this.calculateNumbers();
	}

	calculateNumbers() {
		for (let r = 0; r < this.rows; r++) {
			for (let c = 0; c < this.cols; c++) {
				if (this.board[r][c] === -1) {
					continue;
				}

				let count = 0;

				for (let dr = -1; dr <= 1; dr++) {
					for (let dc = -1; dc <= 1; dc++) {
						const nr = r + dr;
						const nc = c + dc;

						if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.board[nr][nc] === -1) {
							count++;
						}
					}
				}

				this.board[r][c] = count;
			}
		}
	}

	reveal(row, col) {
		if (this.phase !== 'playing') {
			return { error: 'Game is already over.' };
		}

		if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
			return { error: 'Invalid cell.' };
		}

		if (this.revealed[row][col]) {
			return { error: 'Cell already revealed.' };
		}

		if (this.flagged[row][col]) {
			return { error: 'Remove flag first.' };
		}

		if (this.firstMove) {
			this.placeMines(row, col);
			this.firstMove = false;
		}

		if (this.board[row][col] === -1) {
			this.phase = 'lost';
			this.revealed[row][col] = true;

			return {
				status: 'lose',
				board: this.renderBoard(true),
				duration: this.getGameDuration()
			};
		}

		this.revealCell(row, col);

		if (this.checkWin()) {
			this.phase = 'won';

			return {
				status: 'win',
				board: this.renderBoard(true),
				duration: this.getGameDuration()
			};
		}

		return {
			status: 'continue',
			board: this.renderBoard()
		};
	}

	revealCell(row, col) {
		if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
			return;
		}

		if (this.revealed[row][col] || this.flagged[row][col]) {
			return;
		}

		this.revealed[row][col] = true;

		if (this.board[row][col] === 0) {
			for (let dr = -1; dr <= 1; dr++) {
				for (let dc = -1; dc <= 1; dc++) {
					this.revealCell(row + dr, col + dc);
				}
			}
		}
	}

	toggleFlag(row, col) {
		if (this.phase !== 'playing') {
			return { error: 'Game is already over.' };
		}

		if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
			return { error: 'Invalid cell.' };
		}

		if (this.revealed[row][col]) {
			return { error: 'Cannot flag revealed cell.' };
		}

		this.flagged[row][col] = !this.flagged[row][col];

		return {
			status: 'flagged',
			board: this.renderBoard(),
			flagged: this.flagged[row][col]
		};
	}

	checkWin() {
		for (let r = 0; r < this.rows; r++) {
			for (let c = 0; c < this.cols; c++) {
				if (this.board[r][c] !== -1 && !this.revealed[r][c]) {
					return false;
				}
			}
		}

		return true;
	}

	renderBoard(showMines = false) {
		let output = '';

		output += '   ';

		for (let c = 0; c < this.cols; c++) {
			output += `${c + 1}️⃣`;
		}

		output += '\n';

		for (let r = 0; r < this.rows; r++) {
			output += `${String.fromCharCode(65 + r)} `;

			for (let c = 0; c < this.cols; c++) {
				if (this.flagged[r][c] && !showMines) {
					output += CELL.FLAG;
				} else if (this.revealed[r][c]) {
					if (this.board[r][c] === -1) {
						output += CELL.MINE;
					} else if (this.board[r][c] === 0) {
						output += CELL.EMPTY;
					} else {
						output += NUMBER_EMOJI[this.board[r][c]];
					}
				} else if (showMines && this.board[r][c] === -1) {
					output += '💣';
				} else {
					output += CELL.HIDDEN;
				}
			}

			output += '\n';
		}

		return output;
	}

	getGameDuration() {
		const endTime = new Date().getTime();
		const durationMs = endTime - this.gameTimeStarted;

		const seconds = Math.floor((durationMs / 1000) % 60);
		const minutes = Math.floor((durationMs / (1000 * 60)) % 60);

		const parts = [];

		if (minutes > 0) {
			parts.push(`${minutes}m`);
		}

		if (seconds > 0 || parts.length === 0) {
			parts.push(`${seconds}s`);
		}

		return parts.join(' ');
	}

	getStatus() {
		let flagCount = 0;

		for (let r = 0; r < this.rows; r++) {
			for (let c = 0; c < this.cols; c++) {
				if (this.flagged[r][c]) {
					flagCount++;
				}
			}
		}

		return {
			phase: this.phase,
			difficulty: this.difficulty,
			rows: this.rows,
			cols: this.cols,
			totalMines: this.totalMines,
			flagsUsed: flagCount,
			duration: this.getGameDuration()
		};
	}
}
