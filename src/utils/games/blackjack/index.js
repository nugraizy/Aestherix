import configuration from '../../../helper/config/connect.js';

const SUITS = ['♠️', '♥️', '♦️', '♣️'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const createCard = (suit, value) => ({
	suit,
	value,
	display: `${value}${suit}`,
	numericValue: value === 'A' ? 11 : ['J', 'Q', 'K'].includes(value) ? 10 : parseInt(value, 10)
});

const createDeck = () => {
	const deck = [];

	for (const suit of SUITS) {
		for (const value of VALUES) {
			deck.push(createCard(suit, value));
		}
	}

	return deck;
};

const shuffleDeck = (deck) => {
	const shuffled = [...deck];

	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));

		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}

	return shuffled;
};

const calculateHandValue = (hand) => {
	let value = 0;
	let aces = 0;

	for (const card of hand) {
		value += card.numericValue;

		if (card.value === 'A') {
			aces++;
		}
	}

	while (value > 21 && aces > 0) {
		value -= 10;
		aces--;
	}

	return value;
};

const formatHand = (hand) => {
	return hand.map((card) => card.display).join(' ');
};

export class Blackjack {
	constructor(roomId, host) {
		this.roomId = roomId;
		this.host = host;
		this.players = new Map();
		this.phase = 'lobby';
		this.deck = [];
		this.dealerHand = [];
		this.currentPlayerIndex = 0;
		this.gameTimeStarted = new Date().getTime();
	}

	static getSession(roomId) {
		return configuration.games.blackjack.get(roomId);
	}

	static deleteSession(roomId) {
		configuration.games.blackjack.delete(roomId);
	}

	play() {
		configuration.games.blackjack.set(this.roomId, this);
	}

	addPlayer(playerId, playerName, bet = 100) {
		if (this.phase !== 'lobby') {
			return { error: 'Game already started.' };
		}

		if (this.players.has(playerId)) {
			return { error: 'Already joined.' };
		}

		if (this.players.size >= 6) {
			return { error: 'Room is full (max 6 players).' };
		}

		this.players.set(playerId, {
			name: playerName,
			hand: [],
			bet,
			chips: 1000,
			status: 'playing',
			result: null
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
		if (this.players.size < 1) {
			return { error: 'Need at least 1 player to start.' };
		}

		this.deck = shuffleDeck(createDeck());
		this.dealerHand = [];
		this.phase = 'playing';
		this.currentPlayerIndex = 0;

		for (const [, player] of this.players) {
			player.hand = [];
			player.status = 'playing';
			player.result = null;
		}

		this.dealerHand.push(this.drawCard());
		this.dealerHand.push(this.drawCard());

		for (const [, player] of this.players) {
			player.hand.push(this.drawCard());
			player.hand.push(this.drawCard());
		}

		const playerIds = [...this.players.keys()];

		return {
			status: 'started',
			dealerCard: this.dealerHand[0],
			currentPlayer: playerIds[this.currentPlayerIndex],
			currentPlayerName: this.players.get(playerIds[this.currentPlayerIndex]).name
		};
	}

	drawCard() {
		if (this.deck.length === 0) {
			this.deck = shuffleDeck(createDeck());
		}

		return this.deck.pop();
	}

	getCurrentPlayer() {
		const playerIds = [...this.players.keys()];

		return playerIds[this.currentPlayerIndex];
	}

	hit(playerId) {
		if (this.phase !== 'playing') {
			return { error: 'Game is not in progress.' };
		}

		if (playerId !== this.getCurrentPlayer()) {
			return { error: 'Not your turn.' };
		}

		const player = this.players.get(playerId);

		if (player.status !== 'playing') {
			return { error: 'You have already finished.' };
		}

		player.hand.push(this.drawCard());

		const handValue = calculateHandValue(player.hand);

		if (handValue > 21) {
			player.status = 'bust';
			player.result = 'bust';

			this.advanceTurn();

			return {
				status: 'bust',
				hand: formatHand(player.hand),
				value: handValue,
				nextPlayer: this.getCurrentPlayer(),
				nextPlayerName: this.players.get(this.getCurrentPlayer()).name
			};
		}

		if (handValue === 21) {
			player.status = 'stand';
			player.result = '21';

			this.advanceTurn();

			return {
				status: '21',
				hand: formatHand(player.hand),
				value: handValue,
				nextPlayer: this.getCurrentPlayer(),
				nextPlayerName: this.players.get(this.getCurrentPlayer()).name
			};
		}

		return {
			status: 'continue',
			hand: formatHand(player.hand),
			value: handValue
		};
	}

	stand(playerId) {
		if (this.phase !== 'playing') {
			return { error: 'Game is not in progress.' };
		}

		if (playerId !== this.getCurrentPlayer()) {
			return { error: 'Not your turn.' };
		}

		const player = this.players.get(playerId);

		if (player.status !== 'playing') {
			return { error: 'You have already finished.' };
		}

		player.status = 'stand';
		player.result = 'stand';

		this.advanceTurn();

		return {
			status: 'stand',
			hand: formatHand(player.hand),
			value: calculateHandValue(player.hand),
			nextPlayer: this.getCurrentPlayer(),
			nextPlayerName: this.players.get(this.getCurrentPlayer()).name
		};
	}

	advanceTurn() {
		const playerIds = [...this.players.keys()];
		let nextIndex = (this.currentPlayerIndex + 1) % playerIds.length;

		while (nextIndex !== this.currentPlayerIndex) {
			const nextPlayer = this.players.get(playerIds[nextIndex]);

			if (nextPlayer.status === 'playing') {
				this.currentPlayerIndex = nextIndex;
				return;
			}

			nextIndex = (nextIndex + 1) % playerIds.length;
		}

		this.currentPlayerIndex = nextIndex;
	}

	allPlayersDone() {
		for (const [, player] of this.players) {
			if (player.status === 'playing') {
				return false;
			}
		}

		return true;
	}

	playDealer() {
		while (calculateHandValue(this.dealerHand) < 17) {
			this.dealerHand.push(this.drawCard());
		}
	}

	resolveGame() {
		this.phase = 'ended';
		this.playDealer();

		const dealerValue = calculateHandValue(this.dealerHand);
		const results = [];

		for (const [playerId, player] of this.players) {
			const playerValue = calculateHandValue(player.hand);

			if (player.result === 'bust') {
				player.result = 'lose';
			} else if (dealerValue > 21) {
				player.result = 'win';
				player.chips += player.bet;
			} else if (playerValue > dealerValue) {
				player.result = 'win';
				player.chips += player.bet;
			} else if (playerValue < dealerValue) {
				player.result = 'lose';
				player.chips -= player.bet;
			} else {
				player.result = 'push';
			}

			results.push({
				id: playerId,
				name: player.name,
				hand: formatHand(player.hand),
				value: playerValue,
				result: player.result,
				chips: player.chips
			});
		}

		return {
			status: 'ended',
			dealerHand: formatHand(this.dealerHand),
			dealerValue,
			results,
			duration: this.getGameDuration()
		};
	}

	getStatus() {
		return {
			phase: this.phase,
			dealerCard: this.phase === 'playing' ? this.dealerHand[0] : null,
			currentPlayer: this.getCurrentPlayer(),
			players: [...this.players.entries()].map(([id, p]) => ({
				id,
				name: p.name,
				handSize: p.hand.length,
				status: p.status
			}))
		};
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
}
