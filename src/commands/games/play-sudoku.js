import path from 'path';
import fs from 'fs-extra';

import configuration from '../../helper/config/connect.js';
import { getTimeSince } from '../../utils/modules/index.js';
import { checkWin, fillGrid, makePuzzle, revealOneElement, solvePuzzle, stringifyGrid } from '../../utils/games/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'sudoku',
	minifiedDescription: 'Play Sudoku',
	description: 'Play Sudoku.',
	usage: '!sudoku',
	aliases: ['sd'],
	category: 'Games',
	cooldown: 2,
	limit: 0,
	status: 'enable',
	async run({ args, sender, from, message, isOwner, cmd }, client) {
		try {
			let data = await fs.readJSON(path.join(__dirname, 'databases/games/sudoku/sudoku.json'));

			if (/(play|main)/.test(args[1])) {
				const index = !data.length ? -1 : data.findIndex((v) => v.id === from);

				if (index === -1) {
					const puzzle = makePuzzle('easy');
					const solved = solvePuzzle(puzzle);
					const grid = stringifyGrid(puzzle);
					const gridSolved = stringifyGrid(solved);

					if (isOwner) {
						await client.reply(configuration.settings.owner_number, gridSolved, message);
					}

					const messages = await client.send(
						from,
						{
							text: `${grid}\nThis game is still work on progress\nDifficulty is still on try mode.\nReplace number 9 with 0.`
						},
						{ quoted: message }
					);

					data.push({
						id: from,
						startsBy: sender,
						clue: 5,
						startedAt: Date.now(),
						guessedBy: [],
						messages,
						puzzle,
						solved
					});

					return await fs.writeJSON(path.join(__dirname, 'databases/games/sudoku/sudoku.json'), data);
				}

				await client.reply(from, 'You already have a game in progress.', message);
			} else if (/([A-Ia-i])[1-9]/.test(args[1])) {
				if (args[2].length > 2) {
					return await client.reply(from, `Wrong format!\n\nex : ${cmd} A2 7`, message);
				}

				if (!args[2]) {
					return await client.reply(from, `Pleas provide a row indexs\n\nex : ${cmd} A2 7`, {
						from,
						quoted: message
					});
				}

				const index = !data.length ? -1 : data.findIndex((v) => v.id === from);

				if (index !== -1) {
					const fill = fillGrid(args[1], args[2], data[index].puzzle, data[index].solved);

					if (fill.statusPlaying === 'Playing') {
						const isWin = checkWin(fill.grid);

						if (isWin.status) {
							const messages = data[index].messages;

							await client.send(
								from,
								{
									edit: messages.key,
									text: `${isWin.message}\n${stringifyGrid(fill.grid)}\n\nGame Time : ${getTimeSince(
										data[index].startedAt
									)}\nThis game is still work on progress\nDifficulty is still on try mode.`
								},
								{ quoted: message }
							);

							data.splice(index, 1);
							await fs.writeJSON(path.join(__dirname, 'databases/games/sudoku/sudoku.json'), data);

							return;
						}

						data[index].puzzle = fill.grid;
						data[index].guessedBy.push(sender);
						await fs.writeJSON(path.join(__dirname, 'databases/games/sudoku/sudoku.json'), data);

						const grid = stringifyGrid(fill.tempBoard);

						const messages = await client.send(
							from,
							{
								edit: data[index].messages.key,
								text: grid + '\nThis game is still work on progress\nDifficulty is still on try mode.'
							},
							{ quoted: message }
						);

						data[index].messages = messages;

						return await fs.writeJSON(path.join(__dirname, 'databases/games/sudoku/sudoku.json'), data);
					}

					return await client.reply(from, fill.message, message);
				}

				return await client.send(
					from,
					{ text: `No session found. Type ${cmd} play to start new sudoku game.` },
					{
						quoted: message
					}
				);
			} else if (/clue/.test(args[1])) {
				const index = !data.length ? -1 : data.findIndex((v) => v.id === from);

				if (index !== -1) {
					if (data[index].clue !== 0) {
						data[index].clue--;
						await fs.writeJSON(path.join(__dirname, 'databases/games/sudoku/sudoku.json'), data);

						const reveal = revealOneElement(data[index].puzzle, data[index].solved);

						const isWin = checkWin(reveal.board);

						if (isWin.status) {
							const message = Object.assign({}, data[index].messages);

							data.splice(index, 1);
							await fs.writeJSON(path.join(__dirname, 'databases/games/sudoku/sudoku.json'), data);

							return await client.send(
								{
									edit: message.key,
									text: `${isWin.message}\n${stringifyGrid(reveal.board)}\n\nGame Time : ${getTimeSince(
										data[index].startedAt
									)}\nThis game is still work on progress\nDifficulty is still on try mode.`
								},
								message
							);
						}

						data[index].puzzle = reveal.board;

						const grid = stringifyGrid(reveal.tempBoard);

						const messages = await client.send(
							from,
							{
								edit: data[index].messages.key,
								text: grid + '\nThis game is still work on progress\nDifficulty is still on try mode.'
							},
							{}
						);

						data[index].messages = messages;

						return await fs.writeJSON(path.join(__dirname, 'databases/games/sudoku/sudoku.json'), data);
					}

					return await client.reply(from, 'Clue has run out!', message);
				}

				return await client.send(
					from,
					{ text: `No session found. Type ${cmd} play to start new sudoku game.` },
					{
						quoted: message
					}
				);
			} else if (/ch?ec?k?/.test(args[1])) {
				const index = !data.length ? -1 : data.findIndex((v) => v.id === from);

				if (index !== -1) {
					const grid = stringifyGrid(data[index].puzzle);

					const messages = await client.send(
						from,
						{ text: grid + '\nThis game is still work on progress\nDifficulty is still on try mode.' },
						{ quoted: message }
					);

					data[index].messages = messages;
					return await fs.writeJSON(path.join(__dirname, 'databases/games/sudoku/sudoku.json'), data);
				}

				return await client.send(
					from,
					{ text: `No session found. Type ${cmd} play to start new sudoku game.` },
					{
						quoted: message
					}
				);
			} else if (/reset/.test(args[1])) {
				if (!isOwner) {
					return;
				}

				const index = !data.length ? -1 : data.findIndex((v) => v.id === from);

				if (args[2] === 'all') {
					data = [];
					await fs.writeJSON(path.join(__dirname, 'databases/games/sudoku/sudoku.json'), data);

					return await client.reply(from, 'All games reset!', message);
				}

				if (index !== -1) {
					data.splice(index, 1);
					await fs.writeJSON(path.join(__dirname, 'databases/games/sudoku/sudoku.json'), data);

					return await client.reply(from, 'Game reset!', message);
				}

				return await client.reply(from, 'There is no game to reset!', message);
			}
		} catch (err) {
			console.log(err);
		}
	}
};
