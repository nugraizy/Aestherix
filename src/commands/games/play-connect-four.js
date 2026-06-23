import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { ConnectFour } from '../../utils/games/index.js';
import { loggers, color } from '../../utils/modules/index.js';
import { getPrefix } from '../../helper/modules/prefix.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'connectfour',
	minifiedDescription: 'Play Connect Four',
	description: 'Play Connect Four with another player or bot.',
	usage: '!c4 `<new/ai/join/del/info>` or `!c4 <1-7>`',
	category: 'Games',
	aliases: ['c4'],
	cooldown: 1,
	limit: 0,
	status: 'enable',
	async run({ from, message, query, args, sender, pushname }, client) {
		const locale = await getLocale(from);
		const prefix = getPrefix();
		const L = useLocale(locale, 'common', { prefix });
		const C = useLocale(locale, 'connect-four', { prefix });

		const playerMention = (jid) => `@${jid.split('@')[0]}`;

		if (!query) {
			return await client.reply(from, L.errors.invalidArgs, message);
		}

		if (args[1] === 'new' || args[1] === 'play') {
			const existing = ConnectFour.getSession(sender);

			if (existing) {
				return await client.reply(from, L.errors.alreadyPlaying, message);
			}

			const game = new ConnectFour(sender);

			game.play();

			loggers.info(`${color('Connect Four game created by', 'pink')} ${color(pushname, 'white')}`);

			await client.send(
				from,
				{
					text: `${C.game.title}\n\n${game.renderBoard()}\n\n🔴 ${t(locale, 'connect-four.game.waitingForOpponent', { prefix, 0: playerMention(sender) })}\n\n${C.game.joinPrompt}`,
					mentions: [sender]
				},
				{ quoted: message }
			);
		} else if (args[1] === 'ai' || args[1] === 'bot') {
			const existing = ConnectFour.getSession(sender);

			if (existing) {
				return await client.reply(from, L.errors.alreadyPlaying, message);
			}

			const game = new ConnectFour(sender, null, true);

			game.startVsAI();
			game.play();

			loggers.info(`${color('Connect Four AI game created by', 'pink')} ${color(pushname, 'white')}`);

			await client.send(
				from,
				{
					text: `${C.game.title}\n\n${game.renderBoard()}\n\n🔴 ${playerMention(sender)} vs 🟡 ${C.game.bot}\n\n${t(locale, 'connect-four.game.turn', { prefix, 0: `🔴 ${playerMention(sender)}` })}`,
					mentions: [sender]
				},
				{ quoted: message }
			);
		} else if (args[1] === 'join') {
			const existing = ConnectFour.getSession(sender);

			if (existing) {
				return await client.reply(from, L.errors.alreadyPlaying, message);
			}

			const pendingGame = ConnectFour.getPendingGame();

			if (!pendingGame) {
				return await client.reply(from, C.errors.noPendingGame, message);
			}

			const { session } = pendingGame;

			if (session.player1 === sender) {
				return await client.reply(from, C.errors.cannotJoinOwn, message);
			}

			const result = session.addPlayer(sender);

			if (result.error) {
				return await client.reply(from, C.errors.gameFull, message);
			}

			loggers.info(`${color('Player joined Connect Four:', 'pink')} ${color(pushname, 'white')}`);

			await client.send(
				from,
				{
					text: `${C.game.title}\n\n${session.renderBoard()}\n\n🔴 ${playerMention(session.player1)} ${C.game.vs} 🟡 ${playerMention(session.player2)}\n\n${t(locale, 'connect-four.game.turn', { prefix, 0: `🔴 ${playerMention(session.player1)}` })}`,
					mentions: [session.player1, session.player2]
				},
				{ quoted: message }
			);
		} else if (args[1] === 'del' || args[1] === 'delete') {
			const existing = ConnectFour.getSession(sender);

			if (!existing) {
				return await client.reply(from, L.errors.notPlaying, message);
			}

			ConnectFour.deleteSession(sender);

			await client.reply(from, C.game.gameDeleted, message);
		} else if (args[1] === 'info') {
			await client.reply(
				from,
				`${C.info.title}\n\n${C.info.description}\n\n${C.info.commands}\n${C.info.newGame}\n${C.info.aiGame}\n${C.info.joinGame}\n${C.info.dropDisc}\n${C.info.deleteGame}\n${C.info.showInfo}\n\n${C.info.howToPlay}\n${C.info.step1}\n${C.info.step2}\n${C.info.step3}\n${C.info.step4}`,
				message
			);
		} else {
			const col = parseInt(args[1], 10);

			if (isNaN(col) || col < 1 || col > 7) {
				return await client.reply(from, C.errors.invalidColumn, message);
			}

			const existing = ConnectFour.getSession(sender);

			if (!existing) {
				return await client.reply(from, L.errors.notPlaying, message);
			}

			const { session } = existing;

			if (!session.player2) {
				return await client.reply(from, C.errors.waitingForOpponent, message);
			}

			if (!session.isTurn(sender)) {
				return await client.reply(from, C.errors.notYourTurn, message);
			}

			const result = session.dropDisc(col - 1);

			if (result.error) {
				return await client.reply(from, C.errors.columnFull, message);
			}

			if (result.status === 'win') {
				ConnectFour.deleteSession(sender);

				const winnerText = result.winner === sender ? t(locale, 'connect-four.game.wins', { prefix, 0: playerMention(result.winner) }) : C.game.aiWins;

				await client.send(
					from,
					{
						text: `${C.game.title}\n\n${result.board}\n\n${winnerText}\n${t(locale, 'connect-four.game.duration', { prefix, 0: result.duration })}`,
						mentions: [sender]
					},
					{ quoted: message }
				);
			} else if (result.status === 'draw') {
				ConnectFour.deleteSession(sender);

				await client.send(
					from,
					{
						text: `${C.game.title}\n\n${result.board}\n\n${C.game.draw}\n${t(locale, 'connect-four.game.duration', { prefix, 0: result.duration })}`,
						mentions: [sender]
					},
					{ quoted: message }
				);
			} else {
				const turnEmoji = session.turn;
				const turnText =
					session.vsAI && session.turn === '🟡'
						? `🟡 ${C.game.botThinking}`
						: t(locale, 'connect-four.game.turn', { prefix, 0: `${turnEmoji} ${playerMention(result.turn)}` });

				await client.send(
					from,
					{
						text: `${C.game.title}\n\n${result.board}\n\n${turnText}`,
						mentions: [sender]
					},
					{ quoted: message }
				);

				if (session.vsAI && session.turn === '🟡') {
					const aiResult = await session.playAITurn();

					if (aiResult.status === 'win') {
						ConnectFour.deleteSession(sender);

						await client.send(from, {
							text: `${C.game.title}\n\n${aiResult.board}\n\n${C.game.aiWins}\n${t(locale, 'connect-four.game.duration', { prefix, 0: aiResult.duration })}`,
							mentions: [sender]
						});
					} else if (aiResult.status === 'draw') {
						ConnectFour.deleteSession(sender);

						await client.send(from, {
							text: `${C.game.title}\n\n${aiResult.board}\n\n${C.game.draw}\n${t(locale, 'connect-four.game.duration', { prefix, 0: aiResult.duration })}`,
							mentions: [sender]
						});
					} else {
						await client.send(from, {
							text: `${C.game.title}\n\n${aiResult.board}\n\n${t(locale, 'connect-four.game.turn', { prefix, 0: `🔴 ${playerMention(sender)}` })}`,
							mentions: [sender]
						});
					}
				}
			}
		}
	}
});
