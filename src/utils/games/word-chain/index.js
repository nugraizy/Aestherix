import configuration from '../../../helper/config/connect.js';

export class WordChain {
	constructor(roomId, host) {
		this.roomId = roomId;
		this.host = host;
		this.players = new Map();
		this.phase = 'lobby';
		this.currentPlayerIndex = 0;
		this.words = [];
		this.currentLetter = null;
		this.turnTimer = null;
		this.turnTimeLimit = 30000;
		this.gameTimeStarted = new Date().getTime();
		this.turnStartTime = null;
	}

	static getSession(roomId) {
		return configuration.games.wordChain.get(roomId);
	}

	static deleteSession(roomId) {
		configuration.games.wordChain.delete(roomId);
	}

	play() {
		configuration.games.wordChain.set(this.roomId, this);
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
			score: 0,
			wordsUsed: 0
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

		this.phase = 'playing';
		this.currentPlayerIndex = 0;
		this.turnStartTime = Date.now();

		return {
			status: 'started',
			currentPlayer: this.getCurrentPlayer(),
			currentPlayerName: this.players.get(this.getCurrentPlayer()).name
		};
	}

	getCurrentPlayer() {
		const playerIds = [...this.players.keys()];

		return playerIds[this.currentPlayerIndex];
	}

	submitWord(playerId, word) {
		if (this.phase !== 'playing') {
			return { error: 'Game is not in progress.' };
		}

		if (playerId !== this.getCurrentPlayer()) {
			return { error: 'Not your turn.' };
		}

		word = word.toLowerCase().trim();

		if (word.length < 2) {
			return { error: 'Word must be at least 2 characters.' };
		}

		if (!/^[a-z]+$/.test(word)) {
			return { error: 'Word must contain only letters.' };
		}

		if (this.words.includes(word)) {
			return { error: 'Word already used.' };
		}

		if (this.currentLetter && !word.startsWith(this.currentLetter)) {
			return { error: `Word must start with "${this.currentLetter.toUpperCase()}".` };
		}

		this.words.push(word);
		this.currentLetter = word[word.length - 1];

		const player = this.players.get(playerId);

		player.wordsUsed++;
		player.score += word.length;

		this.advanceTurn();
		this.turnStartTime = Date.now();

		return {
			status: 'continue',
			word,
			nextPlayer: this.getCurrentPlayer(),
			nextPlayerName: this.players.get(this.getCurrentPlayer()).name,
			currentLetter: this.currentLetter,
			score: player.score
		};
	}

	advanceTurn() {
		const playerIds = [...this.players.keys()];

		this.currentPlayerIndex = (this.currentPlayerIndex + 1) % playerIds.length;
	}

	skipTurn(playerId) {
		if (this.phase !== 'playing') {
			return { error: 'Game is not in progress.' };
		}

		if (playerId !== this.getCurrentPlayer()) {
			return { error: 'Not your turn.' };
		}

		this.advanceTurn();
		this.turnStartTime = Date.now();

		return {
			status: 'skipped',
			nextPlayer: this.getCurrentPlayer(),
			nextPlayerName: this.players.get(this.getCurrentPlayer()).name
		};
	}

	endGame() {
		this.phase = 'ended';

		const standings = [...this.players.entries()]
			.map(([id, data]) => ({
				id,
				...data
			}))
			.sort((a, b) => b.score - a.score);

		return {
			status: 'ended',
			standings,
			totalWords: this.words.length,
			duration: this.getGameDuration()
		};
	}

	getStatus() {
		return {
			phase: this.phase,
			currentPlayer: this.getCurrentPlayer(),
			currentPlayerName: this.players.get(this.getCurrentPlayer()).name,
			currentLetter: this.currentLetter,
			totalWords: this.words.length,
			words: this.words.slice(-10),
			duration: this.getGameDuration()
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
