import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { Chess } from '../../utils/games/index.js';
import { COLORS } from '../../utils/games/chess/board.js';
import { loggers, color } from '../../utils/modules/index.js';
import { getPrefix } from '../../helper/modules/prefix.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'chess',
	minifiedDescription: 'Play Chess',
	description: 'Play Chess with another player.',
	usage: '!chess `<new/join/move/board/resign/draw/del/info>`',
	category: 'Games',
	aliases: [],
	cooldown: 1,
	limit: 0,
	status: 'enable',
	async run({ from, message, query, args, sender, pushname, isGroup }, client) {
		const locale = await getLocale(from);
		const prefix = getPrefix();
		const L = useLocale(locale, 'common', { prefix });
		const C = useLocale(locale, 'chess', { prefix });

		if (!isGroup) {
			return await client.reply(from, L.errors.groupOnly, message);
		}

		const playerMention = (jid) => `@${jid.split('@')[0]}`;

		if (!query) {
			return await client.reply(from, L.errors.invalidArgs, message);
		}

		if (args[1] === 'new' || args[1] === 'play') {
			const existing = Chess.getSession(from);

			if (existing) {
				return await client.reply(from, L.errors.alreadyPlaying, message);
			}

			const game = new Chess(from, sender);

			game.play();

			loggers.info(`${color('Chess game created by', 'pink')} ${color(pushname, 'white')}`);

			await client.send(
				from,
				{
					text: `${C.game.title}\n\n${game.getBoard(COLORS.WHITE)}\n\n${C.game.created.replace('{0}', playerMention(sender))}\n\n${C.game.joinPrompt}`,
					mentions: [sender]
				},
				{ quoted: message }
			);
		} else if (args[1] === 'join') {
			const game = Chess.getSession(from);

			if (!game) {
				return await client.reply(from, C.errors.noActiveGame, message);
			}

			if (game.blackPlayer) {
				return await client.reply(from, C.errors.gameFull, message);
			}

			if (game.whitePlayer === sender) {
				return await client.reply(from, C.errors.cannotJoinOwn, message);
			}

			game.startGame(sender);

			loggers.info(`${color('Player joined Chess:', 'pink')} ${color(pushname, 'white')}`);

			await client.send(
				from,
				{
					text: `${C.game.title}\n\n${game.getBoard(COLORS.WHITE)}\n\n${C.game.started}\n\n⚪ ${playerMention(game.whitePlayer)} vs ⚫ ${playerMention(game.blackPlayer)}\n\n${C.game.turn.replace('{0}', playerMention(game.getCurrentPlayer()))}`,
					mentions: [game.whitePlayer, game.blackPlayer]
				},
				{ quoted: message }
			);
		} else if (args[1] === 'move' || args[1] === 'm') {
			const game = Chess.getSession(from);

			if (!game) {
				return await client.reply(from, C.errors.noActiveGame, message);
			}

			if (game.phase !== 'playing') {
				return await client.reply(from, C.errors.gameNotStarted, message);
			}

			const fromPos = args[2];
			const toPos = args[3];
			const promotion = args[4] || null;

			if (!fromPos || !toPos) {
				return await client.reply(from, C.errors.invalidMove, message);
			}

			const result = game.makeMove(sender, fromPos, toPos, promotion);

			if (result.error) {
				return await client.reply(from, result.error, message);
			}

			if (result.status === 'checkmate') {
				Chess.deleteSession(from);

				await client.send(
					from,
					{
						text: `${C.game.title}\n\n${result.board}\n\n${C.game.checkmate.replace('{0}', playerMention(result.winnerId))}\n${C.game.duration.replace('{0}', result.duration)}`,
						mentions: [result.winnerId]
					}
				);
			} else if (result.status === 'stalemate') {
				Chess.deleteSession(from);

				await client.send(
					from,
					{
						text: `${C.game.title}\n\n${result.board}\n\n${C.game.stalemate}\n${C.game.duration.replace('{0}', result.duration)}`
					}
				);
			} else {
				const checkText = result.inCheck ? `\n${C.game.check}` : '';

				await client.send(
					from,
					{
						text: `${C.game.title}\n\n${result.board}\n\n${result.notation}${checkText}\n${C.game.turn.replace('{0}', playerMention(result.nextPlayer))}`,
						mentions: [game.whitePlayer, game.blackPlayer]
					}
				);
			}
		} else if (args[1] === 'board' || args[1] === 'b') {
			const game = Chess.getSession(from);

			if (!game) {
				return await client.reply(from, C.errors.noActiveGame, message);
			}

			const playerColor = game.getPlayerColor(sender);
			const perspective = playerColor || COLORS.WHITE;

			await client.send(
				from,
				{
					text: `${C.game.title}\n\n${game.getBoard(perspective)}`
				},
				{ quoted: message }
			);
		} else if (args[1] === 'resign') {
			const game = Chess.getSession(from);

			if (!game) {
				return await client.reply(from, C.errors.noActiveGame, message);
			}

			const result = game.resign(sender);

			if (result.error) {
				return await client.reply(from, result.error, message);
			}

			Chess.deleteSession(from);

			await client.send(
				from,
				{
					text: `${C.game.title}\n\n${C.game.resigned.replace('{0}', playerMention(sender)).replace('{1}', playerMention(result.winnerId))}\n${C.game.duration.replace('{0}', result.duration)}`,
					mentions: [sender, result.winnerId]
				}
			);
		} else if (args[1] === 'draw') {
			const game = Chess.getSession(from);

			if (!game) {
				return await client.reply(from, C.errors.noActiveGame, message);
			}

			const result = game.offerDraw(sender);

			if (result.error) {
				return await client.reply(from, result.error, message);
			}

			if (result.status === 'draw_accepted') {
				Chess.deleteSession(from);

				await client.send(
					from,
					{
						text: `${C.game.title}\n\n${C.game.drawAccepted}\n${C.game.duration.replace('{0}', result.duration)}`,
						mentions: [game.whitePlayer, game.blackPlayer]
					}
				);
			} else {
				const opponent = sender === game.whitePlayer ? game.blackPlayer : game.whitePlayer;

				await client.send(
					from,
					{
						text: `${C.game.drawOffered.replace('{0}', playerMention(sender))}\n${C.game.drawAcceptPrompt}`,
						mentions: [sender, opponent]
					}
				);
			}
		} else if (args[1] === 'history' || args[1] === 'h') {
			const game = Chess.getSession(from);

			if (!game) {
				return await client.reply(from, C.errors.noActiveGame, message);
			}

			const history = game.getMoveHistory();

			if (history.length === 0) {
				return await client.reply(from, C.errors.noMoves, message);
			}

			await client.reply(from, `${C.game.moveHistory}\n\n${history.join('\n')}`, message);
		} else if (args[1] === 'del' || args[1] === 'delete') {
			const game = Chess.getSession(from);

			if (!game) {
				return await client.reply(from, C.errors.noActiveGame, message);
			}

			Chess.deleteSession(from);

			await client.reply(from, C.game.gameDeleted, message);
		} else if (args[1] === 'info') {
			await client.reply(
				from,
				`${C.info.title}\n\n${C.info.description}\n\n${C.info.commands}\n${C.info.newGame}\n${C.info.joinGame}\n${C.info.move}\n${C.info.board}\n${C.info.resign}\n${C.info.draw}\n${C.info.history}\n${C.info.deleteGame}\n\n${C.info.howToPlay}\n${C.info.step1}\n${C.info.step2}\n${C.info.step3}\n${C.info.step4}\n${C.info.step5}\n\n${C.info.notation}`,
				message
			);
		}
	}
});
