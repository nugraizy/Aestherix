import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { WordChain } from '../../utils/games/index.js';
import { getPrefix } from '../../helper/modules/prefix.js';
import { loggers, color } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'wordchain',
	minifiedDescription: 'Play Word Chain',
	description: 'Play Word Chain word game with friends.',
	usage: '!wc `<new/join/start/skip/status/del/info>`',
	category: 'Games',
	aliases: ['wc'],
	cooldown: 1,
	limit: 0,
	status: 'enable',
	async run({ from, message, query, args, sender, pushname, isGroup }, client) {
		const locale = await getLocale(from);
		const prefix = getPrefix();
		const L = useLocale(locale, 'common', { prefix });
		const W = useLocale(locale, 'word-chain', { prefix });

		if (!isGroup) {
			return await client.reply(from, L.errors.groupOnly, message);
		}

		const playerMention = (jid) => `@${jid.split('@')[0]}`;

		if (!query) {
			return await client.reply(from, L.errors.invalidArgs, message);
		}

		if (args[1] === 'new' || args[1] === 'play') {
			const existing = WordChain.getSession(from);

			if (existing) {
				return await client.reply(from, L.errors.alreadyPlaying, message);
			}

			const game = new WordChain(from, sender);

			game.addPlayer(sender, pushname);
			game.play();

			loggers.info(`${color('Word Chain game created by', 'pink')} ${color(pushname, 'white')}`);

			await client.send(
				from,
				{
					text: `${W.game.title}\n\n${t(locale, 'word-chain.game.created', { prefix, 0: playerMention(sender) })}\n\n${W.game.players}: 1\n\n${W.game.joinPrompt}\n${W.game.startPrompt}`,
					mentions: [sender]
				},
				{ quoted: message }
			);
		} else if (args[1] === 'join') {
			const game = WordChain.getSession(from);

			if (!game) {
				return await client.reply(from, W.errors.noActiveGame, message);
			}

			const result = game.addPlayer(sender, pushname);

			if (result.error) {
				return await client.reply(from, W.errors.alreadyJoined, message);
			}

			const mentions = [...game.players.keys()];
			const playerList = [...game.players.values()].map((p) => `• ${p.name}`).join('\n');

			await client.send(
				from,
				{
					text: `${W.game.title}\n\n${t(locale, 'word-chain.game.joined', { prefix, 0: playerMention(sender) })}\n\n${W.game.players}: ${game.players.size}\n${playerList}\n\n${W.game.joinPrompt}\n${W.game.startPrompt}`,
					mentions
				},
				{ quoted: message }
			);
		} else if (args[1] === 'start') {
			const game = WordChain.getSession(from);

			if (!game) {
				return await client.reply(from, W.errors.noActiveGame, message);
			}

			if (game.host !== sender) {
				return await client.reply(from, W.errors.onlyHostStart, message);
			}

			const result = game.start();

			if (result.error) {
				return await client.reply(from, W.errors.needPlayers, message);
			}

			await client.send(
				from,
				{
					text: `${W.game.title}\n\n${W.game.started}\n\n${t(locale, 'word-chain.game.turn', { prefix, 0: playerMention(result.currentPlayer) })}\n\n${W.game.firstWord}`,
					mentions: [result.currentPlayer]
				}
			);
		} else if (args[1] === 'skip') {
			const game = WordChain.getSession(from);

			if (!game) {
				return await client.reply(from, W.errors.noActiveGame, message);
			}

			const result = game.skipTurn(sender);

			if (result.error) {
				return await client.reply(from, result.error, message);
			}

			await client.send(
				from,
				{
					text: `${t(locale, 'word-chain.game.skipped', { prefix, 0: playerMention(sender) })}\n\n${t(locale, 'word-chain.game.turn', { prefix, 0: playerMention(result.nextPlayer) })}`,
					mentions: [sender, result.nextPlayer]
				}
			);
		} else if (args[1] === 'status' || args[1] === 's') {
			const game = WordChain.getSession(from);

			if (!game) {
				return await client.reply(from, W.errors.noActiveGame, message);
			}

			const status = game.getStatus();
			const recentWords = status.words.length > 0 ? status.words.join(' → ') : W.game.noWords;

			await client.reply(
				from,
				`${W.game.title}\n\n${W.game.currentLetter}: ${status.currentLetter ? status.currentLetter.toUpperCase() : '-'}\n${W.game.totalWords}: ${status.totalWords}\n${W.game.recentWords}: ${recentWords}\n\n${t(locale, 'word-chain.game.turn', { prefix, 0: playerMention(status.currentPlayer) })}`,
				message
			);
		} else if (args[1] === 'end') {
			const game = WordChain.getSession(from);

			if (!game) {
				return await client.reply(from, W.errors.noActiveGame, message);
			}

			if (game.host !== sender) {
				return await client.reply(from, W.errors.onlyHostEnd, message);
			}

			const result = game.endGame();

			const standings = result.standings;
			const medals = ['🥇', '🥈', '🥉'];
			const leaderboard = standings
				.map((p, i) => `${medals[i] || '▫️'} ${p.name} - ${p.score} pts (${p.wordsUsed} words)`)
				.join('\n');

			WordChain.deleteSession(from);

			await client.send(
				from,
				{
					text: `${W.game.ended}\n\n${leaderboard}\n\n${W.game.totalWords}: ${result.totalWords}\n${t(locale, 'word-chain.game.duration', { prefix, 0: result.duration })}`
				},
				{ quoted: message }
			);
		} else if (args[1] === 'del' || args[1] === 'delete') {
			const game = WordChain.getSession(from);

			if (!game) {
				return await client.reply(from, W.errors.noActiveGame, message);
			}

			if (game.host !== sender) {
				return await client.reply(from, W.errors.onlyHostDelete, message);
			}

			WordChain.deleteSession(from);

			await client.reply(from, W.game.gameDeleted, message);
		} else if (args[1] === 'info') {
			await client.reply(
				from,
				`${W.info.title}\n\n${W.info.description}\n\n${W.info.commands}\n${W.info.newGame}\n${W.info.joinGame}\n${W.info.startGame}\n${W.info.skip}\n${W.info.status}\n${W.info.endGame}\n${W.info.deleteGame}\n\n${W.info.howToPlay}\n${W.info.step1}\n${W.info.step2}\n${W.info.step3}\n${W.info.step4}\n${W.info.step5}`,
				message
			);
		} else {
			const game = WordChain.getSession(from);

			if (!game) {
				return await client.reply(from, W.errors.noActiveGame, message);
			}

			const word = args[1];

			if (!word) {
				return await client.reply(from, W.errors.provideWord, message);
			}

			const result = game.submitWord(sender, word);

			if (result.error) {
				return await client.reply(from, result.error, message);
			}

			await client.send(
				from,
				{
					text: `${t(locale, 'word-chain.game.wordAccepted', { prefix, 0: result.word.toUpperCase() })}\n\n${W.game.nextLetter}: ${result.currentLetter.toUpperCase()}\n${W.game.score}: ${result.score}\n\n${t(locale, 'word-chain.game.turn', { prefix, 0: playerMention(result.nextPlayer) })}`,
					mentions: [result.nextPlayer]
				}
			);
		}
	}
});
