/* global log */
import axios from 'axios';
import cheerio from 'cheerio';
import { fileTypeFromBuffer } from 'file-type';
import FormData from 'form-data';
import fs from 'fs-extra';
import gradient from 'gradient-string';
import fetch from 'node-fetch';
import ms from 'parse-ms';

import configuration from '../../connect.js';

/**
 * Fetches texts
 * @param {string} url
 * @param {RequestInit} options node-fetch options
 * @returns {Promise<string>}
 */
export const fetchTEXT = async (url, options) => await (await fetch(url, options)).text();

/**
 * Fetches objects
 * @param {string} url
 * @param {RequestInit} options node-fetch options
 * @returns {Promise<object>}
 */
export const fetchJSON = async (url, options) => await (await fetch(url, options)).json();

/**
 * Fetches buffers
 * @param {string} url
 * @param {RequestInit} options node-fetch options
 * @returns {Promise<ArrayBufferLike>}
 */
export const fetchBUFFER = async (url, options) => await (await fetch(url, options)).arrayBuffer();

/**
 * Load HTML using cheerio
 * @param {string} html
 * @returns {import('cheerio').CheerioAPI}
 */
export const cheerioLOAD = (html) => cheerio.load(html);

/**
 * Douwnload files using axios
 * @param {string} url direct url download.
 * @param {string} path local filepath where the file will be save.
 * @returns {Promise<string>}
 */
export const download = async (url, path) => {
	await new Promise(async (resolve, reject) => {
		try {
			const { data } = await axios({
				url,
				method: 'GET',
				responseType: 'arraybuffer',
			});

			path = path || `./temporary_files/${Date.now()}.${(await fileTypeFromBuffer(data)).ext}`;
			await fs.writeFile(path, data);
			resolve();
		} catch (err) {
			reject(err);
		}
	});
	return path;
};

/**
 * Clamp Floats utility
 * @param {number} value
 * @returns {(value | 1 | -1)}
 */
export const clampFloat = (value) => (value > 1 ? 1 : value < -1 ? -1 : value);

/**
 * Distord FX utility
 * @param {number} value
 * @returns {(0 | 1 | -1 )}
 */
export const distordFX = (value) => (value > 0 ? 1 : value < 0 ? -1 : 0);

export const clamp = (value, min, max) => Math.min(Math.max(min, value), max);

export const shuffleArray = (array = []) => {
	let curId = array.length;

	while (0 !== curId) {
		const randId = Math.floor(Math.random() * curId);

		curId--;
		const tmp = array[curId];

		array[curId] = array[randId];
		array[randId] = tmp;
	}
	return array;
};

export const randomArray = (array = []) => array[Math.floor(Math.random() * array.length)];

export const removeDuplicatesArray = (array = []) => [...new Set(array)];

export const reverseWord = (string = '') => string.split('').reverse().join('');

export const reverseArray = (array = []) => array.reverse();

export const randomCase = (string = '') => {
	const container = [];

	string.split('').map((str) => {
		if (Math.floor(Math.random() * 2) + 1 == 1) {
			container.push(str.toLowerCase());
		} else {
			container.push(str.toUpperCase());
		}
	});
	return container.join('');
};

String.prototype.toReadAble = function () {
	const sec = parseInt(this, 10);
	let hours = Math.floor(sec / 3600);
	let minutes = Math.floor((sec - hours * 3600) / 60);
	let seconds = sec - hours * 3600 - minutes * 60;

	if (hours < 10) {
		hours = `0${hours}`;
	}

	if (minutes < 10) {
		minutes = `0${minutes}`;
	}

	if (seconds < 10) {
		seconds = `0${seconds}`;
	}

	return `${hours}:${minutes}:${seconds}`;
};

String.prototype.seperateCamel = function () {
	return this.replace(/[A-Z]/g, (_) => ` ${_}`);
};

String.prototype.capitalize = function () {
	return this.toLowerCase()
		.split(' ')
		.map((str) => str.charAt(0).toUpperCase() + str.slice(1))
		.join(' ');
};

String.prototype.PARSE_EVENTS = function (...args) {
	return args.some((v) => v == this);
};

String.prototype.mocking = function () {
	const replacing = ['4', '8', '3', '9', '1', '0', '5', '7', '2'];
	const container = [];

	randomCase(this)
		.split('')
		.map((str) => {
			if (str === str.toUpperCase()) {
				container.push(
					str
						.replace(/A/gi, replacing[0])
						.replace(/B/gi, replacing[1])
						.replace(/E/gi, replacing[2])
						.replace(/G/gi, replacing[3])
						.replace(/I/gi, replacing[4])
						.replace(/O/gi, replacing[5])
						.replace(/S/gi, replacing[6])
						.replace(/T/gi, replacing[7])
						.replace(/Z/gi, replacing[8]),
				);
			} else {
				container.push(str);
			}
		});

	return container.join('');
};

