import { randomNumber } from './math.js';

const identity = (string) => string;

export const reverseWord = (string = '') => string.split('').reverse().join('');

export const randomCase = (string = '') =>
	string.replace(/[A-Za-z]/gi, (str) => {
		const random = randomNumber(2);

		return random === 1 ? str.toUpperCase() : str.toLowerCase();
	});

export const wordWrapping = (string, options = {}) => {
	const width = options.width || 30;
	const indent = typeof options.indent === 'string' ? options.indent : '';
	const newLine = options.newLine || `\n${indent}`;
	const escape = typeof options.escape === 'function' ? options.escape : identity;
	const regex = `.{1,${width}}`;
	const newRegex = new RegExp(regex, 'g');
	const line = string.match(newRegex) || [];
	const result =
		indent +
		line
			.map((lines) => {
				if (lines.slice(-1) === '\n') {
					lines = lines.slice(0, lines.length - 1);
				}

				return escape(lines);
			})
			.join(newLine);

	if (options.trim === true) {
		return result.replace(/[ \t]*$/gm, '');
	}

	return result;
};

const chars = () => {
	const char = {
		up: [
			'̍', '̎', '̄', '̅', '̿', '̑', '̆', '̐', '͒', '͗', '͑', '̇', '̈', '̊', '͂', '̓', '̈́', '͊', '͋', '͌',
			'̃', '̂', '̌', '͐', '̀', '́', '̋', '̏', '̒', '̓', '̔', '̽', '̉', 'ͣ', 'ͤ', 'ͥ', 'ͦ', 'ͧ', 'ͨ', 'ͩ',
			'ͪ', 'ͫ', 'ͬ', 'ͭ', 'ͮ', 'ͯ', '̾', '͛', '͆', '̚'
		],
		middle: ['̕', '̛', '̀', '́', '͘', '̡', '̢', '̧', '̨', '̴', '̵', '̶', '͏', '͜', '͝', '͞', '͟', '͠', '͢', '̸', '̷', '͡', '҉'],
		down: [
			'̖', '̗', '̘', '̙', '̜', '̝', '̞', '̟', '̠', '̤', '̥', '̦', '̩', '̪', '̫', '̬', '̭', '̮', '̯', '̰',
			'̱', '̲', '̳', '̹', '̺', '̻', '̼', 'ͅ', '͇', '͈', '͉', '͍', '͎', '͓', '͔', '͕', '͖', '͙', '͚', '̣'
		]
	};

	char.all = [].concat(char.up, char.middle, char.down);
	char.pattern = RegExp(`(${char.all.join('|')})`, 'g');
	return char;
};

export const zalgo = (text = 'Mana textnya?', options = {}) => {
	text = text.split('');
	let counts;
	let result = '';
	const types = [];
	const charData = chars();

	if (options.up !== false) {
		types.push('up');
	}

	if (options.middle !== false) {
		types.push('middle');
	}

	if (options.down !== false) {
		types.push('down');
	}

	for (let i = 0, l = text.length; i < l; i++) {
		if (charData.pattern.test(text[i])) {
			continue;
		}

		if (text[i].length > 1) {
			result += text[i];
			continue;
		}

		counts = {
			up: 0,
			middle: 0,
			down: 0
		};

		if (options.size === 'mini') {
			counts.up = randomNumber(8);
			counts.middle = randomNumber(2);
			counts.down = randomNumber(8);
		} else if (options.size === 'maxi') {
			counts.up = randomNumber(16) + 3;
			counts.middle = randomNumber(4) + 1;
			counts.down = randomNumber(64) + 3;
		} else {
			counts.up = randomNumber(8) + 1;
			counts.middle = randomNumber(3);
			counts.down = randomNumber(8) + 1;
		}

		result += text[i];

		for (let j = 0, m = types.length; j < m; j++) {
			const type = types[j];
			let count = counts[type];
			const tchars = charData[type];
			const max = tchars.length - 1;

			while (count--) {
				result += tchars[randomNumber(max)];
			}
		}
	}

	return result;
};

const getZalgoPattern = () => chars().pattern;

export const extractZalgo = (text) => text.replace(getZalgoPattern(), '');

export const isZilgoo = (str) => str.match(/\u{1F1E6}/g);

const convertToRoman = (num) => {
	const lookup = {
		M̄: 1_000_000, D̄: 500_000, C̄: 100_000, L̄: 50_000, X̄: 10_000, V̄: 5000, Ī: 1000,
		M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1
	};
	let roman = '';
	let i;

	for (i in lookup) {
		while (num >= lookup[i]) {
			roman += i;
			num -= lookup[i];
		}
	}

	return roman;
};

export const regexNumber = (str) => (str.match(/\d+/g) !== null ? str.match(/\d+/g).join('') : '');

export const regexAlphabet = (str) => (str.match(/[a-zA-Z]+/g) !== null ? str.match(/[a-zA-Z]+/g).join('') : '');

export const romanize = (num) => {
	const container = [];

	num = String(num);
	num = num.includes('.') ? num.split('.') : [num];

	for (const number of num) {
		if (number.split(/[a-zA-Z]/g).length > 1) {
			container.push(regexAlphabet(number).toUpperCase());
		} else {
			container.push(convertToRoman(Number(regexNumber(number))));
		}
	}

	return container.join(' • ');
};

const wrapCenter = (text, { limit = 0, length = 0 }) => {
	if (text.length > limit) {
		text = text.slice(0, limit);
	}

	if (text.length > length) {
		text = text.slice(0, length);
	}

	const totalPadding = length - text.length;
	const paddingLeft = Math.floor(totalPadding / 2);
	const paddingRight = totalPadding - paddingLeft;

	return ' '.repeat(paddingLeft) + text + ' '.repeat(paddingRight);
};

export const wrapText = (text, { limit = 0, length = 0, center = false }) => {
	if (center) {
		return wrapCenter(text, { limit, length });
	}

	text = text.slice(0, limit);
	text += ' '.repeat(length - text.length);

	return text;
};

export const randomChar = (char, range) => {
	let chars = '';

	for (let i = 0; i < range; i++) {
		chars += char[Math.floor(Math.random() * char.length)];
	}

	return chars;
};
