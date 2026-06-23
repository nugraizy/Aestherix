import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { MemoryMatch } from '../../utils/games/index.js';
import { getPrefix } from '../../helper/modules/prefix.js';
import { loggers, color } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'memory',
	minifiedDescription: 'Play Memory Match',
	description: 'Play Memory Match card game.',
	usage: '!memory `<new/easy/medium/hard/flip/status/del/info>`',
	category: 'Games',
	aliases: ['mem'],
	cooldown: 1,
	limit: 0,
	status: 'enable',
	async run({ from, message, query, args, sender }, client) {
		const locale = await getLocale(from);
		const prefix = getPrefix();
		const L = useLocale(locale, 'common', { prefix });
		const M = useLocale(locale, 'memory-match', { prefix });

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

		if (!query) {
			return await client.reply(from, L.errors.invalidArgs, message);
		}

		if (args[1] === 'new' || args[1] === 'easy') {
			const existing = MemoryMatch.getSession(sender);

			if (existing) {
				return await client.reply(from, L.errors.alreadyPlaying, message);
			}

			const game = new MemoryMatch(sender, 'easy');

			game.play();

			loggers.info(`${color('Memory Match game created by', 'pink')} ${color(sender, 'white')}`);

			await client.send(
				from,
				{
					text: `${M.game.title}\n\n${game.renderBoard()}\n\n${M.game.difficulty}: Easy (${game.rows}x${game.cols})\n${M.game.pairs}: ${game.matchedPairs}/${game.totalPairs}\n${M.game.moves}: ${game.moves}`
				},
				{ quoted: message }
			);
		} else if (args[1] === 'medium') {
			const existing = MemoryMatch.getSession(sender);

			if (existing) {
				return await client.reply(from, L.errors.alreadyPlaying, message);
			}

			const game = new MemoryMatch(sender, 'medium');

			game.play();

			loggers.info(`${color('Memory Match game created by', 'pink')} ${color(sender, 'white')}`);

			await client.send(
				from,
				{
					text: `${M.game.title}\n\n${game.renderBoard()}\n\n${M.game.difficulty}: Medium (${game.rows}x${game.cols})\n${M.game.pairs}: ${game.matchedPairs}/${game.totalPairs}\n${M.game.moves}: ${game.moves}`
				},
				{ quoted: message }
			);
		} else if (args[1] === 'hard') {
			const existing = MemoryMatch.getSession(sender);

			if (existing) {
				return await client.reply(from, L.errors.alreadyPlaying, message);
			}

			const game = new MemoryMatch(sender, 'hard');

			game.play();

			loggers.info(`${color('Memory Match game created by', 'pink')} ${color(sender, 'white')}`);

			await client.send(
				from,
				{
					text: `${M.game.title}\n\n${game.renderBoard()}\n\n${M.game.difficulty}: Hard (${game.rows}x${game.cols})\n${M.game.pairs}: ${game.matchedPairs}/${game.totalPairs}\n${M.game.moves}: ${game.moves}`
				},
				{ quoted: message }
			);
		} else if (args[1] === 'flip' || args[1] === 'f') {
			const game = MemoryMatch.getSession(sender);

			if (!game) {
				return await client.reply(from, L.errors.notPlaying, message);
			}

			const cell = parseCell(args[2]);

			if (!cell) {
				return await client.reply(from, M.errors.invalidCard, message);
			}

			const result = game.revealCard(cell.row, cell.col);

			if (result.error) {
				return await client.reply(from, result.error, message);
			}

			if (result.status === 'win') {
				MemoryMatch.deleteSession(sender);

				await client.send(
					from,
					{
						text: `${M.game.title}\n\n${result.board}\n\n${M.game.won}\n${M.game.moves}: ${result.moves}\n${t(locale, 'memory-match.game.duration', { prefix, 0: result.duration })}`
					}
				);
			} else if (result.status === 'match') {
				await client.send(
					from,
					{
						text: `${M.game.title}\n\n${result.board}\n\n${M.game.match}\n${M.game.pairs}: ${result.matchedPairs}/${result.totalPairs}\n${M.game.moves}: ${result.moves}`
					}
				);
			} else if (result.status === 'no_match') {
				await client.send(
					from,
					{
						text: `${M.game.title}\n\n${result.board}\n\n${M.game.noMatch}\n${M.game.moves}: ${result.moves}`
					}
				);

				setTimeout(() => {
					game.flipBack();

					client.send(
						from,
						{
							text: `${M.game.title}\n\n${game.renderBoard()}\n\n${M.game.pairs}: ${game.matchedPairs}/${game.totalPairs}\n${M.game.moves}: ${game.moves}`
						}
					);
				}, 1500);
			} else {
				await client.send(
					from,
					{
						text: `${M.game.title}\n\n${result.board}\n\n${M.game.pairs}: ${game.matchedPairs}/${game.totalPairs}\n${M.game.moves}: ${result.moves}`
					}
				);
			}
		} else if (args[1] === 'status') {
			const game = MemoryMatch.getSession(sender);

			if (!game) {
				return await client.reply(from, L.errors.notPlaying, message);
			}

			const status = game.getStatus();

			await client.reply(
				from,
				`${M.game.title}\n\n${M.game.difficulty}: ${status.difficulty}\n${M.game.size}: ${status.rows}x${status.cols}\n${M.game.pairs}: ${status.matchedPairs}/${status.totalPairs}\n${M.game.moves}: ${status.moves}\n${t(locale, 'memory-match.game.duration', { prefix, 0: status.duration })}`,
				message
			);
		} else if (args[1] === 'del' || args[1] === 'delete') {
			const game = MemoryMatch.getSession(sender);

			if (!game) {
				return await client.reply(from, L.errors.notPlaying, message);
			}

			MemoryMatch.deleteSession(sender);

			await client.reply(from, M.game.gameDeleted, message);
		} else if (args[1] === 'info') {
			await client.reply(
				from,
				`${M.info.title}\n\n${M.info.description}\n\n${M.info.commands}\n${M.info.newGame}\n${M.info.mediumGame}\n${M.info.hardGame}\n${M.info.flip}\n${M.info.status}\n${M.info.deleteGame}\n\n${M.info.howToPlay}\n${M.info.step1}\n${M.info.step2}\n${M.info.step3}\n${M.info.step4}\n${M.info.step5}`,
				message
			);
		}
	}
});
