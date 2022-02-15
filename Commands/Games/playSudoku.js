export default {
	name: "sudoku",
	description: "Play Sudoku",
	usage: "!sudoku",
	aliases: ["sd"],
	category: "Games",
	async run(message, client) {
		try {
			const { makePuzzle, solvePuzzle } = await import("../../Utils/Games/sudoku.js");
		} catch (err) {
			console.log(err);
		}
	},
};
