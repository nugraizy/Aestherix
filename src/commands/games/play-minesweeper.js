import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { cmdId, getPrefix } from '../../helper/modules/prefix.js';
import { Minesweeper } from '../../utils/games/index.js';
import { loggers, color } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'minesweeper',
	minifiedDescription: 'Play Minesweeper',
	description: 'Play Minesweeper classic puzzle game.',
	usage: '!ms `<new/easy/medium/hard/reveal/flag/status/del/info>`',
	category: 'Games',
	aliases: ['ms'],
	cooldown: 1,
	limit: 0,
	status: 'enable',
	async run({ from, message, query, args, sender, pushname }, client) {
		const locale = await getLocale(from);
		const prefix = getPrefix();
		const L = useLocale(locale, 'common', { prefix });
		const M = useLocale(locale, 'minesweeper', { prefix });

		const parseCell = (input) => {
			if (!input) {
				return null;
			}

			const match = input.match(/^([a-zA-Z])(\d+)$/);

			if (!match) {
				return null;
			}

			const row = match[1].toUpperCase().charCodeAt(0) - 65;
			const col = parseInt(match[2], 10) - 1;

			return { row, col };
		};

		const sendBoard = async (jid, game, ctx) => {
			const maxButtons = 20;
			const revealButtons = [];
			const flagButtons = [];
			const status = game.getStatus();

			for (let r = 0; r < game.rows; r++) {
				for (let c = 0; c < game.cols; c++) {
					if (!game.revealed[r][c]) {
						const cell = `${String.fromCharCode(65 + r)}${c + 1}`;

						revealButtons.push({
							display: cell,
							id: cmdId('ms', `r ${cell}`, ctx)
						});

						flagButtons.push({
							display: `🚩 ${cell}`,
							id: cmdId('ms', `f ${cell}`, ctx)
						});
					}
				}
			}

			const allButtons = [...revealButtons, ...flagButtons];
			const chunks = [];

			for (let i = 0; i < allButtons.length; i += maxButtons) {
				chunks.push(allButtons.slice(i, i + maxButtons));
			}

			for (let i = 0; i < chunks.length; i++) {
				const builder = new client.TemplateBuilder.Native();
				const isfirst = i === 0;

				await builder
					.destination(jid)
					.body(isfirst ? `${M.game.title}\n\n${game.renderBoard()}\n\n💣 ${M.game.mines}: ${status.totalMines} | 🚩 ${M.game.flags}: ${status.flagsUsed}` : `${M.game.moreButtons} (${i + 1}/${chunks.length})`)
					.footer(isfirst ? `${M.game.difficulty}: ${status.difficulty} | ⏱️ ${status.duration}` : '')
					.buttons(...chunks[i].map((b) => builder.button.reply(b)))
					.send();
			}
		};

		if (!query) {
			return await client.reply(from, L.errors.invalidArgs, message);
		}

		if (args[1] === 'new' || args[1] === 'easy') {
			const existing = Minesweeper.getSession(sender);

			if (existing) {
				return await client.reply(from, L.errors.alreadyPlaying, message);
			}

			const game = new Minesweeper(sender, 'easy');

			game.play();

			loggers.info(`${color('Minesweeper game created by', 'pink')} ${color(pushname, 'white')}`);

			await sendBoard(from, game, { prefix: getPrefix() });
		} else if (args[1] === 'medium') {
			const existing = Minesweeper.getSession(sender);

			if (existing) {
				return await client.reply(from, L.errors.alreadyPlaying, message);
			}

			const game = new Minesweeper(sender, 'medium');

			game.play();

			loggers.info(`${color('Minesweeper game created by', 'pink')} ${color(pushname, 'white')}`);

			await sendBoard(from, game, { prefix: getPrefix() });
		} else if (args[1] === 'hard') {
			const existing = Minesweeper.getSession(sender);

			if (existing) {
				return await client.reply(from, L.errors.alreadyPlaying, message);
			}

			const game = new Minesweeper(sender, 'hard');

			game.play();

			loggers.info(`${color('Minesweeper game created by', 'pink')} ${color(pushname, 'white')}`);

			await sendBoard(from, game, { prefix: getPrefix() });
		} else if (args[1] === 'reveal' || args[1] === 'r') {
			const game = Minesweeper.getSession(sender);

			if (!game) {
				return await client.reply(from, L.errors.notPlaying, message);
			}

			const cell = parseCell(args[2]);

			if (!cell) {
				return await client.reply(from, M.errors.invalidCell, message);
			}

			const result = game.reveal(cell.row, cell.col);

			if (result.error) {
				return await client.reply(from, result.error, message);
			}

			if (result.status === 'lose') {
				Minesweeper.deleteSession(sender);

				await client.send(
					from,
					{
						text: `${M.game.title}\n\n${result.board}\n\n${M.game.lost}\n⏱️ ${result.duration}`
					},
					{ quoted: message }
				);
			} else if (result.status === 'win') {
				Minesweeper.deleteSession(sender);

				await client.send(
					from,
					{
						text: `${M.game.title}\n\n${result.board}\n\n${M.game.won}\n⏱️ ${result.duration}`
					},
					{ quoted: message }
				);
			} else {
				await sendBoard(from, game, { prefix: getPrefix() });
			}
		} else if (args[1] === 'flag' || args[1] === 'f') {
			const game = Minesweeper.getSession(sender);

			if (!game) {
				return await client.reply(from, L.errors.notPlaying, message);
			}

			const cell = parseCell(args[2]);

			if (!cell) {
				return await client.reply(from, M.errors.invalidCell, message);
			}

			const result = game.toggleFlag(cell.row, cell.col);

			if (result.error) {
				return await client.reply(from, result.error, message);
			}

			await sendBoard(from, game, { prefix: getPrefix() });
		} else if (args[1] === 'status') {
			const game = Minesweeper.getSession(sender);

			if (!game) {
				return await client.reply(from, L.errors.notPlaying, message);
			}

			const status = game.getStatus();

			await client.reply(
				from,
				`${M.game.title}\n\n${M.game.difficulty}: ${status.difficulty}\n${M.game.size}: ${status.rows}x${status.cols}\n💣 ${M.game.mines}: ${status.totalMines}\n🚩 ${M.game.flags}: ${status.flagsUsed}\n⏱️ ${M.game.duration}: ${status.duration}`,
				message
			);
		} else if (args[1] === 'del' || args[1] === 'delete') {
			const game = Minesweeper.getSession(sender);

			if (!game) {
				return await client.reply(from, L.errors.notPlaying, message);
			}

			Minesweeper.deleteSession(sender);

			await client.reply(from, M.game.gameDeleted, message);
		} else if (args[1] === 'info') {
			await client.reply(
				from,
				`${M.info.title}\n\n${M.info.description}\n\n${M.info.commands}\n${M.info.newGame}\n${M.info.mediumGame}\n${M.info.hardGame}\n${M.info.reveal}\n${M.info.flag}\n${M.info.status}\n${M.info.deleteGame}\n\n${M.info.howToPlay}\n${M.info.step1}\n${M.info.step2}\n${M.info.step3}\n${M.info.step4}\n${M.info.step5}`,
				message
			);
		}
	}
});