String.prototype.formatHeaders = function () {
	return `\`\`\` • ${this || 'This is Headers'}\`\`\``;
};

export const numberWithCommas = (number = 0, region = 'id') => parseInt(number).toLocaleString(region);

export const identity = (string) => string;

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

export const calcCrow = (lats1, lon1, lats2, lon2) => {
	const R = 6371;
	const dLat = () => lats2 - (lats1 * Math.PI) / 180;
	const dLon = () => lon2 - (lon1 * Math.PI) / 180;
	const lat1 = () => (lats1 * Math.PI) / 18_080;
	const lat2 = () => (lats2 * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return R * c;
};

export const getFilesizeFromBytes = (bytes = 0) => {
	if (bytes >= 1_073_741_824) {
		bytes = `${(bytes / 1_073_741_824).toFixed(2)} GB`;
	} else if (bytes >= 1_048_576) {
		bytes = `${(bytes / 1_048_576).toFixed(2)} MB`;
	} else if (bytes >= 1024) {
		bytes = `${(bytes / 1024).toFixed(2)} KB`;
	} else if (bytes > 1) {
		bytes += ' bytes';
	} else if (bytes == 1) {
		return `${bytes} byte`;
	} else {
		return '0 bytes';
	}

	return bytes;
};

export const getFilesize = (filename) => {
	const stats = fs.statSync(filename);
	let bytes = stats.size;

	if (bytes >= 1_073_741_824) {
		bytes = `${(bytes / 1_073_741_824).toFixed(2)} GB`;
	} else if (bytes >= 1_048_576) {
		bytes = `${(bytes / 1_048_576).toFixed(2)} MB`;
	} else if (bytes >= 1024) {
		bytes = `${(bytes / 1024).toFixed(2)} KB`;
	} else if (bytes > 1) {
		bytes += ' bytes';
	} else if (bytes == 1) {
		return `${bytes} byte`;
	} else {
		return '0 bytes';
	}

	return bytes;
};

export const extractFilesize = (bytes = 0) => getFilesizeFromBytes(Buffer.byteLength(bytes));

export const closestNumberFromArray = (number, array = []) => {
	if (typeof number !== 'number') {
		Number(number);
	}

	return array.reduce((previous, current) => (Math.abs(current - number) < Math.abs(previous - number) ? current : previous));
};

export const getTimeSince = (dates) => {
	const time = Date.now() - dates;
	const dateString = ms(time);

	return (
		(dateString.days ? `${dateString.days} day${dateString.days > 1 ? 's' : ''} ` : '') +
		(dateString.hours ? `${dateString.hours} hour${dateString.hours > 1 ? 's' : ''} ` : '') +
		(dateString.minutes ? `${dateString.minutes} minute${dateString.minutes > 1 ? 's' : ''} ` : '') +
		(dateString.seconds ? `${dateString.seconds} second${dateString.seconds > 1 ? 's' : ''} ` : '')
	);
};

export const getRuntime = (time) => {
	const uptime = time;
	const date = new Date(uptime * 1000);

	return (
		(date.getUTCFullYear() - 1 > 0 ? `${date.getUTCFullYear() - 1} year${date.getUTCFullYear() - 1 > 1 ? 's' : ''} ` : '') +
		(date.getUTCMonth() - 1 > 0 ? `${date.getUTCMonth() - 1} month${date.getUTCMonth() - 1 > 1 ? 's' : ''} ` : '') +
		(date.getUTCDate() - 1 > 0 ? `${date.getUTCDate() - 1} day${date.getUTCDate() - 1 > 1 ? 's' : ''} ` : '') +
		(date.getUTCHours() > 0 ? `${date.getUTCHours()} hour${date.getUTCHours() > 1 ? 's' : ''} ` : '') +
		(date.getUTCMinutes() > 0 ? `${date.getUTCMinutes()} minute${date.getUTCMinutes() > 1 ? 's' : ''} ` : '') +
		(date.getUTCSeconds() > 0 ? `${date.getUTCSeconds()} second${date.getUTCSeconds() > 1 ? 's' : ''} ` : '')
	);
};

export const generateHex = (length) =>
	[...Array(length)]
		.map(() => Math.floor(Math.random() * 16).toString(16))
		.join('')
		.toUpperCase();

export const speedText = (speed) => {
	let bits = speed * 8;
	const units = ['', 'K', 'M', 'G', 'T'];
	const places = [0, 1, 2, 3, 3];
	let unit = 0;

	while (bits >= 2000 && unit < 4) {
		unit++;
		bits /= 1000;
	}

	return `${bits.toFixed(places[unit])} ${units[unit]}bps`;
};

export const randomNumber = (max) => ~~(Math.random() * max);

const chars = () => {
	const char = {
		up: [
			'̍',
			'̎',
			'̄',
			'̅',
			'̿',
			'̑',
			'̆',
			'̐',
			'͒',
			'͗',
			'͑',
			'̇',
			'̈',
			'̊',
			'͂',
			'̓',
			'̈́',
			'͊',
			'͋',
			'͌',
			'̃',
			'̂',
			'̌',
			'͐',
			'̀',
			'́',
			'̋',
			'̏',
			'̒',
			'̓',
			'̔',
			'̽',
			'̉',
			'ͣ',
			'ͤ',
			'ͥ',
			'ͦ',
			'ͧ',
			'ͨ',
			'ͩ',
			'ͪ',
			'ͫ',
			'ͬ',
			'ͭ',
			'ͮ',
			'ͯ',
			'̾',
			'͛',
			'͆',
			'̚',
		],
		middle: ['̕', '̛', '̀', '́', '͘', '̡', '̢', '̧', '̨', '̴', '̵', '̶', '͏', '͜', '͝', '͞', '͟', '͠', '͢', '̸', '̷', '͡', '҉'],
		down: [
			'̖',
			'̗',
			'̘',
			'̙',
			'̜',
			'̝',
			'̞',
			'̟',
			'̠',
			'̤',
			'̥',
			'̦',
			'̩',
			'̪',
			'̫',
			'̬',
			'̭',
			'̮',
			'̯',
			'̰',
			'̱',
			'̲',
			'̳',
			'̹',
			'̺',
			'̻',
			'̼',
			'ͅ',
			'͇',
			'͈',
			'͉',
			'͍',
			'͎',
			'͓',
			'͔',
			'͕',
			'͖',
			'͙',
			'͚',
			'̣',
		],
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
		if (chars().pattern.test(text[i])) {
			continue;
		}

		if (text[i].length > 1) {
			result += text[i];
			continue;
		}

		counts = {
			up: 0,
			middle: 0,
			down: 0,
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
			const tchars = chars()[type];
			const max = tchars.length - 1;

			while (count--) {
				result += tchars[randomNumber(max)];
			}
		}
	}

	return result;
};

export const extractZalgo = (text) => text.replace(chars().pattern, '');

export const convertToOrdinal = (number) => {
	const ordinal = ['th', 'st', 'nd', 'rd'];
	const Metta = number % 100;

	return number + (ordinal[(Metta - 20) % 10] || ordinal[Metta] || ordinal[0]);
};

export const loadFiles = (dir) => {
	let files = [];
	const list = fs.readdirSync(dir);

	for (const file of list) {
		const path = `${dir}/${file}`;
		const stat = fs.statSync(path);

		if (stat?.isDirectory()) {
			files = files.concat(loadFiles(path));
		} else {
			files.push(path);
		}
	}

	return files;
};

export const isZilgoo = (str) => str.match(/\u{1F1E6}/g);

export const isSame = (value1, value2) => value1 == value2;

export const isUndefined = (value) => value == undefined;

export const isNotUndefined = (value) => value != undefined;

export const isNotZero = (value) => value != 0;

export const isNotSame = (value1, value2) => value1 != value2;

export const isNotMinusOne = (value) => value != -1;

export const isNotNull = (value) => value != null;

export const isNull = (value) => value == null;

export const isZero = (value) => value == 0;

export const isEmpty = (value) => value == '';

export const isNotEmpty = (value) => value != '';

export const isMinusOne = (value) => value == -1;

export const isOne = (value) => value == 1;

export const isNotOne = (value) => value != 1;

export const isBigger = (value1, value2) =>
	typeof value1 == 'string' ? value1.toNumber() > value2.toNumber() : typeof value1 == 'number' ? value1 > value2 : false;

export const isSmaller = (value1, value2) =>
	typeof value1 == 'string' ? value1.toNumber() < value2.toNumber() : typeof value1 == 'number' ? value1 < value2 : false;

export const isSameOrBigger = (value1, value2) =>
	typeof value1 == 'string' ? value1.toNumber() >= value2.toNumber() : typeof value1 == 'number' ? value1 >= value2 : false;

export const isSameOrSmaller = (value1, value2) =>
	typeof value1 == 'string' ? value1.toNumber() <= value2.toNumber() : typeof value1 == 'number' ? value1 <= value2 : false;

export const randomize = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const readJSON = (path) => JSON.parse(fs.readFileSync(path));

export const readBuffer = (path) => fs.readFileSync(path);

export const writeJSON = (path, data) => {
	if (isUndefined(data)) {
		throw new Error('you need the data to write!');
	}

	return fs.writeFileSync(path, JSON.stringify(data, undefined, 2));
};

export const writeBuffer = (path, data) => {
	if (isUndefined(data)) {
		throw new Error('you need the buffer to write!');
	} else if (!Buffer.isBuffer(data)) {
		throw new Error('the data is invalid. please input only buffer!');
	}

	fs.writeFileSync(path, data);
	return true;
};

export const getFunctions = (module) => {
	Object.keys(module).filter((key) => {
		typeof module[key] == 'function';
	});
};

export const unlinkFile = (path) => {
	if (fs.existsSync(path)) {
		fs.unlinkSync(path);
		return true;
	}
};

export const isFileExist = (path) => fs.existsSync(path);

export const delaySync = (ms) => {
	const start = new Date();

	while (new Date() - start <= ms) {
		false;
	}
};

export const delay = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const makeDir = (path) => {
	fs.mkdirSync(path, { recursive: true });
	return true;
};

export const readDir = (path) => fs.readdirSync(path);

export const color = (text, color) => {
	const schemes = ['teen', 'passion', 'instagram'][Math.floor(Math.random() * 3)];

	return configuration.OPTIONS.rainbow
		? gradient['rainbow'](text)
		: typeof color == 'object'
		? gradient(...color)(text)
		: typeof color == 'string'
		? gradient(color, color)(text)
		: gradient[schemes](text);
};

export const INFOLOG = (...info) => {
	const isLOGS = configuration.OPTIONS.noLog || false;

	if (!isLOGS) {
		log(...info);
	}
};

export const ERRLOG = (...info) => {
	const isLOGS = configuration.OPTIONS.noLog || false;

	if (!isLOGS) {
		console.error(...info);
	}
};

export const isURL = (input) =>
	/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi.test(input);

export const parseCode = (input) => {
	const parse = input.match(/([-_0-9a-zA-Z]{11})/);

	return parse == null ? false : parse[0];
};

const convertToRoman = (num) => {
	const lookup = {
		M̄: 1_000_000,
		D̄: 500_000,
		C̄: 100_000,
		L̄: 50_000,
		X̄: 10_000,
		V̄: 5000,
		Ī: 1000,
		M: 1000,
		CM: 900,
		D: 500,
		CD: 400,
		C: 100,
		XC: 90,
		L: 50,
		XL: 40,
		X: 10,
		IX: 9,
		V: 5,
		IV: 4,
		I: 1,
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

export const getSeconds = (dates) => {
	const time = Date.now() - dates;
	const dateString = ms(time);

	return dateString.seconds;
};

export const getAverage = (nums) => (nums.reduce((a, b) => a + b) / nums.length).toFixed(2);

export const isFilePath = (file) => /^(?:[a-z]:\\|\/|\.)/i.test(file);

export const uploadToTelegraph = async (file) => {
	try {
		const tempFile = file;

		if (Buffer.isBuffer(file)) {
			file = file.toString('base64');
		} else if (isFilePath(file)) {
			file = Buffer.from(fs.readFileSync(file), 'base64');
			unlinkFile(tempFile);
		} else if (typeof file === 'string') {
			file = Buffer.from(file, 'base64');
		}

		let { ext } = await fileTypeFromBuffer(file);
		const form = new FormData();

		form.append('file', file, `file.${ext}`);
		const { data } = await axios.post('https://telegra.ph/upload', form, { headers: form.getHeaders() });

		return `https://telegra.ph${data[0].src}`;
	} catch (error) {
		log(error);
	}
};

export const formatViews = (s) => {
	const reg = /[A-Z]/g;
	const MULTIPLIER = {
		K: 1000,
		M: 1_000_000,
		B: 1_000_000_000,
		T: 1_000_000_000,
	};
	const matrix = s.split('').findIndex((v) => Object.keys(MULTIPLIER).includes(v));

	if (matrix == -1) {
		return Number(s);
	}

	return Number(s.replace(reg, '')) * MULTIPLIER[s[matrix]];
};

export const convertSecondstoTime = (ms) => {
	if (ms < 0) {
		ms = -ms;
	}

	const time = {
		day: Math.floor(ms / 86400000),
		hour: Math.floor(ms / 3600000) % 24,
		minute: Math.floor(ms / 60000) % 60,
		second: Math.floor(ms / 1000) % 60,
		millisecond: Math.floor(ms) % 1000,
	};

	return Object.entries(time)
		.filter((val) => val[1] !== 0)
		.map((val) => val[1])
		.join(':');
};
