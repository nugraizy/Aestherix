import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { Blackjack } from '../../utils/games/index.js';
import { loggers, color } from '../../utils/modules/index.js';
import { getPrefix } from '../../helper/modules/prefix.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'blackjack',
	minifiedDescription: 'Play Blackjack',
	description: 'Play Blackjack card game.',
	usage: '!bj `<new/join/start/hit/stand/del/info>`',
	category: 'Games',
	aliases: ['bj'],
	cooldown: 1,
	limit: 0,
	status: 'enable',
	async run({ from, message, query, args, sender, pushname, isGroup }, client) {
		const locale = await getLocale(from);
		const prefix = getPrefix();
		const L = useLocale(locale, 'common', { prefix });
		const B = useLocale(locale, 'blackjack', { prefix });

		if (!isGroup) {
			return await client.reply(from, L.errors.groupOnly, message);
		}

		const playerMention = (jid) => `@${jid.split('@')[0]}`;

		if (!query) {
			return await client.reply(from, L.errors.invalidArgs, message);
		}

		if (args[1] === 'new' || args[1] === 'play') {
			const existing = Blackjack.getSession(from);

			if (existing) {
				return await client.reply(from, L.errors.alreadyPlaying, message);
			}

			const game = new Blackjack(from, sender);

			game.addPlayer(sender, pushname);
			game.play();

			loggers.info(`${color('Blackjack game created by', 'pink')} ${color(pushname, 'white')}`);

			await client.send(
				from,
				{
					text: `${B.game.title}\n\n${t(locale, 'blackjack.game.created', { prefix, 0: playerMention(sender) })}\n\n${B.game.players}: 1\n\n${B.game.joinPrompt}\n${B.game.startPrompt}`,
					mentions: [sender]
				},
				{ quoted: message }
			);
		} else if (args[1] === 'join') {
			const game = Blackjack.getSession(from);

			if (!game) {
				return await client.reply(from, B.errors.noActiveGame, message);
			}

			const result = game.addPlayer(sender, pushname);

			if (result.error) {
				return await client.reply(from, B.errors.alreadyJoined, message);
			}

			const mentions = [...game.players.keys()];
			const playerList = [...game.players.values()].map((p) => `• ${p.name}`).join('\n');

			await client.send(
				from,
				{
					text: `${B.game.title}\n\n${t(locale, 'blackjack.game.joined', { prefix, 0: playerMention(sender) })}\n\n${B.game.players}: ${game.players.size}\n${playerList}\n\n${B.game.joinPrompt}\n${B.game.startPrompt}`,
					mentions
				},
				{ quoted: message }
			);
		} else if (args[1] === 'start') {
			const game = Blackjack.getSession(from);

			if (!game) {
				return await client.reply(from, B.errors.noActiveGame, message);
			}

			if (game.host !== sender) {
				return await client.reply(from, B.errors.onlyHostStart, message);
			}

			const result = game.start();

			if (result.error) {
				return await client.reply(from, B.errors.needPlayers, message);
			}

			const dealerCard = result.dealerCard.display;

			await client.send(
				from,
				{
					text: `${B.game.title}\n\n${B.game.dealerHand}: ${dealerCard} ?\n\n${t(locale, 'blackjack.game.turn', { prefix, 0: playerMention(result.currentPlayer) })}`,
					mentions: [result.currentPlayer]
				}
			);
		} else if (args[1] === 'hit' || args[1] === 'h') {
			const game = Blackjack.getSession(from);

			if (!game) {
				return await client.reply(from, B.errors.noActiveGame, message);
			}

			const result = game.hit(sender);

			if (result.error) {
				return await client.reply(from, result.error, message);
			}

			if (result.status === 'bust') {
				await client.send(
					from,
					{
						text: `${B.game.bust}\n\n${B.game.yourHand}: ${result.hand}\n${B.game.value}: ${result.value}\n\n${t(locale, 'blackjack.game.turn', { prefix, 0: playerMention(result.nextPlayer) })}`,
						mentions: [result.nextPlayer]
					}
				);
			} else if (result.status === '21') {
				await client.send(
					from,
					{
						text: `${B.game.blackjack}\n\n${B.game.yourHand}: ${result.hand}\n${B.game.value}: ${result.value}\n\n${t(locale, 'blackjack.game.turn', { prefix, 0: playerMention(result.nextPlayer) })}`,
						mentions: [result.nextPlayer]
					}
				);
			} else {
				await client.reply(
					from,
					`${B.game.yourHand}: ${result.hand}\n${B.game.value}: ${result.value}\n\n${B.game.hitOrStand}`,
					message
				);
			}

			if (game.allPlayersDone()) {
				const endResult = game.resolveGame();

				const resultsText = endResult.results
					.map((r) => `${r.name}: ${r.hand} (${r.value}) - ${B.game.results[r.result]}`)
					.join('\n');

				Blackjack.deleteSession(from);

				await client.send(
					from,
					{
						text: `${B.game.title}\n\n${B.game.dealerHand}: ${endResult.dealerHand} (${endResult.dealerValue})\n\n${resultsText}\n\n${t(locale, 'blackjack.game.duration', { prefix, 0: endResult.duration })}`
					}
				);
			}
		} else if (args[1] === 'stand' || args[1] === 's') {
			const game = Blackjack.getSession(from);

			if (!game) {
				return await client.reply(from, B.errors.noActiveGame, message);
			}

			const result = game.stand(sender);

			if (result.error) {
				return await client.reply(from, result.error, message);
			}

			await client.send(
				from,
				{
					text: `${B.game.stand}\n\n${B.game.yourHand}: ${result.hand}\n${B.game.value}: ${result.value}\n\n${t(locale, 'blackjack.game.turn', { prefix, 0: playerMention(result.nextPlayer) })}`,
					mentions: [result.nextPlayer]
				}
			);

			if (game.allPlayersDone()) {
				const endResult = game.resolveGame();

				const resultsText = endResult.results
					.map((r) => `${r.name}: ${r.hand} (${r.value}) - ${B.game.results[r.result]}`)
					.join('\n');

				Blackjack.deleteSession(from);

				await client.send(
					from,
					{
						text: `${B.game.title}\n\n${B.game.dealerHand}: ${endResult.dealerHand} (${endResult.dealerValue})\n\n${resultsText}\n\n${t(locale, 'blackjack.game.duration', { prefix, 0: endResult.duration })}`
					}
				);
			}
		} else if (args[1] === 'del' || args[1] === 'delete') {
			const game = Blackjack.getSession(from);

			if (!game) {
				return await client.reply(from, B.errors.noActiveGame, message);
			}

			if (game.host !== sender) {
				return await client.reply(from, B.errors.onlyHostDelete, message);
			}

			Blackjack.deleteSession(from);

			await client.reply(from, B.game.gameDeleted, message);
		} else if (args[1] === 'info') {
			await client.reply(
				from,
				`${B.info.title}\n\n${B.info.description}\n\n${B.info.commands}\n${B.info.newGame}\n${B.info.joinGame}\n${B.info.startGame}\n${B.info.hit}\n${B.info.stand}\n${B.info.deleteGame}\n\n${B.info.howToPlay}\n${B.info.step1}\n${B.info.step2}\n${B.info.step3}\n${B.info.step4}\n${B.info.step5}`,
				message
			);
		}
	}
});
