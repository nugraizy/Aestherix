export const PIECES = {
	KING: 'K',
	QUEEN: 'Q',
	ROOK: 'R',
	BISHOP: 'B',
	KNIGHT: 'N',
	PAWN: 'P'
};

export const COLORS = {
	WHITE: 'w',
	BLACK: 'b'
};

export const PIECE_SYMBOLS = {
	wK: '♔',
	wQ: '♕',
	wR: '♖',
	wB: '♗',
	wN: '♘',
	wP: '♙',
	bK: '♚',
	bQ: '♛',
	bR: '♜',
	bB: '♝',
	bN: '♞',
	bP: '♟'
};

export const INITIAL_BOARD = [
	['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
	['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
	['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
];

export const COLUMN_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export const createBoard = () => {
	return INITIAL_BOARD.map((row) => [...row]);
};

export const cloneBoard = (board) => {
	return board.map((row) => [...row]);
};

export const getPieceColor = (piece) => {
	if (!piece) {
		return null;
	}

	return piece[0];
};

export const getPieceType = (piece) => {
	if (!piece) {
		return null;
	}

	return piece[1];
};

export const isOwnPiece = (piece, color) => {
	return getPieceColor(piece) === color;
};

export const isEnemyPiece = (piece, color) => {
	const pieceColor = getPieceColor(piece);

	return pieceColor && pieceColor !== color;
};

export const isEmpty = (piece) => {
	return piece === null;
};

export const parsePosition = (pos) => {
	if (!pos || pos.length !== 2) {
		return null;
	}

	const col = COLUMN_LETTERS.indexOf(pos[0].toLowerCase());
	const row = 8 - parseInt(pos[1], 10);

	if (col < 0 || col > 7 || row < 0 || row > 7) {
		return null;
	}

	return { row, col };
};

export const formatPosition = (row, col) => {
	return `${COLUMN_LETTERS[col]}${8 - row}`;
};

export const renderBoard = (board, perspective = 'w') => {
	let output = '';

	if (perspective === 'b') {
		output += '  h g f e d c b a\n';

		for (let r = 0; r < 8; r++) {
			output += `${8 - r} `;

			for (let c = 7; c >= 0; c--) {
				const piece = board[r][c];
				const symbol = piece ? PIECE_SYMBOLS[piece] : '⬜';

				output += `${symbol} `;
			}

			output += ` ${8 - r}\n`;
		}

		output += '  h g f e d c b a';
	} else {
		output += '  a b c d e f g h\n';

		for (let r = 7; r >= 0; r--) {
			output += `${8 - r} `;

			for (let c = 0; c < 8; c++) {
				const piece = board[r][c];
				const symbol = piece ? PIECE_SYMBOLS[piece] : '⬜';

				output += `${symbol} `;
			}

			output += ` ${8 - r}\n`;
		}

		output += '  a b c d e f g h';
	}

	return output;
};

export const renderBoardCompact = (board) => {
	let output = '';

	for (let r = 7; r >= 0; r--) {
		for (let c = 0; c < 8; c++) {
			const piece = board[r][c];

			output += piece ? PIECE_SYMBOLS[piece] : '⬜';
		}

		output += '\n';
	}

	return output.trim();
};
