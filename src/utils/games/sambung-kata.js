import dayjs from 'dayjs';

import configuration from '../../helper/config/connect.js';
import { cheerioLOAD, fetchJSON, fetchTEXT, randomize } from '../modules/index.js';
import { checkIntervals, deleteIntervals, setIntervals } from '../misc/intervals.js';

const URL_BASE = (input) => `https://kbbi.kemdikbud.go.id/entri/${input}`;

const URL_RANDOM_WORD =
	'https://gist.githubusercontent.com/sipalingkoding/ca07ee6116d5ed5bdddfbe2d1a3a0e56/raw/3b4fb33bc60bbb42089cc75bed93e7477fe4ab5c/list-kata.json';
const WORD_NOT_FOUND = ' Entri tidak ditemukan.';
const RESPONSE = {
	WRONG_TURN: {
		status: false,
		message: 'Its not your turn.'
	},
	CLUE_DOESNT_MATCH: {
		status: false,
		message: 'Your word doesnt starts with the clue are given.'
	},
	FAIL_TO_FIND_WORD: {
		status: false,
		message: 'Your word does not seem valid on KBBI. Try another word.'
	},
	ALREADY_GUESSED: {
		status: false,
		message: 'The word already guessed. Try another word.'
	},
	GAME_ALREADY_STARTED: {
		status: false,
		message: 'The game already playing. Please connect the word to the given clue.'
	},
	WAITING_FOR_OPPONENT: {
		status: false,
		message: 'You on a game waiting for opponent.'
	},
	INVALID_ANSWER: {
		status: false,
		message: 'Your word contain special character or space. Use one word only.'
	}
};
const GAME_STATUS = {
	PLAYING: 'playing',
	WAITING: 'waiting'
};

const RegexEndWord = (arr) => arr.filter((v) => /([aiueo])/.test(v.slice(-1)));

export const getSambungkataSession = (group) => configuration.games.word.get(group);

export class SambungKata {
	constructor(player1, player2, group) {
		this.player1 = player1;
		this.player2 = player2;
		this.group = group;
		this.words = null;
		this.clue = null;
		this.turn = null;
		this.guessed = [];
		this.status = GAME_STATUS.WAITING;
		configuration.games.word.set(group, this);
	}

	checkValidClue(word, prevClue) {
		if (!word.startsWith(prevClue)) {
			return false;
		}

		return true;
	}

	checkIsGuessed(word) {
		if (this.guessed.includes(word)) {
			return true;
		}

		return false;
	}

	checkTurn(player) {
		return this.turn === player;
	}

	changeTurn() {
		this.turn = this.turn === this.player1 ? this.player2 : this.player1;
		return this.turn;
	}

	checkStatus() {
		return this.status;
	}

	throwResponse() {
		return this.checkStatus() === 'waiting' ? RESPONSE.WAITING_FOR_OPPONENT : RESPONSE.GAME_ALREADY_STARTED;
	}

	async start(player2, client) {
		this.player2 = player2;
		const data = await this.randomWord();
		const remainings = dayjs(new Date()).add(20, 's').valueOf();

		setIntervals(
			configuration.timers.word,
			this.group,
			20,
			(clients = client, group = this.group, remaining = remainings) => {
				const data = configuration.timers.word.get(group);

				if (!data) {
					return;
				}

				const second = Math.floor(((remaining - new Date().getTime()) % (1000 * 60)) / 1000);
				const dataGame = configuration.games.word.get(group);

				data.timer = second;
				dataGame.timer = second;
				const { timer } = checkIntervals(data);

				if (timer === 10) {
					clients.instance.send(group, {
						text: `Time's almost over! 10 second @${dataGame.turn.split('@')[0]}`,
						mentions: [dataGame.turn]
					});
				}

				if (timer <= 0) {
					deleteIntervals(data, configuration.timers.word, group);
					const winner = dataGame.changeTurn();

					clients.instance.send(group, {
						text: `Time's up! The winner is : @${winner.split('@')[0]}`,
						mentions: [winner]
					});
					configuration.games.word.delete(configuration.games.word.get(group));
				}
			}
		);
		return { ...this, ...data };
	}

