import configuration from '../../../helper/config/connect.js';
import {
	createDeck,
	shuffleDeck,
	canPlayCard,
	getCardEffect,
	COLORS,
	WILD
} from './cards.js';

const HAND_SIZE = 7;

export class Uno {
	constructor(roomId, host) {
		this.roomId = roomId;
		this.host = host;
		this.players = new Map();
		this.phase = 'lobby';
		this.deck = [];
		this.discardPile = [];
		this.currentPlayerIndex = 0;
		this.direction = 1;
		this.gameTimeStarted = new Date().getTime();
		this.chosenColor = null;
		this.drawStack = 0;
		this.lastActivity = Date.now();
	}

	static getSession(roomId) {
		return configuration.games.uno.get(roomId);
	}

	static deleteSession(roomId) {
		configuration.games.uno.delete(roomId);
	}

	play() {
		configuration.games.uno.set(this.roomId, this);
	}

	addPlayer(playerId, playerName) {
		if (this.phase !== 'lobby') {
			return { error: 'Game already started.' };
		}

		if (this.players.has(playerId)) {
			return { error: 'Already joined.' };
		}

		if (this.players.size >= 10) {
			return { error: 'Room is full (max 10 players).' };
		}

		this.players.set(playerId, {
			name: playerName,
			hand: [],
			unoCalled: false,
			maxButtons: 20
		});

		return { success: true };
	}

	removePlayer(playerId) {
		if (this.phase !== 'lobby') {
			return { error: 'Cannot leave during game.' };
		}

		if (playerId === this.host) {
			return { error: 'Host cannot leave. Delete the game instead.' };
		}

		this.players.delete(playerId);
		return { success: true };
	}

	start() {
		if (this.players.size < 2) {
			return { error: 'Need at least 2 players to start.' };
		}

		this.deck = shuffleDeck(createDeck());
		this.phase = 'playing';

		for (const [, player] of this.players) {
			player.hand = [];

			for (let i = 0; i < HAND_SIZE; i++) {
				player.hand.push(this.drawCard());
			}
		}

		let firstCard = this.drawCard();

		while (firstCard.color === WILD) {
			this.deck.push(firstCard);
			this.deck = shuffleDeck(this.deck);
			firstCard = this.drawCard();
		}

		this.discardPile.push(firstCard);
		this.chosenColor = null;

		const playerIds = [...this.players.keys()];

		this.currentPlayerIndex = 0;

		return {
			status: 'started',
			firstCard,
			currentPlayer: playerIds[this.currentPlayerIndex]
		};
	}

	drawCard() {
		if (this.deck.length === 0) {
			const topCard = this.discardPile.pop();

			this.deck = shuffleDeck(this.discardPile);
			this.discardPile = [topCard];
		}

		return this.deck.pop();
	}

	getPlayerMaxButtons(playerId) {
		const player = this.players.get(playerId);

		return player ? player.maxButtons : 20;
	}

	getCurrentPlayer() {
		const playerIds = [...this.players.keys()];

		return playerIds[this.currentPlayerIndex];
	}

	getTopCard() {
		return this.discardPile[this.discardPile.length - 1];
	}

	getPlayerHand(playerId) {
		const player = this.players.get(playerId);

		return player ? player.hand : [];
	}

	playCard(playerId, cardIndex, chosenColor = null) {
		this.lastActivity = Date.now();

		if (this.phase !== 'playing') {
			return { error: 'Game is not in progress.' };
		}

		const currentPlayerId = this.getCurrentPlayer();

		if (playerId !== currentPlayerId) {
			return { error: 'Not your turn.' };
		}

		const player = this.players.get(playerId);

		if (cardIndex < 0 || cardIndex >= player.hand.length) {
			return { error: 'Invalid card index.' };
		}

		const card = player.hand[cardIndex];
		const topCard = this.getTopCard();

		if (!canPlayCard(card, topCard, this.chosenColor)) {
			return { error: 'Cannot play this card. Color or value must match.' };
		}

		if ((card.value === 'Wild' || card.value === 'Wild +4') && !chosenColor) {
			return { error: 'Must choose a color for wild card.', requiresColor: true };
		}

		if (chosenColor && !COLORS.includes(chosenColor)) {
			return { error: 'Invalid color. Use: 🔴🔵🟢🟡' };
		}

		player.hand.splice(cardIndex, 1);
		this.discardPile.push(card);
		this.chosenColor = chosenColor;

		const effect = getCardEffect(card);

		if (player.hand.length === 0) {
			this.phase = 'ended';

			return {
				status: 'win',
				winner: playerId,
				winnerName: player.name,
				card,
				effect,
				duration: this.getGameDuration()
			};
		}

		if (player.hand.length === 1 && !player.unoCalled) {
			player.unoCalled = false;
		}

		let nextPlayer = this.getNextPlayer();
		let drawAmount = 0;

		if (effect.type === 'skip') {
			this.advanceTurn();
			this.advanceTurn();
			nextPlayer = this.getCurrentPlayer();
		} else if (effect.type === 'reverse') {
			this.direction *= -1;

			if (this.players.size === 2) {
				this.advanceTurn();
				this.advanceTurn();
			} else {
				this.advanceTurn();
			}

			nextPlayer = this.getCurrentPlayer();
		} else if (effect.type === 'draw') {
			this.advanceTurn();
			nextPlayer = this.getCurrentPlayer();
			drawAmount = effect.amount;

			for (let i = 0; i < drawAmount; i++) {
				const drawnCard = this.drawCard();

				this.players.get(nextPlayer).hand.push(drawnCard);
			}
		} else if (effect.type === 'wild_draw') {
			this.advanceTurn();
			nextPlayer = this.getCurrentPlayer();
			drawAmount = 4;

			for (let i = 0; i < drawAmount; i++) {
				const drawnCard = this.drawCard();

				this.players.get(nextPlayer).hand.push(drawnCard);
			}
		} else {
			this.advanceTurn();
			nextPlayer = this.getCurrentPlayer();
		}

		return {
			status: 'played',
			card,
			chosenColor,
			effect,
			nextPlayer,
			nextPlayerName: this.players.get(nextPlayer).name,
			drawAmount,
			handSize: player.hand.length
		};
	}

