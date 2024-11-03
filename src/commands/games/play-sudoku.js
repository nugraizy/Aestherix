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
						await client.instance.reply(gridSolved, {
							from: configuration.cache.config.owner_number,
							quoted: message
						});
					}

					const messages = await client.instance.send(
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

				await client.instance.reply('You already have a game in progress.', { from, quoted: message });
			} else if (/([A-Ia-i])[1-9]/.test(args[1])) {
				if (args[2].length > 2) {
					return await client.instance.reply(`Wrong format!\n\nex : ${cmd} A2 7`, { from, quoted: message });
				}

				if (!args[2]) {
					return await client.instance.reply(`Pleas provide a row indexs\n\nex : ${cmd} A2 7`, {
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

							await client.instance.send(
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

						const messages = await client.instance.send(
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

					return await client.instance.reply(fill.message, { from, quoted: message });
				}

				return await client.instance.send(
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

							return await client.instance.send(
								{
									edit: message.key,
									text: `${isWin.message}\n${stringifyGrid(reveal.board)}\n\nGame Time : ${getTimeSince(
										data[index].startedAt
									)}\nThis game is still work on progress\nDifficulty is still on try mode.`
								},
								{ from, quoted: message }
							);
						}

						data[index].puzzle = reveal.board;

						const grid = stringifyGrid(reveal.tempBoard);

						const messages = await client.instance.send(
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

					return await client.instance.reply('Clue has run out!', { from, quoted: message });
				}

				return await client.instance.send(
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

					const messages = await client.instance.send(
						from,
						{ text: grid + '\nThis game is still work on progress\nDifficulty is still on try mode.' },
						{ quoted: message }
					);

					data[index].messages = messages;
					return await fs.writeJSON(path.join(__dirname, 'databases/games/sudoku/sudoku.json'), data);
				}

				return await client.instance.send(
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

					return await client.instance.reply('All games reset!', { from, quoted: message });
				}

				if (index !== -1) {
					data.splice(index, 1);
					await fs.writeJSON(path.join(__dirname, 'databases/games/sudoku/sudoku.json'), data);

					return await client.instance.reply('Game reset!', { from, quoted: message });
				}

				return await client.instance.reply('There is no game to reset!', { from, quoted: message });
			}
		} catch (err) {
			console.log(err);
		}
	}
};
