import axios from 'axios';
import chalk from 'chalk';
import { load } from 'cheerio';
import dayjs from 'dayjs';
import { fileTypeFromBuffer } from 'file-type';
import FormData from 'form-data';
import fs from 'fs-extra';
import isBuffer from 'is-buffer';
import _ from 'lodash';
import ms from 'parse-ms';
import progress from 'progress-stream';
import { Client, fetch, FormData as FormDataUndici } from 'undici';

import configuration from '../../helper/config/connect.js';
import { color } from './color.js';

export { color };

/**
 * Fetches texts
 * @param {string} url
 * @param {RequestInit} options node-fetch options
 * @returns {Promise<string>}
 */
export const fetchTEXT = async (url, options) => {
	const response = await fetch(url, options);

	if (!response.ok) {
		throw new Error(response.status);
	}

	const text = await response.text();

	return text;
};

/**
 * Fetches objects
 * @param {string} url
 * @param {RequestInit} options node-fetch options
 * @returns {Promise<object>}
 */
export const fetchJSON = async (url, options) => {
	const response = await fetch(url, options);

	if (!response.ok) {
		throw new Error(response.status);
	}

	const json = await response.json();

	return json;
};

/**
 * Fetches buffers
 * @param {string} url
 * @param {RequestInit} options node-fetch options
 * @returns {Promise<ArrayBuffer>}
 */
export const fetchBUFFER = async (url, options) => {
	const response = await fetch(url, options);

	if (!response.ok) {
		throw new Error(response.status);
	}

	const buffer = await response.arrayBuffer();

	return new Buffer.from(buffer);
};

/**
 * Fetches responses headers
 * @param {string} url
 * @param {RequestInit} options node-fetch options
 * @returns {Promise<import('undici').Response['headers']>}
 */
export const fetchHEADERS = async (url, options) => {
	const response = await fetch(url, options);

	if (!response.ok) {
		throw new Error(response.status);
	}

	const { headers } = response;

	return headers;
};

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
	if (Number.isNaN(bytes)) {
		throw new Error('Not a Number');
	}

	if (Number(bytes) === 0) {
		return '0 B';
	}

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
	const start = Date.now();

	while (Date.now() - start <= ms) {}
};

export const delay = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isFormat = false;
const isFormatISO = false;
const TIME_FORMAT_DEFAULT = 'ddd, DD MMM YYYY HH:mm:ss [GMT]Z';
const TIME_FORMAT = 'HH:mm:ss DD/MM';
const ICON = color('ᛟ', '#E4C1F9');
const SEPERATOR_1 = color(':', '#6272A4');
const SEPERATOR_2 = color('/', '#6272A4');
const SEPERATOR_3 = color(' 一', '#50FA7B');

export const boldify = (string) => chalk.bold(string);

const coloring = (text, format, err) => {
	if (!format) {
		return color(text, err ? '#FF5555' : '#E4C1F9');
	}

	const [time, date] = text.split(' ');

	const [hour, minute, second] = time.split(':');
	const [day, month] = date.split('/');
	const [HH, mm, ss, DD, MM] = [hour, minute, second, day, month].map((x) => color(x, err ? '#FF5555' : '#E4C1F9'));

	return `${HH}${SEPERATOR_1}${mm}${SEPERATOR_1}${ss} ${DD}${SEPERATOR_2}${MM}`;
};

const INFOLOG = (...info) => {
	const isLOGS = configuration.OPTIONS.noLog || false;

	if (!isLOGS) {
		const time = isFormat
			? dayjs.tz().format(TIME_FORMAT)
			: isFormatISO
				? dayjs.tz().utc(true).toISOString()
				: dayjs.tz().format(TIME_FORMAT_DEFAULT);

		const str = `${ICON} ${coloring(time, isFormat)}${SEPERATOR_3} ${info.join(' ')}`;

		return str;
	}
};

const loggersFns = (type, hexColor, ...info) => {
	const ignoreIndex = info.findIndex((v) => v?.ignore);

	if (ignoreIndex !== -1) {
		info.splice(ignoreIndex, 1);
		const str = `${color('[', 'gray')}${boldify(color(type, hexColor))}${color(']', 'gray')} ${INFOLOG(...info)}`;

		return str;
	}

	const str = `${color('[', 'gray')}${boldify(color(type, hexColor))}${color(']', 'gray')} ${INFOLOG(...info)}`;

	log(str);
};

export const loggers = {
	warning: (...info) => loggersFns('WRN', '#F1FA8C', ...info),
	info: (...info) => loggersFns('INF', '#50FA7B', ...info),
	error: (...info) => loggersFns('ERR', '#FF5555', ...info)
};

