import axios from 'axios';
import { load } from 'cheerio';
import { fileTypeFromBuffer } from 'file-type';
import FormData from 'form-data';
import fs from 'fs-extra';
import gradient from 'gradient-string';
import { fetch, Client } from 'undici';
import ms from 'parse-ms';
import _ from 'lodash';
import dayjs from 'dayjs';
import chalk from 'chalk';
import progress from 'progress-stream';

import configuration from '../../helper/config/connect.js';

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
 * @returns {Promise<ArrayBuffer>}
 */
export const fetchBUFFER = async (url, options) => await (await fetch(url, options)).arrayBuffer();

/**
 * Fetches responses headers
 * @param {string} url
 * @param {RequestInit} options node-fetch options
 * @returns {Promise<import('undici').Response['headers']>}
 */
export const fetchHEADERS = async (url, options) => (await fetch(url, options)).headers;

/**
 * Load HTML using cheerio
 * @param {string} html
 * @returns {import('cheerio').CheerioAPI}
 */
export const cheerioLOAD = (html) => load(html);

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
				responseType: 'arraybuffer'
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

export const shuffleArray = (array = []) => _.shuffle(array);

export const randomize = (array = []) => _.sample(array);

export const removeDuplicatesArray = (array = []) => _.sortedUniq(array);

export const reverseWord = (string = '') => string.split('').reverse().join('');

export const reverseArray = (array = []) => array.reverse();

export const randomCase = (string = '') =>
	string.replace(/[A-Za-z]/gi, (str) => {
		const random = _.random(0, 2);

		return random === 1 ? str.toUpperCase() : str.toLowerCase();
	});

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
	const size = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	const factor = Math.floor((String(bytes).length - 1) / 3);

	bytes = bytes / Math.pow(1024, factor);
	bytes = Math.floor(bytes * Math.pow(10, 2)) / Math.pow(10, 2);

	return String(bytes) + size[factor];
};

export const parseHumanReadableToBytes = (s) => {
	s = String(s);

	const units = ['bytes', 'kb', 'mb', 'gb', 'tb'];
	const POWER_BASE = 1024;
	const data = {};

	data.numericPart = s.replace(/[^\d.]+/gim, '');
	data.unitPart = s
		.replace(/[^a-z]+/gim, '')
		.trim()
		.toLowerCase();
	data.index = -1 !== units.indexOf(data.unitPart) ? units.indexOf(data.unitPart) : 0;
	data.unit = units[data.index];
	data.factor = Math.pow(POWER_BASE, data.index);
	data.valueBytes = Math.trunc(Number(data.numericPart) * data.factor);

	return data.valueBytes;
};

export const getFilesize = (filename) => {
	const stats = fs.statSync(filename);
	let bytes = stats.size;

	return getFilesizeFromBytes(bytes);
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
	const date = new Date(time * 1000);
	const dates = {
		year: date.getUTCFullYear(),
		month: date.getUTCMonth(),
		day: date.getUTCDate(),
		hour: date.getUTCHours(),
		minute: date.getUTCMinutes(),
		second: date.getUTCSeconds()
	};

	return (
		(dates.month - 1 > 0 ? `${dates.month - 1} month${dates.month - 1 > 1 ? 's' : ''} ` : '') +
		(dates.day - 1 > 0 ? `${dates.day - 1} day${dates.day - 1 > 1 ? 's' : ''} ` : '') +
		(dates.hour > 0 ? `${dates.hour} hour${dates.hour > 1 ? 's' : ''} ` : '') +
		(dates.minute > 0 ? `${dates.minute} minute${dates.minute > 1 ? 's' : ''} ` : '') +
		(dates.second > 0 ? `${dates.second} second${dates.second > 1 ? 's' : ''} ` : '')
	);
};

export const generateHex = (length) =>
	[...Array(length)]
		.map(() => _.random(0, 16).toString(16))
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

export const randomNumber = (max) => _.random(0, max);

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
			'̚'
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
			'̣'
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

export function loadFiles(dir) {
	const files = [];

	const walkDir = (curDir) => {
		const list = fs.readdirSync(curDir);

		for (const file of list) {
			const path = `${curDir}/${file}`;
			const stat = fs.statSync(path);

			if (stat?.isDirectory()) {
				walkDir(path);
			} else {
				files.push(path);
			}
		}
	};

	walkDir(dir);

	return files;
}

export const isZilgoo = (str) => str.match(/\u{1F1E6}/g);

export const getFunctions = (module) => {
	Object.keys(module).filter((key) => {
		typeof module[key] === 'function';
	});
};

export const delaySync = (ms) => {
	const start = new Date();

	while (new Date() - start <= ms) {
		false;
	}
};

export const delay = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const color = (text, color) => {
	const schemes = ['teen', 'passion', 'instagram'][_.random(0, 3)];

	return configuration.OPTIONS.rainbow
		? gradient['rainbow'](text)
		: typeof color === 'object'
		? gradient(...color)(text)
		: typeof color === 'string'
		? gradient(color, color)(text)
		: gradient[schemes](text);
};

const TIME_FORMAT = 'HH:mm:ss DD/MM';
const ICON = color('✦', '#ff71ce');
const SEPERATOR_1 = color(':', '#6272A4');
const SEPERATOR_2 = color('/', '#6272A4');
const SEPERATOR_3 = color('ᚚ', '#FF5555');
const bracketsify = (text) => color('【', '#F8F8F2') + text + color('】', '#F8F8F2');
const boldify = (string) => chalk.bold(string);

