import path from "path";
import { __dirname } from "../../connect.js";
import { readJSON, writeJSON, getTimeSince } from "../../Helper/Modules/index.js";
import { makePuzzle, solvePuzzle, stringifyGrid, fillGrid, checkWin, revealOneElement } from "../../Utils/Games/index.js";

export default {
	name: "sudoku",
	description: "Play Sudoku",
	usage: "!sudoku",
	aliases: ["sd"],
	category: "Games",
	cooldown: 2,
	limit: 0,
	async run({ args, sender, from, message, isOwner, cmd }, client) {
		try {
			const buttons = [{ buttonId: "", buttonText: { displayText: "" }, type: 1 }];
			const data = readJSON(path.join(__dirname, "Databases/Games/Sudoku/sudoku.json"));
			if (/(play|main)/.test(args[1])) {
				const index = data.length == 0 ? -1 : data.findIndex((v) => v.id == from);
				if (index == -1) {
					const puzzle = makePuzzle("easy");
					const solved = solvePuzzle(puzzle);
					const grid = stringifyGrid(puzzle);
					const gridSolved = stringifyGrid(solved);
					if (isOwner) client[botNum].reply(from, gridSolved);
					buttons[0].buttonId = ".sd clue";
					buttons[0].buttonText.displayText = "Sisa Clue : 5";
					const messages = client[botNum].buttonText(from, `${grid}\nGame ini masi di tahap beta.\nKesulitan masi dalam proses perbaikan.\nGunakan Nomor 0 untuk mengganti nomor 9.`, "Made by nanda", buttons, { quoted: message });
					data.push({
						id: from,
						startsBy: sender,
						clue: 5,
						startedAt: Date.now(),
						guessedBy: [],
						messages,
						puzzle,
						solved,
					});
					return writeJSON(path.join(__dirname, "Databases/Games/Sudoku/sudoku.json"), data);
				}
				client[botNum].reply(from, "Kamu sudah ada permainan Sudoku yang sedang berjalan.");
			} else if (/([A-Ia-i])[1-9]/.test(args[1])) {
				if (args[2].length > 2) return client[botNum].reply(from, `Format salah\n\nex : ${cmd} A2 7`);
				if (!args[2]) return client[botNum].reply(from, `Tolong masukkan nomor kolom\n\nex : ${cmd} A2 7`);
				const index = data.length == 0 ? -1 : data.findIndex((v) => v.id == from);
				if (index !== -1) {
					const fill = fillGrid(args[1], args[2], data[index].puzzle, data[index].solved);
					if (fill.statusPlaying == "Playing") {
						const isWin = checkWin(fill.grid);
						if (isWin.status) {
							data.splice(index, 1);
							writeJSON(path.join(__dirname, "Databases/Games/Sudoku/sudoku.json"), data);
							return client[botNum].reply(from, `${isWin.message}\n${stringifyGrid(fill.grid)}\n\nGame Time : ${getTimeSince(data[index].startedAt)}`);
						}
						data[index].puzzle = fill.grid;
						data[index].guessedBy.push(sender);
						writeJSON(path.join(__dirname, "Databases/Games/Sudoku/sudoku.json"), data);
						const grid = stringifyGrid(fill.tempBoard);
						buttons[0].buttonId = ".sd clue";
						buttons[0].buttonText.displayText = `Sisa Clue : ${data[index].clue == 0 ? "Habis" : data[index].clue}`;
						const messages = client[botNum].buttonText(from, `${grid}\nGame ini masi di tahap beta.\nKesulitan masi dalam proses perbaikan.\nGunakan Nomor 0 untuk mengganti nomor 9.`, "Made by nanda", buttons, { quoted: message });
						data[index].messages = messages;
						return writeJSON(path.join(__dirname, "Databases/Games/Sudoku/sudoku.json"), data);
					}
					return client[botNum].reply(from, fill.message);
				}
				buttons[0].buttonId = ".sudoku play";
				buttons[0].buttonText.displayText = "Play Sudoku!";
				return client[botNum].buttonText(from, `Belum ada sesi game sudoku. Mulai permainan dengan mengetik ${cmd} play atau pencet tombol dibawah`, "Made by nanda", buttons, { quoted: message });
			} else if (/clue/.test(args[1])) {
				const index = data.length == 0 ? -1 : data.findIndex((v) => v.id == from);
				if (index !== -1) {
					if (data[index].clue !== 0) {
						data[index].clue -= 1;
						writeJSON(path.join(__dirname, "Databases/Games/Sudoku/sudoku.json"), data);
						const reveal = revealOneElement(data[index].puzzle, data[index].solved);
						const isWin = checkWin(reveal.grid);
						if (isWin.status) {
							data.splice(index, 1);
							writeJSON(path.join(__dirname, "Databases/Games/Sudoku/sudoku.json"), data);
							return client[botNum].reply(from, `${isWin.message}\n${stringifyGrid(reveal.board)}\n\nGame Time : ${getTimeSince(data[index].startedAt)}`);
						}
						data[index].puzzle = reveal.board;
						const grid = stringifyGrid(reveal.tempBoard);
						buttons[0].buttonId = ".sd clue";
						buttons[0].buttonText.displayText = `Sisa Clue : ${data[index].clue == 0 ? "Habis" : data[index].clue}`;
						const messages = client[botNum].buttonText(from, `${grid}\nGame ini masi di tahap beta.\nKesulitan masi dalam proses perbaikan.\nGunakan Nomor 0 untuk mengganti nomor 9.`, "Made by nanda", buttons, { quoted: message });
						data[index].messages = messages;
						return writeJSON(path.join(__dirname, "Databases/Games/Sudoku/sudoku.json"), data);
					}
					return client[botNum].reply(from, "Clue is out!");
				}
				buttons[0].buttonId = ".sd play";
				buttons[0].buttonText.displayText = "Play Sudoku!";
				return client[botNum].buttonText(from, `Belum ada sesi game sudoku. Mulai permainan dengan mengetik ${cmd} play atau pencet tombol dibawah`, "Made by nanda", buttons, { quoted: message });
			} else if (/ch?ec?k?/.test(args[1])) {
				const index = data.length == 0 ? -1 : data.findIndex((v) => v.id == from);
				if (index !== -1) {
					const grid = stringifyGrid(data[index].puzzle);
					buttons[0].buttonId = ".sd clue";
					buttons[0].buttonText.displayText = `Sisa Clue : ${data[index].clue == 0 ? "Habis" : data[index].clue}`;
					const messages = client[botNum].buttonText(from, `${grid}\nGame ini masi di tahap beta.\nKesulitan masi dalam proses perbaikan.\nGunakan Nomor 0 untuk mengganti nomor 9.`, "Made by nanda", buttons, { quoted: message });
					data[index].messages = messages;
					return writeJSON(path.join(__dirname, "Databases/Games/Sudoku/sudoku.json"), data);
				}
				buttons[0].buttonId = ".sd play";
				buttons[0].buttonText.displayText = "Play Sudoku!";
				return client[botNum].buttonText(from, `Belum ada sesi game sudoku. Mulai permainan dengan mengetik ${cmd} play atau pencet tombol dibawah`, "Made by nanda", buttons, { quoted: message });
			} else if (/reset/.test(args[1])) {
				if (!isOwner) return;
				const index = data.length == 0 ? -1 : data.findIndex((v) => v.id == from);
				if (args[2] == "all") {
					data = [];
					return writeJSON(path.join(__dirname, "Databases/Games/Sudoku/sudoku.json"), data);
				}
				if (index !== -1) {
					data.splice(index, 1);
					return writeJSON(path.join(__dirname, "Databases/Games/Sudoku/sudoku.json"), data);
				}
				return client[botNum].reply(from, "Belum ada sesi game sudoku");
			}
		} catch (err) {
			console.log(err);
		}
	},
};
