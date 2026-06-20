import {
	getPieceColor,
	getPieceType,
	isOwnPiece,
	isEnemyPiece,
	isEmpty,
	cloneBoard,
	formatPosition
} from './board.js';

export const isInRange = (row, col) => {
	return row >= 0 && row < 8 && col >= 0 && col < 8;
};

export const getPawnMoves = (board, row, col, color) => {
	const moves = [];
	const direction = color === 'w' ? -1 : 1;
	const startRow = color === 'w' ? 6 : 1;

	const newRow = row + direction;

	if (isInRange(newRow, col) && isEmpty(board[newRow][col])) {
		moves.push({ row: newRow, col });

		const doubleRow = row + 2 * direction;

		if (row === startRow && isEmpty(board[doubleRow][col])) {
			moves.push({ row: doubleRow, col });
		}
	}

	for (const dc of [-1, 1]) {
		const newCol = col + dc;

		if (isInRange(newRow, newCol) && isEnemyPiece(board[newRow][newCol], color)) {
			moves.push({ row: newRow, col: newCol });
		}
	}

	return moves;
};

export const getKnightMoves = (board, row, col, color) => {
	const moves = [];
	const offsets = [
		[-2, -1],
		[-2, 1],
		[-1, -2],
		[-1, 2],
		[1, -2],
		[1, 2],
		[2, -1],
		[2, 1]
	];

	for (const [dr, dc] of offsets) {
		const newRow = row + dr;
		const newCol = col + dc;

		if (isInRange(newRow, newCol) && !isOwnPiece(board[newRow][newCol], color)) {
			moves.push({ row: newRow, col: newCol });
		}
	}

	return moves;
};

export const getSlidingMoves = (board, row, col, color, directions) => {
	const moves = [];

	for (const [dr, dc] of directions) {
		let newRow = row + dr;
		let newCol = col + dc;

		while (isInRange(newRow, newCol)) {
			if (isEmpty(board[newRow][newCol])) {
				moves.push({ row: newRow, col: newCol });
			} else if (isEnemyPiece(board[newRow][newCol], color)) {
				moves.push({ row: newRow, col: newCol });
				break;
			} else {
				break;
			}

			newRow += dr;
			newCol += dc;
		}
	}

	return moves;
};

export const getBishopMoves = (board, row, col, color) => {
	return getSlidingMoves(board, row, col, color, [
		[-1, -1],
		[-1, 1],
		[1, -1],
		[1, 1]
	]);
};

export const getRookMoves = (board, row, col, color) => {
	return getSlidingMoves(board, row, col, color, [
		[-1, 0],
		[1, 0],
		[0, -1],
		[0, 1]
	]);
};

export const getQueenMoves = (board, row, col, color) => {
	return [
		...getBishopMoves(board, row, col, color),
		...getRookMoves(board, row, col, color)
	];
};

export const getKingMoves = (board, row, col, color) => {
	const moves = [];
	const offsets = [
		[-1, -1],
		[-1, 0],
		[-1, 1],
		[0, -1],
		[0, 1],
		[1, -1],
		[1, 0],
		[1, 1]
	];

	for (const [dr, dc] of offsets) {
		const newRow = row + dr;
		const newCol = col + dc;

		if (isInRange(newRow, newCol) && !isOwnPiece(board[newRow][newCol], color)) {
			moves.push({ row: newRow, col: newCol });
		}
	}

	return moves;
};

export const getPieceMoves = (board, row, col, piece) => {
	const color = getPieceColor(piece);
	const type = getPieceType(piece);

	switch (type) {
		case 'P':
			return getPawnMoves(board, row, col, color);
		case 'N':
			return getKnightMoves(board, row, col, color);
		case 'B':
			return getBishopMoves(board, row, col, color);
		case 'R':
			return getRookMoves(board, row, col, color);
		case 'Q':
			return getQueenMoves(board, row, col, color);
		case 'K':
			return getKingMoves(board, row, col, color);
		default:
			return [];
	}
};

