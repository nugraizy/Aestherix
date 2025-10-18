import fs from 'fs-extra';
import configuration from '../../helper/config/connect.js';

const BLOCKS = {
	WHITE: '⬜',
	BLACK: '⬛',
	YELLOW: '🟨',
	GREEN: '🟩'
};

const WORDS = (await fs.readJSON('./databases/games/tebak_gambar/db.json'))
	.map((v) =>
		v.answer
			.toLowerCase()
			.split(' ')
			.find((v) => v.length === 5)
	)
	.filter(Boolean);

export class Wordle {
	constructor(id) {
		this.id = id;

		if (this.isPlaying()) {
			return this.session();
		}

		this.word = WORDS[Math.floor(Math.random() * WORDS.length)];
		this.board = this.word.split('').map((v) => (v === ' ' ? ' ' : BLOCKS.WHITE));
		this.message = null;
		this.guessed = [];
		this.gameTimeStarted = new Date().getTime();
		this.tries = 6;

		this.play();

		this.checkInput = (input) => {
			const data = this.session();

			this.tries -= 1;

			if (this.tries === 0) {
				this.exit();
				return {
					isWin: false,
					board: data.board.join(''),
					message: `No tries left. The word was "${data.word}".`,
					duration: this.getGameDuration()
				};
			}

			input = input.toLowerCase();

			if (input.length !== data.word.length) {
				const board = Array(input.length).fill(BLOCKS.BLACK);

				data.guessed.push({ input, board: board.join('') });
				data.board = board;
				return {
					board: board.join(''),
					words: data.word,
					message: 'Incorrect word length.',
					duration: this.getGameDuration()
				};
			}

			const board = this.evaluateGuess(input, data.word);

			data.board = board;
			data.guessed.push({ input, board: board.join('') });

			const isWin = board.every((b) => b === BLOCKS.GREEN);

			if (isWin) {
				this.exit();
				return {
					isWin: true,
					board: board.join(''),
					words: data.word,
					guessed: data.guessed,
					duration: this.getGameDuration()
				};
			}

			return {
				board: board.join(''),
				words: data.word,
				message: `❤️x${this.tries} remaining.`,
				duration: this.getGameDuration()
			};
		};
	}

	getGameDuration() {
		const endTime = new Date().getTime();
		const durationMs = endTime - this.gameTimeStarted;

		const seconds = Math.floor((durationMs / 1000) % 60);
		const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
		const hours = Math.floor(durationMs / (1000 * 60 * 60));

		const parts = [];

		if (hours > 0) {
			parts.push(`${hours}h`);
		}

		if (minutes > 0) {
			parts.push(`${minutes}m`);
		}

		if (seconds > 0 || parts.length === 0) {
			parts.push(`${seconds}s`);
		}

		return parts.join(' ');
	}

	evaluateGuess(guess, target) {
		const result = Array(guess.length).fill(BLOCKS.BLACK);
		const targetLetters = target.split('');
		const guessLetters = guess.split('');
		const used = Array(target.length).fill(false);

		for (let i = 0; i < guessLetters.length; i++) {
			if (guessLetters[i] === targetLetters[i]) {
				result[i] = BLOCKS.GREEN;
				used[i] = true;
				guessLetters[i] = null;
			}
		}

		for (let i = 0; i < guessLetters.length; i++) {
			if (!guessLetters[i]) {
				continue;
			}

			const index = targetLetters.findIndex((char, idx) => char === guessLetters[i] && !used[idx]);

			if (index !== -1) {
				result[i] = BLOCKS.YELLOW;
				used[index] = true;
			}
		}

		return result;
	}

	session() {
		return configuration.games.wordle.get(this.id);
	}

	isPlaying() {
		return configuration.games.wordle.has(this.id);
	}

	set messages(m) {
		this.message = m;
	}

	get messages() {
		return this.message;
	}

	exit() {
		configuration.games.wordle.delete(this.id);
	}

	play() {
		configuration.games.wordle.set(this.id, this);
	}
}
