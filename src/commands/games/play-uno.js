import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { Uno } from '../../utils/games/index.js';
import { loggers, color } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'uno',
	minifiedDescription: 'Play UNO',
	description: 'Play UNO card game with friends.',
	usage: '!uno `<new/join/start/play/draw/uno/status/del/info>`',
	category: 'Games',
	aliases: [],
	cooldown: 1,
	limit: 0,
	status: 'enable',
	async run({ from, message, query, args, sender, pushname, isGroup }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const U = useLocale(locale, 'uno');

		if (!isGroup) {
			return await client.reply(from, L.errors.groupOnly, message);
		}

		const playerMention = (jid) => `@${jid.split('@')[0]}`;

		const getPrefix = () => args[0]?.charAt(0) || '.';

		const sendHand = async (jid, playerId, ctx) => {
			const game = Uno.getSession(from);

			if (!game) {
				return;
			}

			const hand = game.getPlayerHand(playerId);

			if (!hand || hand.length === 0) {
				return;
			}

			const maxButtons = game.getPlayerMaxButtons(playerId);
			const chunks = [];

			for (let i = 0; i < hand.length; i += maxButtons) {
				chunks.push(hand.slice(i, i + maxButtons));
			}

			for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
				const chunk = chunks[chunkIndex];
				const startIndex = chunkIndex * maxButtons;

				const buttons = chunk.map((card, i) => ({
					display: card.display,
					id: cmdId('uno', `play ${startIndex + i + 1}`, ctx)
				}));

				const handText = chunk.map((c, i) => `${startIndex + i + 1}. ${c.display}`).join('\n');
				const partText = chunks.length > 1 ? ` (${chunkIndex + 1}/${chunks.length})` : '';

				const builder = new client.TemplateBuilder.Native();

				await builder
					.destination(jid)
					.body(`${U.game.yourHand}${partText}\n${handText}`)
					.footer(`${U.game.totalCards}: ${hand.length}`)
					.buttons(...buttons.map((b) => builder.button.reply(b)))
					.send();
			}
		};

		const sendGameStatus = async (jid, game) => {
			const status = game.getStatus();
			const topCard = status.topCard;

			const playerList = status.players
				.map((p) => `${p.id === status.currentPlayer ? '➡️ ' : ''}${p.name}: ${p.cards} cards`)
				.join('\n');

			const direction = status.direction === 1 ? '➡️' : '⬅️';

			await client.send(
				jid,
				{
					text: `${U.game.title}\n\n${U.game.currentCard}: ${topCard.display}${status.chosenColor ? `\n${U.game.chosenColor}: ${status.chosenColor}` : ''}\n${U.game.direction}: ${direction}\n\n${playerList}\n\n${U.game.currentTurn}: ${playerMention(status.currentPlayer)}`,
					mentions: [status.currentPlayer]
				}
			);
		};

		if (!query) {
			return await client.reply(from, L.errors.invalidArgs, message);
		}

		if (args[1] === 'new' || args[1] === 'play') {
			const existing = Uno.getSession(from);

			if (existing) {
				return await client.reply(from, U.errors.gameAlreadyActive, message);
			}

			const game = new Uno(from, sender);

			game.addPlayer(sender, pushname);
			game.play();

			loggers.info(`${color('UNO game created by', 'pink')} ${color(pushname, 'white')}`);

			await client.send(
				from,
				{
					text: `${U.game.title}\n\n${U.game.created.replace('{0}', playerMention(sender))}\n\n${U.game.players}: 1\n\n${U.game.joinPrompt}\n${U.game.startPrompt}`,
					mentions: [sender]
				},
				{ quoted: message }
			);
		} else if (args[1] === 'join') {
			const game = Uno.getSession(from);

			if (!game) {
				return await client.reply(from, U.errors.noActiveGame, message);
			}

			const result = game.addPlayer(sender, pushname);

			if (result.error) {
				return await client.reply(from, U.errors.alreadyJoined, message);
			}

			const mentions = [...game.players.keys()];
			const playerList = [...game.players.values()].map((p) => `• ${p.name}`).join('\n');

			await client.send(
				from,
				{
					text: `${U.game.title}\n\n${U.game.joined.replace('{0}', playerMention(sender))}\n\n${U.game.players}: ${game.players.size}\n${playerList}\n\n${U.game.joinPrompt}\n${U.game.startPrompt}`,
					mentions
				},
				{ quoted: message }
			);
		} else if (args[1] === 'start') {
			const game = Uno.getSession(from);

			if (!game) {
				return await client.reply(from, U.errors.noActiveGame, message);
			}

			if (game.host !== sender) {
				return await client.reply(from, U.errors.onlyHostStart, message);
			}

			const result = game.start();

			if (result.error) {
				return await client.reply(from, U.errors.needPlayers, message);
			}

			const currentPlayer = result.currentPlayer;
			const playerIds = [...game.players.keys()];

			for (const playerId of playerIds) {
				await sendHand(playerId, playerId, { prefix: getPrefix() });
			}

			await client.send(
				from,
				{
					text: `${U.game.started}\n\n${U.game.firstCard}: ${result.firstCard.display}\n\n${U.game.currentTurn}: ${playerMention(currentPlayer)}`,
					mentions: [currentPlayer]
				}
			);
		} else if (args[1] === 'play') {
			const game = Uno.getSession(from);

			if (!game) {
				return await client.reply(from, U.errors.noActiveGame, message);
			}

			const cardIndex = parseInt(args[2], 10) - 1;

			if (isNaN(cardIndex)) {
				return await client.reply(from, U.errors.invalidCard, message);
			}

			let chosenColor = null;

			if (args[3]) {
				const colorInput = args[3].toLowerCase();
				const colorMap = {
					red: '🔴',
					blue: '🔵',
					green: '🟢',
					yellow: '🟡',
					r: '🔴',
					b: '🔵',
					g: '🟢',
					y: '🟡',
					'🔴': '🔴',
					'🔵': '🔵',
					'🟢': '🟢',
					'🟡': '🟡'
				};

				chosenColor = colorMap[colorInput];
			}

			const result = game.playCard(sender, cardIndex, chosenColor);

			if (result.error) {
				if (result.requiresColor) {
					return await client.reply(from, U.errors.chooseColor, message);
				}

				return await client.reply(from, result.error, message);
			}

			if (result.status === 'win') {
				Uno.deleteSession(from);

				await client.send(
					from,
					{
						text: `${U.game.title}\n\n${U.game.winner.replace('{0}', playerMention(result.winner))}\n\n${U.game.lastCard}: ${result.card.display}\n${U.game.duration}: ${result.duration}`,
						mentions: [result.winner]
					}
				);

				return;
			}

			let effectText = '';

			if (result.effect.type === 'skip') {
				effectText = `\n${U.game.effects.skip.replace('{0}', playerMention(result.nextPlayer))}`;
			} else if (result.effect.type === 'reverse') {
				effectText = `\n${U.game.effects.reverse}`;
			} else if (result.effect.type === 'draw') {
				effectText = `\n${U.game.effects.draw.replace('{0}', playerMention(result.nextPlayer)).replace('{1}', String(result.drawAmount))}`;
			} else if (result.effect.type === 'wild_draw') {
				effectText = `\n${U.game.effects.wildDraw.replace('{0}', playerMention(result.nextPlayer)).replace('{1}', String(result.drawAmount))}`;
			}

			await client.send(
				from,
				{
					text: `${U.game.title}\n\n${U.game.played.replace('{0}', playerMention(sender)).replace('{1}', result.card.display)}${result.chosenColor ? `\n${U.game.chosenColor}: ${result.chosenColor}` : ''}\n${effectText}\n\n${U.game.nextTurn}: ${playerMention(result.nextPlayer)}`,
					mentions: [sender, result.nextPlayer]
				}
			);

			if (result.handSize === 1) {
				await client.send(
					from,
					`${U.game.unoWarning.replace('{0}', playerMention(sender))}`,
					{ mentions: [sender] }
				);
			}

			await sendHand(result.nextPlayer, result.nextPlayer, { prefix: getPrefix() });
		} else if (args[1] === 'draw') {
			const game = Uno.getSession(from);

			if (!game) {
				return await client.reply(from, U.errors.noActiveGame, message);
			}

			const result = game.draw(sender);

			if (result.error) {
				return await client.reply(from, result.error, message);
			}

			await client.reply(
				from,
				`${U.game.drew.replace('{0}', result.card.display)}${result.canPlay ? `\n${U.game.canPlay}` : ''}`,
				message
			);

			if (!result.canPlay) {
				await client.send(
					from,
					{
						text: `${U.game.nextTurn}: ${playerMention(result.nextPlayer)}`,
						mentions: [result.nextPlayer]
					}
				);

				await sendHand(result.nextPlayer, result.nextPlayer, { prefix: getPrefix() });
			}
		} else if (args[1] === 'uno') {
			const game = Uno.getSession(from);

			if (!game) {
				return await client.reply(from, U.errors.noActiveGame, message);
			}

			const result = game.callUno(sender);

			if (result.error) {
				return await client.reply(from, result.error, message);
			}

			await client.send(
				from,
				`${U.game.unoCalled.replace('{0}', playerMention(sender))}`,
				{ mentions: [sender] }
			);
		} else if (args[1] === 'catch') {
			const game = Uno.getSession(from);

			if (!game) {
				return await client.reply(from, U.errors.noActiveGame, message);
			}

			const targetMention = args[2];

			if (!targetMention) {
				return await client.reply(from, U.errors.specifyPlayer, message);
			}

			const targetId = targetMention.replace('@', '') + '@s.whatsapp.net';

			const result = game.catchUno(sender, targetId);

			if (result.error) {
				return await client.reply(from, result.error, message);
			}

			await client.send(
				from,
				{
					text: `${U.game.caught.replace('{0}', playerMention(result.caughtPlayer)).replace('{1}', playerMention(sender))}`,
					mentions: [result.caughtPlayer, sender]
				}
			);
		} else if (args[1] === 'status') {
			const game = Uno.getSession(from);

			if (!game) {
				return await client.reply(from, U.errors.noActiveGame, message);
			}

			await sendGameStatus(from, game);
		} else if (args[1] === 'hand') {
			const game = Uno.getSession(from);

			if (!game) {
				return await client.reply(from, U.errors.noActiveGame, message);
			}

			await sendHand(sender, sender, { prefix: getPrefix() });
		} else if (args[1] === 'del' || args[1] === 'delete') {
			const game = Uno.getSession(from);

			if (!game) {
				return await client.reply(from, U.errors.noActiveGame, message);
			}

			if (game.host !== sender) {
				return await client.reply(from, U.errors.onlyHostDelete, message);
			}

			Uno.deleteSession(from);

			await client.reply(from, U.game.gameDeleted, message);
		} else if (args[1] === 'info') {
			await client.reply(
				from,
				`${U.info.title}\n\n${U.info.description}\n\n${U.info.commands}\n${U.info.newGame}\n${U.info.joinGame}\n${U.info.startGame}\n${U.info.playCard}\n${U.info.drawCard}\n${U.info.callUno}\n${U.info.catchUno}\n${U.info.status}\n${U.info.hand}\n${U.info.deleteGame}\n\n${U.info.howToPlay}\n${U.info.step1}\n${U.info.step2}\n${U.info.step3}\n${U.info.step4}\n${U.info.step5}`,
				message
			);
		}
	}
});
