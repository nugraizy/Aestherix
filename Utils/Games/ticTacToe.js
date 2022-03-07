import { shuffleArray, getSeconds, getAverage } from "../../Helper/Modules/index.js";

const MODELS = { player1: "❌", player2: "⭕" };
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

const init = (player1, player2, MODEL, randomTurn) => ({
	player1,
	player2,
	P1Model: MODEL[player1],
	P2Model: MODEL[player2],
	[player1]: MODEL[player1],
	[player2]: MODEL[player2],
	board: ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"],
	turnModel: MODEL[randomTurn[0]],
	turnPlayer: randomTurn[0],
	playBoard: ["", "", "", "", "", "", "", "", ""],
	isPlaying: false,
	isWon: false,
	winnerModel: null,
	played: Date.now(),
	statistic: [{ [player1]: {} }, { [player2]: {} }],
});

const isSet = (key) => {
	const status = games.tictactoe.get(key) || false;
	return status;
};

const getSession = (key) => games.tictactoe.get(key) || Array.from(games.tictactoe.values()).find((obj) => obj.player2 === key);

const deleteSession = async (key) => {
	const session = getSession(key);
	games.tictactoe.delete(key);
	return session;
};

const checkCombo = (board, model) => {
	for (let i = 0; i < COMBOS.length; i++) {
		const [a, b, c] = COMBOS[i];
		if (board[a] === model && board[b] === model && board[c] === model) return { status: true, model };
	}
	return { status: false };
};

const minimax = (board, depth, isMaximizing) => {
	const result = checkCombo(board, MODELS.player1);
	if (result.status) return { score: 10 - depth };
	const result2 = checkCombo(board, MODELS.player2);
	if (result2.status) return { score: depth - 10 };
	if (board.every((val) => val !== "")) return { score: 0 };
	let bestScore = isMaximizing ? -Infinity : Infinity;
	let bestMove = null;
	for (let i = 0; i < board.length; i++) {
		if (board[i] === "") {
			board[i] = isMaximizing ? MODELS.player1 : MODELS.player2;
			const score = minimax(board, depth + 1, !isMaximizing).score;
			board[i] = "";
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
};

export const play = (player2, player1) => {
	if (player2 == "computer") {
		Array.from(games.tictactoe.values()).find((obj) => obj.player1 === player1).isPlaying = true;
		const session = getSession(player1);
		if (session.turnPlayer === player2) {
			const moves = minimax(session.playBoard, 0, true).move;
			session.playBoard[moves] = session.turnPlayer === session.player1 ? session.P1Model : session.P2Model;
			session.board[moves] = session.turnPlayer === session.player1 ? session.P1Model : session.P2Model;
			session.turnPlayer = player1;
			session.turnModel = session.P1Model;
			return { move: moves, ...session };
		}
		return Array.from(games.tictactoe.values()).find((obj) => obj.player1 === player1);
	}
	const session = Array.from(games.tictactoe.values()).find((obj) => obj.player2 === player2);
	session.isPlaying = true;
	return true;
};

const isDraw = (board) => {
	for (let i = 0; i < board.length; i++) {
		if (board[i] === "") return false;
	}
	return true;
};

const isCorrectMove = (key, move) => {
	const session = getSession(key);
	if (!session) return { status: "NO_GAME" };
	const { playBoard, turnPlayer } = session;
	const isCorrect = playBoard[move - 1] === "";
	if (key !== turnPlayer) return { status: "WRONG_TURN" };
	if (!isCorrect) return { status: "WRONG_MOVE" };
	return { status: "OK" };
};

export const move = async (key, input) => {
	const session = getSession(key);
	if (!session) return { status: "NO_GAME" };
	const { status } = isCorrectMove(key, input);
	if (status === "WRONG_TURN") return { status };
	if (status === "WRONG_MOVE") return { status };
	session.playBoard[input - 1] = session.turnPlayer === session.player1 ? session.P1Model : session.P2Model;
	session.board[input - 1] = session.turnPlayer === session.player1 ? session.P1Model : session.P2Model;
	session.turnPlayer = session.turnPlayer === session.player1 ? session.player2 : session.player1;
	const winner = checkCombo(session.playBoard, session.playBoard[input - 1], key);
	const draw = isDraw(session.playBoard);
	if (draw) {
		await deleteSession(key);
		return { status: "DRAW", ...session };
	}
	session.statistic.find((obj) => obj[key])[key].totalMove = session.statistic.find((obj) => obj[key])[key].totalMove + 1 || 1;
	session.statistic.find((obj) => obj[key])[key][`move${session.statistic.find((obj) => obj[key])[key].totalMove}`] = getSeconds(session.played);
	session.played = Date.now();
	if (winner.status) {
		const [player1, player2] = [].concat(...session.statistic.map((v) => Object.keys(v)));
		const timeP1 = Object.keys(session.statistic.find((obj) => obj[player1])[player1])
			.filter((key) => !key.includes("totalMove"))
			.map((key) => session.statistic.find((obj) => obj[player1])[player1][key]);
		const timeP2 = Object.keys(session.statistic.find((obj) => obj[player2])[player2])
			.filter((key) => !key.includes("totalMove"))
			.map((key) => session.statistic.find((obj) => obj[player1])[player1][key]);
		session.isPlaying = false;
		session.winnerModel = winner.model;
		await deleteSession(key);
		if (session.turnPlayer == "computer") {
			return { status: "WINNER", avgP1: getAverage(timeP1), winner: winner.model, ...session };
		}
		return { status: "WINNER", avgP1: getAverage(timeP1), avgP2: getAverage(timeP2), winner: winner.model, ...session };
	}
	if (session.turnPlayer == "computer") {
		const move = minimax(session.playBoard, 0, true).move;
		session.playBoard[move] = session.turnPlayer === session.player1 ? session.P1Model : session.P2Model;
		session.board[move] = session.turnPlayer === session.player1 ? session.P1Model : session.P2Model;
		session.turnPlayer = session.turnPlayer === session.player1 ? session.player2 : session.player1;
		const winner = checkCombo(session.playBoard, session.playBoard[move]);
		const draw = isDraw(session.playBoard);
		if (draw) {
			await deleteSession(key);
			return { status: "DRAW", ...session };
		}
		session.statistic.find((obj) => obj[key])[key].totalMove = session.statistic.find((obj) => obj[key])[key].totalMove + 1 || 1;
		session.statistic.find((obj) => obj[key])[key][`move${session.statistic.find((obj) => obj[key])[key].totalMove}`] = getSeconds(session.played);
		session.played = Date.now();
		if (winner.status) {
			const [player1] = [].concat(...session.statistic.map((v) => Object.keys(v)));
			const timeP1 = Object.keys(session.statistic.find((obj) => obj[player1])[player1])
				.filter((key) => !key.includes("totalMove"))
				.map((key) => session.statistic.find((obj) => obj[player1])[player1][key]);
			session.isPlaying = false;
			session.winnerModel = winner.model;
			await deleteSession(key);
			return { status: "WINNER", botWinner: true, avgP1: getAverage(timeP1), winner: winner.model, ...session };
		}
	}
	return { status, ...session };
};

export const start = (key, player2 = "computer") => {
	if (isSet(key)) return false;
	const randomTurn = shuffleArray([key, player2]);
	const MODEL = { [randomTurn[0]]: "❌", [randomTurn[1]]: "⭕" };
	games.tictactoe.set(key, init(key, player2, MODEL, randomTurn));
	if (player2 === "computer") {
		return play(player2, key);
	}
	return games.tictactoe.get(key);
};
