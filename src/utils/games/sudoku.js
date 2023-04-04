/* eslint-disable */
const keycaps = {
	0: '0️⃣',
	1: '1️⃣',
	2: '2️⃣',
	3: '3️⃣',
	4: '4️⃣',
	5: '5️⃣',
	6: '6️⃣',
	7: '7️⃣',
	8: '8️⃣',
	9: '9️⃣',
};
const LEVEL = {
	easy: 60,
	medium: 50,
	hard: 30,
	insane: 15,
};

export const makePuzzle = (level) => {
	let board;

	if (level === undefined) {
		level = LEVEL['easy'];
	} else {
		level = LEVEL[level] || LEVEL['easy'];
	}

	board = solvePuzzle(Array(81).fill(null));
	let puzzle = [];
	let deduced = Array(81).fill(null);
	let order = [...Array(81).keys()];

	shuffleArray(order);

	for (let i = 0; i < order.length; i++) {
		let pos = order[i];

		if (deduced[pos] === null) {
			puzzle.push({
				pos: pos,
				num: board[pos],
			});
			deduced[pos] = board[pos];
			deduce(deduced);
		}
	}

	shuffleArray(puzzle);

	for (let i = puzzle.length - 1; i >= 0; i--) {
		let e = puzzle[i];

		removeElement(puzzle, i);
		let rating = checkpuzzle(boardforentries(puzzle), board);

		if (rating === -1) {
			puzzle.push(e);
		}
	}

	let boards = boardforentries(puzzle);

	boards = makeItEasy(boards, level);
	return boards;
};

function ratepuzzle(puzzle, samples) {
	let total = 0;

	for (let i = 0; i < samples; i++) {
		let tuple = solveboard(puzzle);

		if (tuple.answer === null) {
			return -1;
		}

		total += tuple.state.length;
	}

	return total / samples;
}

function checkpuzzle(puzzle, board) {
	if (board === undefined) {
		board = null;
	}

	let tuple1 = solveboard(puzzle);

	if (tuple1.answer === null) {
		return -1;
	}

	if (board != null && !boardmatches(board, tuple1.answer)) {
		return -1;
	}

	let difficulty = tuple1.state.length;
	let tuple2 = solvenext(tuple1.state);

	if (tuple2.answer != null) {
		return -1;
	}

	return difficulty;
}

export const solvePuzzle = (board) => solveboard(board).answer;

function solveboard(original) {
	let board = [].concat(original);
	let guesses = deduce(board);

	if (guesses === null) {
		return {
			state: [],
			answer: board,
		};
	}

	let track = [
		{
			guesses: guesses,
			count: 0,
			board: board,
		},
	];

	return solvenext(track);
}

function solvenext(remembered) {
	while (remembered.length > 0) {
		let tuple1 = remembered.pop();

		if (tuple1.count >= tuple1.guesses.length) {
			continue;
		}

		remembered.push({
			guesses: tuple1.guesses,
			count: tuple1.count + 1,
			board: tuple1.board,
		});
		let workspace = [].concat(tuple1.board);
		let tuple2 = tuple1.guesses[tuple1.count];

		workspace[tuple2.pos] = tuple2.num;
		let guesses = deduce(workspace);

		if (guesses === null) {
			return {
				state: remembered,
				answer: workspace,
			};
		}

		remembered.push({
			guesses: guesses,
			count: 0,
			board: workspace,
		});
	}

	return {
		state: [],
		answer: null,
	};
}