export const isURL = (input) => /^(https?:\/\/)([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(:[0-9]{2,5})?(\/\S*)?$/i.test(input);

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

		if (isBuffer(file)) {
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

export const formatBytes = (bytes, base = 1024, decimals = 2) => {
	if (!bytes) {
		return '0 B';
	}

	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(base));
	const value = (bytes / Math.pow(base, i)).toFixed(decimals);

	return `${value} ${sizes[i]}`;
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

export const veryUnique = (minimum, maximum) => {
	let usedValues = [];

	return function random() {
		if (usedValues.length === maximum - minimum + 1) {
			return null;
		}

		let number;

		do {
			number = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
		} while (usedValues.includes(number));

		usedValues.push(number);
		return number;
	};
};

export const increment = (minimum, maximum) => {
	let currentValue = minimum;

	return function () {
		if (currentValue <= maximum) {
			const result = currentValue;

			currentValue++;
			return result;
		} else {
			return null;
		}
	};
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

	const centeredStr = ' '.repeat(paddingLeft) + text + ' '.repeat(paddingRight);

	return centeredStr;
};

export const wrapText = (text, { limit = 0, length = 0, center = false }) => {
	if (center) {
		return wrapCenter(text, { limit, length });
	}

	text = text.slice(0, limit);

	text += ' '.repeat(length - text.length);

	return text;
};

const apiEndpoints = {
	uguu: 'https://uguu.se/upload.php',
	catbox: 'https://catbox.moe/user/api.php'
};

export class Uploader {
	constructor(media) {
		this._file = media;

		/**
		 * @returns {Promise<{filename: string, filesize: string, expired: '6 hours', url: string}>}
		 */
		this.uguu = async () => {
			const form = new FormDataUndici();
			let { success, message, ext } = await this.validateFile();

			if (!success) {
				throw new Error(message);
			}

			if (isURL(this._file)) {
				this._file = await this.fetchFileFromURL(this._file);
				const result = await this.validateFile();

				ext = result.ext;
			}

			const file = this.newFile(ext);

			form.set('files[]', file);

			const response = await fetch(apiEndpoints.uguu, { body: form, method: 'POST' });
			const data = await response.json();

			if (!data.success) {
				throw new Error(data.description);
			}

			const { filename, url, size } = data.files[0];

			return {
				filename,
				size: getFilesizeFromBytes(size),
				expired: '6 hours',
				url
			};
		};

		/**
		 * @returns {Promise<{filename: string, filesize: string, expired: 'no expire', url: string}>}
		 */
		this.catbox = async () => {
			const form = new FormDataUndici();
			let { success, message, ext } = await this.validateFile();

			if (!success) {
				throw new Error(message);
			}

			if (isURL(this._file)) {
				this._file = await this.fetchFileFromURL(this._file);
				const result = await this.validateFile();

				ext = result.ext;
			}

			const file = this.newFile(ext);

			form.set('fileToUpload', file);
			form.set('reqtype', 'fileupload');
			form.set('userhash', '');

			const response = await fetch(apiEndpoints.catbox, { body: form, method: 'POST' });
			const data = await response.text();

			if (data.includes('error')) {
				throw new Error(data);
			}

			const url = data;

			return {
				filename: new URL(url).pathname.replace('/', ''),
				filesize: extractFilesize(this._file),
				expired: 'no expire',
				url
			};
		};
	}

	/**
	 * @private
	 * @returns {Promise<{success: boolean, ext: string | null, message: string | undefined}>}
	 */
	async validateFile() {
		if (isBuffer(this._file)) {
			const types = await fileTypeFromBuffer(this._file);

			if (!types) {
				return { success: false, message: 'Files is not being recognised by the library.', ext: null };
			}

			return { success: true, ext: types.ext };
		} else if (!isURL(this._file)) {
			return { success: false, message: 'Could not process input.', ext: null };
		}

		return { success: true, ext: null };
	}

	/**
	 * @private
	 * @param {string} ext
	 * @returns {File}
	 */
	newFile(ext) {
		return new File([this._file], `file.${ext}`);
	}

	/**
	 * @private
	 * @param {string} url
	 * @returns {Promise<Buffer>}
	 */
	async fetchFileFromURL(url) {
		const response = await fetch(url, {
			headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }
		});

		const buffer = await response.arrayBuffer();

		return Buffer.from(buffer);
	}
}

export class Timer {
	#startTime = null;
	#endTime = null;
	#format;

	constructor(format = '${ms} ms') {
		this.#format = format;
	}

	start() {
		this.#startTime = process.hrtime.bigint();
		this.#endTime = null;
	}

	stop() {
		if (!this.#startTime) throw new Error('Timer has not been started.');
		this.#endTime = process.hrtime.bigint();
	}

	reset() {
		this.#startTime = null;
		this.#endTime = null;
	}

	elapsed() {
		if (!this.#startTime) return 0n;
		const end = this.#endTime ?? process.hrtime.bigint();
		return Number(end - this.#startTime) / 1e6; // milliseconds
	}

	formatted() {
		const ms = this.elapsed();
		const s = ms / 1000;
		const m = Math.floor(s / 60);
		const remainingS = s % 60;

		return this.#format
			.replace('${ms}', ms.toFixed(2))
			.replace('${s}', s.toFixed(2))
			.replace('${m}', m.toString())
			.replace('${sec}', remainingS.toFixed(2));
	}

	toString() {
		return this.formatted();
	}
}
