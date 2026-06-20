import configuration from '../../../helper/config/connect.js';

const EMOJIS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🍑', '🥝', '🍍', '🥭', '🍐', '🍌'];

const DIFFICULTIES = {
	easy: { rows: 3, cols: 4 },
	medium: { rows: 4, cols: 4 },
	hard: { rows: 4, cols: 5 }
};

export class MemoryMatch {
	constructor(playerId, difficulty = 'easy') {
		this.playerId = playerId;
		this.difficulty = difficulty;

		const config = DIFFICULTIES[difficulty] || DIFFICULTIES.easy;

		this.rows = config.rows;
		this.cols = config.cols;
		this.totalPairs = (this.rows * this.cols) / 2;
		this.board = [];
		this.revealed = [];
		this.matched = [];
		this.moves = 0;
		this.matchedPairs = 0;
		this.phase = 'playing';
		this.gameTimeStarted = new Date().getTime();
		this.firstCard = null;
		this.secondCard = null;

		this.initBoard();
	}

	static getSession(playerId) {
		return configuration.games.memoryMatch.get(playerId);
	}

	static deleteSession(playerId) {
		configuration.games.memoryMatch.delete(playerId);
	}

	play() {
		configuration.games.memoryMatch.set(this.playerId, this);
	}

	initBoard() {
		const pairs = EMOJIS.slice(0, this.totalPairs);
		const cards = [...pairs, ...pairs];

		for (let i = cards.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));

			[cards[i], cards[j]] = [cards[j], cards[i]];
		}

		this.board = [];

		for (let r = 0; r < this.rows; r++) {
			this.board.push(cards.slice(r * this.cols, (r + 1) * this.cols));
		}

		this.revealed = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
		this.matched = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
	}

	revealCard(row, col) {
		if (this.phase !== 'playing') {
			return { error: 'Game is already over.' };
		}

		if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
			return { error: 'Invalid card.' };
		}

		if (this.revealed[row][col] || this.matched[row][col]) {
			return { error: 'Card already revealed.' };
		}

		if (this.firstCard && this.secondCard) {
			return { error: 'Wait for cards to flip back.' };
		}

		this.revealed[row][col] = true;
		this.moves++;

		if (!this.firstCard) {
			this.firstCard = { row, col, emoji: this.board[row][col] };

			return {
				status: 'first',
				emoji: this.board[row][col],
				board: this.renderBoard(),
				moves: this.moves
			};
		}

		this.secondCard = { row, col, emoji: this.board[row][col] };

		if (this.firstCard.emoji === this.secondCard.emoji) {
			this.matched[this.firstCard.row][this.firstCard.col] = true;
			this.matched[row][col] = true;
			this.matchedPairs++;

			this.firstCard = null;
			this.secondCard = null;

			if (this.matchedPairs === this.totalPairs) {
				this.phase = 'won';

				return {
					status: 'win',
					emoji: this.board[row][col],
					board: this.renderBoard(),
					moves: this.moves,
					duration: this.getGameDuration()
				};
			}

			return {
				status: 'match',
				emoji: this.board[row][col],
				board: this.renderBoard(),
				moves: this.moves,
				matchedPairs: this.matchedPairs,
				totalPairs: this.totalPairs
			};
		}

		return {
			status: 'no_match',
			firstEmoji: this.firstCard.emoji,
			secondEmoji: this.board[row][col],
			board: this.renderBoard(),
			moves: this.moves
		};
	}

	flipBack() {
		if (this.firstCard && this.secondCard) {
			this.revealed[this.firstCard.row][this.firstCard.col] = false;
			this.revealed[this.secondCard.row][this.secondCard.col] = false;
			this.firstCard = null;
			this.secondCard = null;
		}
	}

	renderBoard() {
		let output = '   ';

		for (let c = 0; c < this.cols; c++) {
			output += `${c + 1}️⃣`;
		}

		output += '\n';

		for (let r = 0; r < this.rows; r++) {
			output += `${String.fromCharCode(65 + r)} `;

			for (let c = 0; c < this.cols; c++) {
				if (this.matched[r][c]) {
					output += this.board[r][c];
				} else if (this.revealed[r][c]) {
					output += this.board[r][c];
				} else {
					output = `${output}⬜`;
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
		return {
			phase: this.phase,
			difficulty: this.difficulty,
			rows: this.rows,
			cols: this.cols,
			moves: this.moves,
			matchedPairs: this.matchedPairs,
			totalPairs: this.totalPairs,
			duration: this.getGameDuration()
		};
	}
}
