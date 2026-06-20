import configuration from '../../../helper/config/connect.js';
import {
	createBoard,
	isOwnPiece,
	renderBoard,
	parsePosition,
	formatPosition,
	COLORS
} from './board.js';
import {
	isMoveLegal,
	isInCheck,
	isCheckmate,
	isStalemate,
	simulateMove,
	getMoveNotation
} from './moves.js';

export class Chess {
	constructor(roomId, whitePlayer, blackPlayer = null) {
		this.roomId = roomId;
		this.whitePlayer = whitePlayer;
		this.blackPlayer = blackPlayer;
		this.board = createBoard();
		this.turn = COLORS.WHITE;
		this.phase = 'waiting';
		this.moveHistory = [];
		this.gameTimeStarted = new Date().getTime();
		this.lastMove = null;
		this.drawOffered = false;
		this.drawOfferedBy = null;
	}

	static getSession(roomId) {
		return configuration.games.chess.get(roomId);
	}

	static deleteSession(roomId) {
		configuration.games.chess.delete(roomId);
	}

	play() {
		configuration.games.chess.set(this.roomId, this);
	}

	startGame(blackPlayer) {
		this.blackPlayer = blackPlayer;
		this.phase = 'playing';
	}

	getCurrentPlayer() {
		return this.turn === COLORS.WHITE ? this.whitePlayer : this.blackPlayer;
	}

	getPlayerColor(playerId) {
		if (playerId === this.whitePlayer) {
			return COLORS.WHITE;
		}

		if (playerId === this.blackPlayer) {
			return COLORS.BLACK;
		}

		return null;
	}

	makeMove(playerId, fromStr, toStr, promotion = null) {
		if (this.phase !== 'playing') {
			return { error: 'Game is not in progress.' };
		}

		const playerColor = this.getPlayerColor(playerId);

		if (!playerColor) {
			return { error: 'You are not a player in this game.' };
		}

		if (playerColor !== this.turn) {
			return { error: 'Not your turn.' };
		}

		const from = parsePosition(fromStr);
		const to = parsePosition(toStr);

		if (!from || !to) {
			return { error: 'Invalid position format. Use algebraic notation (e.g., e2, e4).' };
		}

		const piece = this.board[from.row][from.col];

		if (!piece) {
			return { error: 'No piece at that position.' };
		}

		if (!isOwnPiece(piece, playerColor)) {
			return { error: 'That is not your piece.' };
		}

		if (!isMoveLegal(this.board, from.row, from.col, to.row, to.col, playerColor)) {
			return { error: 'Illegal move.' };
		}

		const captured = this.board[to.row][to.col];
		const newBoard = simulateMove(this.board, from.row, from.col, to.row, to.col);
		const notation = getMoveNotation(this.board, from.row, from.col, to.row, to.col, promotion);

		this.board = newBoard;
		this.lastMove = { from, to };
		this.moveHistory.push({
			from: formatPosition(from.row, from.col),
			to: formatPosition(to.row, to.col),
			notation,
			piece,
			captured
		});

		const nextColor = this.turn === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;

		this.turn = nextColor;

		if (isCheckmate(this.board, nextColor)) {
			this.phase = 'ended';

			return {
				status: 'checkmate',
				winner: playerColor,
				winnerId: playerId,
				notation,
				board: renderBoard(this.board, COLORS.WHITE),
				duration: this.getGameDuration()
			};
		}

		if (isStalemate(this.board, nextColor)) {
			this.phase = 'ended';

			return {
				status: 'stalemate',
				notation,
				board: renderBoard(this.board, COLORS.WHITE),
				duration: this.getGameDuration()
			};
		}

		const inCheck = isInCheck(this.board, nextColor);

		return {
			status: inCheck ? 'check' : 'continue',
			notation,
			board: renderBoard(this.board, COLORS.WHITE),
			nextPlayer: this.getCurrentPlayer(),
			inCheck
		};
	}

	offerDraw(playerId) {
		if (this.phase !== 'playing') {
			return { error: 'Game is not in progress.' };
		}

		const playerColor = this.getPlayerColor(playerId);

		if (!playerColor) {
			return { error: 'You are not a player in this game.' };
		}

		if (this.drawOffered && this.drawOfferedBy !== playerId) {
			this.phase = 'ended';

			return {
				status: 'draw_accepted',
				duration: this.getGameDuration()
			};
		}

		this.drawOffered = true;
		this.drawOfferedBy = playerId;

		return {
			status: 'draw_offered'
		};
	}

	resign(playerId) {
		if (this.phase !== 'playing') {
			return { error: 'Game is not in progress.' };
		}

		const playerColor = this.getPlayerColor(playerId);

		if (!playerColor) {
			return { error: 'You are not a player in this game.' };
		}

		this.phase = 'ended';

		const winnerColor = playerColor === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
		const winnerId = winnerColor === COLORS.WHITE ? this.whitePlayer : this.blackPlayer;

		return {
			status: 'resigned',
			winner: winnerColor,
			winnerId,
			duration: this.getGameDuration()
		};
	}

	getBoard(perspective = 'w') {
		return renderBoard(this.board, perspective);
	}

	getStatus() {
		return {
			phase: this.phase,
			turn: this.turn,
			currentPlayer: this.getCurrentPlayer(),
			whitePlayer: this.whitePlayer,
			blackPlayer: this.blackPlayer,
			moveCount: this.moveHistory.length,
			inCheck: isInCheck(this.board, this.turn),
			duration: this.getGameDuration()
		};
	}

	getMoveHistory() {
		return this.moveHistory.map((move, i) => {
			const moveNum = Math.floor(i / 2) + 1;
			const isWhite = i % 2 === 0;

			return `${moveNum}${isWhite ? '.' : '...'} ${move.notation}`;
		});
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
}