function deduce(board) {
	while (true) {
		let stuck = true;
		let guess = null;
		let count = 0;

		let tuple1 = figurebits(board);
		let allowed = tuple1.allowed;
		let needed = tuple1.needed;

		for (let pos = 0; pos < 81; pos++) {
			if (board[pos] === null) {
				let numbers = listbits(allowed[pos]);

				if (numbers.length === 0) {
					return [];
				} else if (numbers.length === 1) {
					board[pos] = numbers[0];
					stuck = false;
				} else if (stuck) {
					let t = numbers.map(function (val, key) {
						return {
							pos: pos,
							num: val,
						};
					});
					let tuple2 = pickbetter(guess, count, t);

					guess = tuple2.guess;
					count = tuple2.count;
				}
			}
		}

		if (!stuck) {
			let tuple3 = figurebits(board);

			allowed = tuple3.allowed;
			needed = tuple3.needed;
		}

		for (let axis = 0; axis < 3; axis++) {
			for (let x = 0; x < 9; x++) {
				let numbers = listbits(needed[axis * 9 + x]);

				for (let i = 0; i < numbers.length; i++) {
					let n = numbers[i];
					let bit = 1 << n;
					let spots = [];

					for (let y = 0; y < 9; y++) {
						let pos = posfor(x, y, axis);

						if (allowed[pos] & bit) {
							spots.push(pos);
						}
					}

					if (spots.length === 0) {
						return [];
					} else if (spots.length === 1) {
						board[spots[0]] = n;
						stuck = false;
					} else if (stuck) {
						let t = spots.map(function (val, key) {
							return {
								pos: val,
								num: n,
							};
						});
						let tuple4 = pickbetter(guess, count, t);

						guess = tuple4.guess;
						count = tuple4.count;
					}
				}
			}
		}

		if (stuck) {
			if (guess != null) {
				shuffleArray(guess);
			}

			return guess;
		}
	}
}

function figurebits(board) {
	let needed = [];
	let allowed = board.map(function (val, key) {
		return val === null ? 511 : 0;
	}, []);

	for (let axis = 0; axis < 3; axis++) {
		for (let x = 0; x < 9; x++) {
			let bits = axismissing(board, x, axis);

			needed.push(bits);

			for (let y = 0; y < 9; y++) {
				let pos = posfor(x, y, axis);

				allowed[pos] = allowed[pos] & bits;
			}
		}
	}

	return {
		allowed: allowed,
		needed: needed,
	};
}

function posfor(x, y, axis) {
	if (axis === undefined) {
		axis = 0;
	}

	if (axis === 0) {
		return x * 9 + y;
	} else if (axis === 1) {
		return y * 9 + x;
	}

	return [0, 3, 6, 27, 30, 33, 54, 57, 60][x] + [0, 1, 2, 9, 10, 11, 18, 19, 20][y];
}

function axisfor(pos, axis) {
	if (axis === 0) {
		return Math.floor(pos / 9);
	} else if (axis === 1) {
		return pos % 9;
	}

	return Math.floor(pos / 27) * 3 + (Math.floor(pos / 3) % 3);
}

function axismissing(board, x, axis) {
	let bits = 0;

	for (let y = 0; y < 9; y++) {
		const e = board[posfor(x, y, axis)];

		if (e != null) {
			bits |= 1 << e;
		}
	}

	return 511 ^ bits;
}

function listbits(bits) {
	let list = [];

	for (let y = 0; y < 9; y++) {
		if ((bits & (1 << y)) != 0) {
			list.push(y);
		}
	}

	return list;
}

function allowed(board, pos) {
	let bits = 511;

	for (let axis = 0; axis < 3; axis++) {
		const x = axisfor(pos, axis);

		bits = bits & axismissing(board, x, axis);
	}

	return bits;
}

function pickbetter(b, c, t) {
	if (b === null || t.length < b.length) {
		return {
			guess: t,
			count: 1,
		};
	} else if (t.length > b.length) {
		return {
			guess: b,
			count: c,
		};
	} else if (randomInt(c) === 0) {
		return {
			guess: t,
			count: c + 1,
		};
	}

	return {
		guess: b,
		count: c + 1,
	};
}

function boardforentries(entries) {
	const board = Array(81).fill(null);

	for (const item of entries) {
		let { num, pos } = item;

		board[pos] = num;
	}

	return board;
}

function boardmatches(b1, b2) {
	for (let i = 0; i < 81; i++) {
		if (b1[i] != b2[i]) {
			return false;
		}
	}

	return true;
}

function randomInt(max) {
	return Math.floor(Math.random() * (max + 1));
}

function shuffleArray(original) {
	for (let i = original.length - 1; i > 0; i--) {
		const j = randomInt(i);
		const contents = original[i];

		original[i] = original[j];
		original[j] = contents;
	}
}