	random(i) {
		const random = randomize([-2, 2, -2, 2, -2, 2, -2, 2, -2, 2, -2, 2]);
		const randomL = randomize([-2, 2, -2, 2, -2, 2, -2, 2, -2, 2, -2, 2]);

		if (i.includes('.')) {
			return random === 2 ? i.split('.')[0] : i.split('.')[1];
		}

		return random === 2 ? i.slice(0, randomL === 2 ? 3 : 2) : i.slice(randomL === 2 ? -3 : -2);
	}

	async randomWord() {
		const MAX_ATTEMPTS = 3;

		for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
			try {
				const WORDS = await fetchJSON(URL_RANDOM_WORD);
				const RANDOM_WORD = randomize(RegexEndWord(WORDS));

				this.words = RANDOM_WORD;
				this.clue = this.random(RANDOM_WORD);
				this.guessed.push(RANDOM_WORD);
				this.turn = randomize([this.player1, this.player2]);

				return { value: RANDOM_WORD, clue: this.clue.trim() };
			} catch {
				if (attempt === MAX_ATTEMPTS) {
					throw new Error('Failed to retrieve a random word after multiple attempts.');
				}
			}
		}
	}

	async checkWord(word, prevClue) {
		if (word.includes(' ')) {
			return RESPONSE.INVALID_ANSWER;
		}

		if (this.checkIsGuessed(word)) {
			return RESPONSE.ALREADY_GUESSED;
		}

		if (!this.checkValidClue(word, prevClue)) {
			return RESPONSE.CLUE_DOESNT_MATCH;
		}

		const data = await fetchTEXT(URL_BASE(word));
		const $ = cheerioLOAD(data);

		if ($('body > div.container.body-content > h4:nth-child(6)').text() === WORD_NOT_FOUND) {
			return RESPONSE.FAIL_TO_FIND_WORD;
		}

		const value = $('body > div.container.body-content > h2:nth-child(5)').text().replace(/[0-9]/g, '');

		return {
			status: true,
			value: value.replace('.', ''),
			clue: this.random(value)
		};
	}

	async guess(word, guesser, group, client) {
		if (!configuration.timers.word.get(group) && !configuration.games.word.get(group)) {
			return false;
		}

		if (!this.player2) {
			return false;
		}

		if (!this.checkTurn(guesser)) {
			return RESPONSE.WRONG_TURN;
		}

		const data = await this.checkWord(word, this.clue);

		if (!data.status) {
			return data;
		}

		this.changeTurn();
		this.words = data.value;
		this.clue = data.clue;
		deleteIntervals(configuration.timers.word.get(this.group), configuration.timers.word, this.group);
		const remainings = dayjs(new Date()).add(20, 's').valueOf();

		setIntervals(
			configuration.timers.word,
			this.group,
			20,
			(clients = client, group = this.group, remaining = remainings) => {
				const data = configuration.timers.word.get(group);

				if (data === undefined) {
					return;
				}

				const second = Math.floor(((remaining - new Date().getTime()) % (1000 * 60)) / 1000);
				const dataGame = configuration.games.word.get(group);

				data.timer = second;
				dataGame.timer = second;
				const { timer } = checkIntervals(data);

				if (timer === 10) {
					clients.instance.send(group, {
						text: `Time's almost over! 10 second @${dataGame.turn.split('@')[0]}`,
						mentions: [dataGame.turn]
					});
				}

				if (timer <= 0) {
					deleteIntervals(data, configuration.timers.word, group);
					const winner = dataGame.changeTurn();

					clients.instance.send(group, {
						text: `Time's up! The winner is : @${winner.split('@')[0]}`,
						mentions: [winner]
					});
					configuration.games.word.delete(group);
				}
			}
		);
		return this;
	}
}
