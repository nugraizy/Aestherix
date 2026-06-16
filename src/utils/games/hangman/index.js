import fs from 'fs-extra';
import configuration from '../../../helper/config/connect.js';

const HANGMAN_STAGES = [
	`
  +---+
  |   |
      |
      |
      |
      |
=========`,
	`
  +---+
  |   |
  O   |
      |
      |
      |
=========`,
	`
  +---+
  |   |
  O   |
  |   |
      |
      |
=========`,
	`
  +---+
  |   |
  O   |
 /|   |
      |
      |
=========`,
	`
  +---+
  |   |
  O   |
 /|\\  |
      |
      |
=========`,
	`
  +---+
  |   |
  O   |
 /|\\  |
 /    |
      |
=========`,
	`
  +---+
  |   |
  O   |
 /|\\  |
 / \\  |
      |
=========`
];

const WORDS = (await fs.readJSON('./databases/games/tebak_gambar/db.json'))
	.map((v) => v.answer.toLowerCase().trim())
	.filter((v) => v.length >= 3 && v.length <= 15);

export class Hangman {
	constructor(id) {
		this.id = id;

		if (this.isPlaying()) {
			return this.session();
		}

		this.word = WORDS[Math.floor(Math.random() * WORDS.length)];
		this.guessed = [];
		this.wrongGuesses = 0;
		this.maxWrongGuesses = 6;
		this.gameTimeStarted = new Date().getTime();
		this.message = null;

		this.play();
	}

	getDisplayWord() {
		return this.word
			.split('')
			.map((char) => (char === ' ' ? ' ' : this.guessed.includes(char) ? char : '_'))
			.join(' ');
	}

	getHangmanStage() {
		return HANGMAN_STAGES[this.wrongGuesses];
	}

	getGuessedLetters() {
		if (this.guessed.length === 0) {
			return 'None';
		}

		return this.guessed.join(', ').toUpperCase();
	}

	guessLetter(letter) {
		letter = letter.toLowerCase();

		if (letter.length !== 1 || !/[a-z]/.test(letter)) {
			return {
				status: 'invalid',
				message: 'Please guess a single letter (a-z).'
			};
		}

		if (this.guessed.includes(letter)) {
			return {
				status: 'already_guessed',
				message: `You already guessed "${letter.toUpperCase()}".`
			};
		}

		this.guessed.push(letter);

		if (this.word.includes(letter)) {
			const displayWord = this.getDisplayWord();
			const isWin = !displayWord.includes('_');

			if (isWin) {
				this.exit();
				return {
					status: 'win',
					displayWord,
					word: this.word,
					wrongGuesses: this.wrongGuesses,
					duration: this.getGameDuration()
				};
			}

			return {
				status: 'correct',
				displayWord,
				hangman: this.getHangmanStage(),
				guessed: this.getGuessedLetters(),
				wrongGuesses: this.wrongGuesses,
				remaining: this.maxWrongGuesses - this.wrongGuesses
			};
		}

		this.wrongGuesses++;

		if (this.wrongGuesses >= this.maxWrongGuesses) {
			this.exit();
			return {
				status: 'lose',
				word: this.word,
				hangman: this.getHangmanStage(),
				duration: this.getGameDuration()
			};
		}

		return {
			status: 'wrong',
			displayWord: this.getDisplayWord(),
			hangman: this.getHangmanStage(),
			guessed: this.getGuessedLetters(),
			wrongGuesses: this.wrongGuesses,
			remaining: this.maxWrongGuesses - this.wrongGuesses
		};
	}

	guessWord(word) {
		word = word.toLowerCase().trim();

		if (word === this.word) {
			this.exit();
			return {
				status: 'win',
				displayWord: this.word.split(' ').map((w) => w.split('').join(' ')).join('  '),
				word: this.word,
				wrongGuesses: this.wrongGuesses,
				duration: this.getGameDuration()
			};
		}

		this.wrongGuesses++;

		if (this.wrongGuesses >= this.maxWrongGuesses) {
			this.exit();
			return {
				status: 'lose',
				word: this.word,
				hangman: this.getHangmanStage(),
				duration: this.getGameDuration()
			};
		}

		return {
			status: 'wrong_word',
			displayWord: this.getDisplayWord(),
			hangman: this.getHangmanStage(),
			guessed: this.getGuessedLetters(),
			wrongGuesses: this.wrongGuesses,
			remaining: this.maxWrongGuesses - this.wrongGuesses
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

	session() {
		return configuration.games.hangman.get(this.id);
	}

	isPlaying() {
		return configuration.games.hangman.has(this.id);
	}

	set messages(m) {
		this.message = m;
	}

	get messages() {
		return this.message;
	}

	exit() {
		configuration.games.hangman.delete(this.id);
	}

	play() {
		configuration.games.hangman.set(this.id, this);
	}
}