function removeElement(array, from, to) {
	const rest = array.slice((to || from) + 1 || array.length);

	array.length = from < 0 ? array.length + from : from;
	return array.push(...rest);
}

function makeItEasy(board, level) {
	const emptyCells = [];
	const solve = solvePuzzle(board);

	for (let i = 0; i < board.length; i++) {
		if (board[i] === null) {
			emptyCells.push(i);
		}
	}

	for (let i = 0; i < level; i++) {
		const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];

		board[randomIndex] = solve[randomIndex];
		emptyCells.splice(randomIndex, 1);
	}

	return board;
}

export const revealOneElement = (board, solvedBoard) => {
	const emptyCells = [];
	const tempBoard = board;

	for (let i = 0; i < board.length; i++) {
		if (board[i] === 'X') {
			emptyCells.push(i);
		}
	}

	const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];

	board[randomIndex] = solvedBoard[randomIndex];
	tempBoard[randomIndex] = keycaps[solvedBoard[randomIndex]];
	return { board, tempBoard };
};

function allowedMove(post, num, board, solvedBoard) {
	const postAx = post[0].toLowerCase();
	let postNum = Number(post[1]);

	num = Number(num);

	if (postAx === 'a') {
		postNum -= 1;
	} else if (postAx === 'b') {
		postNum = postNum + 9 * 1 - 1;
	} else if (postAx === 'c') {
		postNum = postNum + 9 * 2 - 1;
	} else if (postAx === 'd') {
		postNum = postNum + 9 * 3 - 1;
	} else if (postAx === 'e') {
		postNum = postNum + 9 * 4 - 1;
	} else if (postAx === 'f') {
		postNum = postNum + 9 * 5 - 1;
	} else if (postAx === 'g') {
		postNum = postNum + 9 * 6 - 1;
	} else if (postAx === 'h') {
		postNum = postNum + 9 * 7 - 1;
	} else if (postAx === 'i') {
		postNum = postNum + 9 * 8 - 1;
	}

	if (board[postNum] !== 'X') {
		return { status: false, statusPlay: 'Already Filled', message: 'Posisi ini telah diisi.' };
	} else if (num !== solvedBoard[postNum]) {
		return { status: false, statusPlay: 'Wrong move', message: `Jawaban kamu bukan merupakan solusi di grid ${post}.` };
	} else {
		return { status: true, statusPlay: 'Playing', post: postNum, message: `Kamu benar. Grid ${post} adalah ${num}` };
	}
}

export const checkWin = (board) => {
	if (board.filter((x) => x === 'X').length === 0) {
		return { status: true, message: 'Selamat, kamu berhasil menyelesaikan puzzle ini.' };
	}

	return { status: false };
};

export const stringifyGrid = (grid) => {
	let capt = '\n   1  2  3      4  5  6      7  8  9\n';
	let abjad = 'ABCDEFGHI'.split('').map((v) => v + '.');

	for (let i = 0; i < grid.length; i++) {
		if (grid[i] === null) {
			grid[i] = 'X';
		}

		if (i === 0) {
			capt += `${abjad[0]} ${grid[i]} `;
		} else if (i % 3 === 0) {
			capt += `${abjad[i / 9] === 'I.' ? `${abjad[i / 9]} ` : abjad[i / 9] || ''}  ${grid[i]} `;
		} else {
			capt += `${grid[i]} `;
		}

		if (i % 3 === 2 && i % 9 != 8) {
			capt += '  |  ';
		}

		if (i % 9 === 8) {
			capt += '\n';
		}

		if (i % 27 === 26 && i != 80) {
			capt += '━━━━━━━━━━━━\n';
		}
	}

	return capt;
};

export const fillGrid = (post, num, board, solvedBoard) => {
	let grids = allowedMove(post, num, board, solvedBoard);
	let tempBoard = board;

	if (grids.status && grids.statusPlay === 'Playing') {
		board[grids.post] = Number(num);
		tempBoard[grids.post] = keycaps[num];
		return { status: true, statusPlaying: grids.statusPlay, grid: board, gridSolved: solvedBoard, tempBoard };
	} else {
		return {
			statusPlaying: grids.statusPlay,
			message: grids.message,
		};
	}
};
