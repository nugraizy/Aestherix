import fs from 'fs-extra';

import configuration from '../../connect.js';

const ALPHABET_ON_KEYBOARD = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const BLOCKS = {
	WHITE: '⬜',
	BLACK: '⬛',
	YELLOW: '🟨',
	GREEN: '🟩',
};

const WORDS = [];

(await fs.readJSON('./Databases/Games/Tebak Gambar/db.json')).forEach((element) => {
	element.answer.split(' ').forEach((word) => {
		WORDS.push(word);
	});
});

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

		this.play();

		this.checkInput = (input) => {
			const data = this.session();

			input = input.toLowerCase().split('');

			if (input.length !== data.word.length) {
				const board = data.board.map((v) => (v == ' ' ? ' ' : BLOCKS.BLACK));

				data.guessed.push({ input: input.join(''), board: board.join('') });
				data.board = board;
				return {
					board: board.join(''),
					words: data.words,
				};
			}

			for (let i = 0; i < input.length; i++) {
				const blocks = data.checkClosesAlphabet(input[i], data.word[i]);

				if (input[i] !== ' ' && data.word[i] !== ' ') {
					if (blocks.green) {
						data.board[i] = BLOCKS.GREEN;
					} else if (blocks.yellow) {
						data.board[i] = BLOCKS.YELLOW;
					} else {
						data.board[i] = BLOCKS.BLACK;
					}
				} else {
					data.board[i] = ' ';
				}
			}

			data.guessed.push({ input: input.join(''), board: data.board.join('') });

			if (data.checkWin()) {
				const boardWon = data.board;
				const board = boardWon.join('');
				const words = data.word;

				data.exit();
				return {
					isWin: true,
					board,
					words,
					guessed: data.guessed,
				};
			}

			return {
				board: data.board.join(''),
				words: data.words,
			};
		};

		this.exit = () => {
			configuration.games.wordle.delete(this.id);
		};
	}

	checkWin() {
		return this.board.every((v) => v == BLOCKS.GREEN || v == ' ');
	}

	checkClosesAlphabet(inp, alp) {
		switch (true) {
			case inp == alp:
				return {
					green: true,
				};
			case ALPHABET_ON_KEYBOARD.some((v) => v.includes(inp) && v.includes(alp)): {
				const indexAlp = ALPHABET_ON_KEYBOARD[ALPHABET_ON_KEYBOARD.findIndex((v) => v.includes(alp))].split('').findIndex((v) => v == alp);
				const indexInp = ALPHABET_ON_KEYBOARD[ALPHABET_ON_KEYBOARD.findIndex((v) => v.includes(inp))].split('').findIndex((v) => v == inp);
				const index = Math.abs(indexAlp - indexInp);

				if (index >= 3) {
					return {
						black: true,
					};
				}

				return {
					yellow: true,
				};
			}
			default: {
				return {
					black: true,
				};
			}
		}
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

	play() {
		configuration.games.wordle.set(this.id, this);
	}
}