	draw(playerId) {
		this.lastActivity = Date.now();

		if (this.phase !== 'playing') {
			return { error: 'Game is not in progress.' };
		}

		const currentPlayerId = this.getCurrentPlayer();

		if (playerId !== currentPlayerId) {
			return { error: 'Not your turn.' };
		}

		const player = this.players.get(playerId);
		const drawnCard = this.drawCard();

		player.hand.push(drawnCard);

		const topCard = this.getTopCard();
		const canPlay = canPlayCard(drawnCard, topCard, this.chosenColor);

		this.advanceTurn();

		return {
			status: 'drew',
			card: drawnCard,
			canPlay,
			nextPlayer: this.getCurrentPlayer(),
			nextPlayerName: this.players.get(this.getCurrentPlayer()).name
		};
	}

	callUno(playerId) {
		const player = this.players.get(playerId);

		if (!player) {
			return { error: 'Not in the game.' };
		}

		if (player.hand.length !== 1) {
			return { error: 'You can only call UNO when you have 1 card.' };
		}

		player.unoCalled = true;

		return { status: 'uno_called', playerName: player.name };
	}

	catchUno(catcherId, targetId) {
		const target = this.players.get(targetId);

		if (!target) {
			return { error: 'Player not found.' };
		}

		if (target.hand.length !== 1 || target.unoCalled) {
			return { error: 'Cannot catch this player.' };
		}

		for (let i = 0; i < 2; i++) {
			target.hand.push(this.drawCard());
		}

		return {
			status: 'caught',
			caughtPlayer: targetId,
			caughtName: target.name,
			catcherName: this.players.get(catcherId).name
		};
	}

	getNextPlayer() {
		const playerIds = [...this.players.keys()];
		let nextIndex = (this.currentPlayerIndex + this.direction) % playerIds.length;

		if (nextIndex < 0) {
			nextIndex += playerIds.length;
		}

		return playerIds[nextIndex];
	}

	advanceTurn() {
		const playerIds = [...this.players.keys()];

		this.currentPlayerIndex = (this.currentPlayerIndex + this.direction) % playerIds.length;

		if (this.currentPlayerIndex < 0) {
			this.currentPlayerIndex += playerIds.length;
		}
	}

	getGameDuration() {
		const endTime = new Date().getTime();
		const durationMs = endTime - this.gameTimeStarted;

		const seconds = Math.floor((durationMs / 1000) % 60);
		const minutes = Math.floor((durationMs / (1000 * 60)) % 60);

		const parts = [];

		if (minutes > 0) {
			parts.push(`${minutes}m`);
		}

		if (seconds > 0 || parts.length === 0) {
			parts.push(`${seconds}s`);
		}

		return parts.join(' ');
	}

	getStatus() {
		const playerIds = [...this.players.keys()];
		const currentPlayerId = this.getCurrentPlayer();
		const topCard = this.getTopCard();

		return {
			phase: this.phase,
			currentPlayer: currentPlayerId,
			currentPlayerName: this.players.get(currentPlayerId).name,
			topCard,
			chosenColor: this.chosenColor,
			direction: this.direction,
			players: playerIds.map((id) => ({
				id,
				name: this.players.get(id).name,
				cards: this.players.get(id).hand.length
			})),
			deckSize: this.deck.length
		};
	}
}