const coloring = (text, err) => {
	const [time, date] = text.split(' ');

	const [hour, minute, second] = time.split(':');
	const [day, month] = date.split('/');
	const [HH, mm, ss, DD, MM] = [hour, minute, second, day, month].map((x) => color(x, err ? '#FF5555' : '#ff71ce'));

	return `${HH}${SEPERATOR_1}${mm}${SEPERATOR_1}${ss} ${DD}${SEPERATOR_2}${MM}`;
};

export const INFOLOG = (...info) => {
	const isLOGS = configuration.OPTIONS.noLog || false;

	if (!isLOGS) {
		const time = dayjs().format(TIME_FORMAT);

		const isIgnorePrint = info.findIndex((v) => v?.ignore);

		if (isIgnorePrint !== -1) {
			info.splice(isIgnorePrint, 1);

			const str = ICON + boldify(bracketsify(coloring(time))) + SEPERATOR_3 + ' ' + info.join(' ');

			return str;
		}

		const str = ICON + boldify(bracketsify(coloring(time))) + SEPERATOR_3 + ' ' + info.join(' ');

		log(str);
	}
};

export const ERRLOG = (...info) => {
	const isLOGS = configuration.OPTIONS.noLog || false;

	if (!isLOGS) {
		const time = dayjs().format('HH:mm:ss DD/MM');

		log(color('✦', '#FF5555') + boldify(bracketsify(coloring(time, true))) + boldify(SEPERATOR_3), ...info);
	}
};

export const isURL = (input) =>
	/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi.test(input);

export const isYoutubeURL = (input) =>
	/(?:http(?:s|):\/\/|)(?:(?:www\.|)youtube(?:-nocookie|)\.com\/(?:shorts\/)?(?:watch\?.*(?:|&)v=|embed\/|v\/)|youtu\.be\/)?\/.+/.test(
		input
	);

export const parseCode = (input) => {
	const parse = input.match(/([-_0-9a-zA-Z]{11})/);

	return parse === null ? false : parse[0];
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
		I: 1
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
			await fs.unlink(tempFile);
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
		T: 1_000_000_000
	};
	const matrix = s.split('').findIndex((v) => Object.keys(MULTIPLIER).includes(v));

	if (matrix === -1) {
		return Number(s);
	}

	return Number(s.replace(reg, '')) * MULTIPLIER[s[matrix]];
};

export const formatNumber = (number) => {
	if (typeof number !== 'number') {
		throw new Error('Input must be a number');
	}

	if (number < 1000) {
		return String(number);
	}

	const units = ['K', 'M', 'B', 'T'];

	const unit = Math.floor((number.toFixed(0).length - 1) / 3) * 3;
	const value = (number / 10 ** unit).toFixed(1);

	return `${value}${units[unit / 3 - 1]}`;
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
		millisecond: Math.floor(ms) % 1000
	};

	return Object.entries(time)
		.filter((val) => val[1] !== 0)
		.map((val) => val[1])
		.join(':');
};

export const randomChar = (char, range) => {
	let chars = '';

	for (let i = 0; i < range; i++) {
		chars += char[Math.floor(Math.random() * char.length)];
	}

	return chars;
};

export class Fetch {
	constructor(origin, { delay = 0 } = {}) {
		this._origin = origin;
		this._client = new Client(this._origin);
		this._data = [];
		this._body = null;
		this._progress = null;
		this._delay = delay;
		this._delayLayer = Date.now();
		this._abortController = new AbortController();
	}

	async request(path, { method, config = {} }) {
		const { body, headers } = await this._client.request({
			path,
			method,
			...config
		});

		this._body = body;

		const str = progress({
			length: headers['content-length']
		});

		str.on('data', (data) => {
			this._data.push(data);
		});

		this._body.pipe(str);

		this._progress = str;

		this.headers = headers;

		return this;
	}

	on(event, cb) {
		if (event === 'progress') {
			let firstRun = true;

			this._progress.on(event, (data) => {
				if (data.percentage === 100) {
					cb(data);
					this._progress.emit('finish', true);
				}

				if (!firstRun && Date.now() - this._delayLayer >= this._delay) {
					cb(data);

					this._delayLayer = Date.now();
				} else if (firstRun) {
					cb(data);
					firstRun = false;
					this._delayLayer = Date.now();
				}
			});

			return this;
		}

		this._progress.on(event, (data) => {
			cb(data);
		});

		return this;
	}

	toBuffer() {
		return Buffer.concat(this._data);
	}

	cancel(message = '') {
		this._progress.emit('cancel', { cancelByUser: true });
		this._progress.removeAllListeners();
		return this._abortController.abort(message);
	}
}

export const unique = (minimum, maximum) => {
	let previousValue;

	return function random() {
		const number = Math.floor(Math.random() * (maximum - minimum + 1) + minimum);

		previousValue = number === previousValue && minimum !== maximum ? random() : number;

		return previousValue;
	};
};

/**
 *
 * @param {string} string
 * @param {{ length: number | 3, join: string | '-'}} param1
 * @returns
 */
export const splitString = (string, { length = 3, join = '-' } = {}) =>
	Array.from({ length: Math.ceil(string.length / length) }, (_, i) => string.substring(i * length, length)).join(join);