export const findKing = (board, color) => {
	for (let r = 0; r < 8; r++) {
		for (let c = 0; c < 8; c++) {
			const piece = board[r][c];

			if (piece && getPieceColor(piece) === color && getPieceType(piece) === 'K') {
				return { row: r, col: c };
			}
		}
	}

	return null;
};

export const isSquareAttacked = (board, row, col, byColor) => {
	for (let r = 0; r < 8; r++) {
		for (let c = 0; c < 8; c++) {
			const piece = board[r][c];

			if (piece && getPieceColor(piece) === byColor) {
				const moves = getPieceMoves(board, r, c, piece);

				if (moves.some((m) => m.row === row && m.col === col)) {
					return true;
				}
			}
		}
	}

	return false;
};

export const isInCheck = (board, color) => {
	const king = findKing(board, color);

	if (!king) {
		return false;
	}

	const enemyColor = color === 'w' ? 'b' : 'w';

	return isSquareAttacked(board, king.row, king.col, enemyColor);
};

export const simulateMove = (board, fromRow, fromCol, toRow, toCol) => {
	const newBoard = cloneBoard(board);
	const piece = newBoard[fromRow][fromCol];

	newBoard[toRow][toCol] = piece;
	newBoard[fromRow][fromCol] = null;

	return newBoard;
};

export const isMoveLegal = (board, fromRow, fromCol, toRow, toCol, color) => {
	const piece = board[fromRow][fromCol];

	if (!piece || getPieceColor(piece) !== color) {
		return false;
	}

	const moves = getPieceMoves(board, fromRow, fromCol, piece);

	if (!moves.some((m) => m.row === toRow && m.col === toCol)) {
		return false;
	}

	const newBoard = simulateMove(board, fromRow, fromCol, toRow, toCol);

	if (isInCheck(newBoard, color)) {
		return false;
	}

	return true;
};

export const getAllLegalMoves = (board, color) => {
	const moves = [];

	for (let r = 0; r < 8; r++) {
		for (let c = 0; c < 8; c++) {
			const piece = board[r][c];

			if (piece && getPieceColor(piece) === color) {
				const pieceMoves = getPieceMoves(board, r, c, piece);

				for (const move of pieceMoves) {
					if (isMoveLegal(board, r, c, move.row, move.col, color)) {
						moves.push({
							from: { row: r, col: c },
							to: { row: move.row, col: move.col }
						});
					}
				}
			}
		}
	}

	return moves;
};

export const isCheckmate = (board, color) => {
	if (!isInCheck(board, color)) {
		return false;
	}

	return getAllLegalMoves(board, color).length === 0;
};

export const isStalemate = (board, color) => {
	if (isInCheck(board, color)) {
		return false;
	}

	return getAllLegalMoves(board, color).length === 0;
};

export const parseMove = (moveStr) => {
	if (!moveStr || moveStr.length < 4) {
		return null;
	}

	const from = moveStr.substring(0, 2).toLowerCase();
	const to = moveStr.substring(2, 4).toLowerCase();
	const promotion = moveStr.length > 4 ? moveStr[4].toLowerCase() : null;

	return { from, to, promotion };
};

export const formatMove = (fromRow, fromCol, toRow, toCol) => {
	return `${formatPosition(fromRow, fromCol)}${formatPosition(toRow, toCol)}`;
};

export const getMoveNotation = (board, fromRow, fromCol, toRow, toCol, promotion = null) => {
	const piece = board[fromRow][fromCol];
	const type = getPieceType(piece);
	const captured = board[toRow][toCol] !== null;
	const fromPos = formatPosition(fromRow, fromCol);
	const toPos = formatPosition(toRow, toCol);

	if (type === 'K' && Math.abs(toCol - fromCol) === 2) {
		return toCol > fromCol ? 'O-O' : 'O-O-O';
	}

	let notation = '';

	if (type !== 'P') {
		notation += type;
	}

	if (captured) {
		if (type === 'P') {
			notation += fromPos[0];
		}

		notation += 'x';
	}

	notation += toPos;

	if (promotion) {
		notation += `=${promotion.toUpperCase()}`;
	}

	return notation;
};
