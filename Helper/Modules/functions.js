import ms from "parse-ms";
import request from "request";
import fs from "fs";
import gradient from "gradient-string";
import beautifyJSON from "json-stable-stringify";

export const download = (url, path, callback) => {
	request.head(url, () => {
		request(url).pipe(fs.createWriteStream(path)).on("close", callback);
	});
};

export const clampFloat = (value) => (value > 1 ? 1 : value < -1 ? -1 : value);

export const distordFX = (value) => (value > 0 ? 1 : value < 0 ? -1 : 0);

export const clamp = (value, min, max) => Math.min(Math.max(min, value), max);

export const shuffleArray = (array = []) => {
	let curId = array.length;
	while (0 !== curId) {
		const randId = Math.floor(Math.random() * curId);
		curId -= 1;
		const tmp = array[curId];
		array[curId] = array[randId];
		array[randId] = tmp;
	}
	return array;
};

export const randomArray = (array = []) => array[Math.floor(Math.random() * array.length)];

export const removeDuplicatesArray = (array = []) => [...new Set(array)];

export const reverseWord = (string = "") => string.split("").reverse().join("");

export const reverseArray = (array = []) => array.reverse();

String.prototype.capitalize = function () {
	return this.toLowerCase()
		.split(" ")
		.map((str) => str.charAt(0).toUpperCase() + str.slice(1))
		.join(" ");
};

export const numberWithCommas = (number = 0, region = "id") => parseFloat(number).toLocaleString(region);

export const randomCase = (string = "") => {
	const container = [];
	string.split("").map((str) => {
		if (Math.floor(Math.random() * 2) + 1 == 1) container.push(str.toLowerCase());
		else container.push(str.toUpperCase());
	});
	return container.join("");
};

String.prototype.mocking = function () {
	const replacing = ["4", "8", "3", "9", "1", "0", "5", "7", "2"];
	const container = [];
	randomCase(this)
		.split("")
		.map((str) => {
			if (str === str.toUpperCase())
				container.push(str.replace(/A/gi, replacing[0]).replace(/B/gi, replacing[1]).replace(/E/gi, replacing[2]).replace(/G/gi, replacing[3]).replace(/I/gi, replacing[4]).replace(/O/gi, replacing[5]).replace(/S/gi, replacing[6]).replace(/T/gi, replacing[7]).replace(/Z/gi, replacing[8]));
			else container.push(str);
		});

	return container.join("");
};

export const identity = (string) => string;

export const wordWrapping = (string, options = {}) => {
	const width = options.width || 30;
	const indent = typeof options.indent === "string" ? options.indent : "";
	const newLine = options.newLine || `\n${indent}`;
	const escape = typeof options.escape === "function" ? options.escape : identity;
	const regex = `.{1,${width}}`;
	const newRegex = new RegExp(regex, "g");
	const line = string.match(newRegex) || [];
	const result =
		indent +
		line
			.map(function (lines) {
				if (lines.slice(-1) === "\n") {
					lines = lines.slice(0, lines.length - 1);
				}
				return escape(lines);
			})
			.join(newLine);
	if (options.trim === true) {
		return result.replace(/[ \t]*$/gm, "");
	}
	return result;
};

export const calcCrow = (lats1, lon1, lats2, lon2) => {
	const R = 6371;
	const dLat = () => lat2 - (lat1 * Math.PI) / 180;
	const dLon = () => lon2 - (lon1 * Math.PI) / 180;
	const lat1 = () => (lats1 * Math.PI) / 18_080;
	const lat2 = () => (lats2 * Math.PI) / 180;
	const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const d = R * c;
	return d;
};

export const getFilesizeFromBytes = (bytes = 0) => {
	if (bytes >= 1_073_741_824) {
		bytes = `${(bytes / 1_073_741_824).toFixed(2)} GB`;
	} else if (bytes >= 1_048_576) {
		bytes = `${(bytes / 1_048_576).toFixed(2)} MB`;
	} else if (bytes >= 1024) {
		bytes = `${(bytes / 1024).toFixed(2)} KB`;
	} else if (bytes > 1) {
		bytes += " bytes";
	} else if (bytes == 1) {
		return `${bytes} byte`;
	} else {
		return "0 bytes";
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
		bytes += " bytes";
	} else if (bytes == 1) {
		return `${bytes} byte`;
	} else {
		return "0 bytes";
	}
	return bytes;
};

export const extractFilesize = (bytes = 0) => getFilesizeFromBytes(Buffer.byteLength(bytes));

export const closestNumberFromArray = (number, array = []) => {
	if (typeof number !== "number") Number(number);
	return array.reduce((previous, current) => (Math.abs(current - number) < Math.abs(previous - number) ? current : previous));
};

export const getTimeSince = (dates) => {
	const time = Date.now() - dates;
	const dateString = ms(time);
	const base = [];
	if (dateString.days > 0) base.push(`${dateString.days} Hari`);
	if (dateString.hours > 0) base.push(`${dateString.hours} Jam`);
	if (dateString.minutes > 0) base.push(`${dateString.minutes} Menit`);
	if (dateString.seconds > 0) base.push(`${dateString.seconds} Detik`);
	return base.join(", ");
};

export const getRuntime = (time) => {
	const uptime = time;
	const date = new Date(uptime * 1000);
	const days = date.getUTCDate() - 1;
	const hours = date.getUTCHours();
	const minutes = date.getUTCMinutes();
	const seconds = date.getUTCSeconds();
	const milliseconds = date.getUTCMilliseconds();
	const segments = [];
	if (days > 0) segments.push(`${days} Hari`);
	if (hours > 0) segments.push(`${hours} Jam`);
	if (minutes > 0) segments.push(`${minutes} Menit`);
	if (seconds > 0) segments.push(`${seconds} Detik`);
	return segments.join(", ");
};

export const generateHex = (length) =>
	[...Array(length)]
		.map(() => Math.floor(Math.random() * 16).toString(16))
		.join("")
		.toUpperCase();

export const speedText = (speed) => {
	let bits = speed * 8;
	const units = ["", "K", "M", "G", "T"];
	const places = [0, 1, 2, 3, 3];
	let unit = 0;
	while (bits >= 2000 && unit < 4) {
		unit++;
		bits /= 1000;
	}

	return `${bits.toFixed(places[unit])} ${units[unit]}bps`;
};

export const randomNumber = (range) => {
	const n = Math.floor(Math.random() * range);
	return n;
};

export const zalgo = (text = "Mana textnya?", options) => {
	const char = {
		up: ["̍", "̎", "̄", "̅", "̿", "̑", "̆", "̐", "͒", "͗", "͑", "̇", "̈", "̊", "͂", "̓", "̈", "͊", "͋", "͌", "̃", "̂", "̌", "͐", "̀", "́", "̋", "̏", "̒", "̓", "̔", "̽", "̉", "ͣ", "ͤ", "ͥ", "ͦ", "ͧ", "ͨ", "ͩ", "ͪ", "ͫ", "ͬ", "ͭ", "ͮ", "ͯ", "̾", "͛", "͆", "̚"],
		down: ["̖", "̗", "̘", "̙", "̜", "̝", "̞", "̟", "̠", "̤", "̥", "̦", "̩", "̪", "̫", "̬", "̭", "̮", "̯", "̰", "̱", "̲", "̳", "̹", "̺", "̻", "̼", "ͅ", "͇", "͈", "͉", "͍", "͎", "͓", "͔", "͕", "͖", "͙", "͚", "̣"],
		mid: ["̕", "̛", "̀", "́", "͘", "̡", "̢", "̧", "̨", "̴", "̵", "̶", "͜", "͝", "͞", "͟", "͠", "͢", "̸", "̷", "͡", " ҉"],
	};
	const all = [].concat(char.up, char.down, char.mid);

	const isChar = (character) => {
		let bool = false;
		all.filter(function (i) {
			bool = i === character;
		});
		return bool;
	};
	let result = "";
	let counts;
	let l;
	options = options || {};
	options.up = typeof options.up !== "undefined" ? options.up : true;
	options.mid = typeof options.mid !== "undefined" ? options.mid : true;
	options["down"] = typeof options["down"] !== "undefined" ? options["down"] : true;
	options.size = typeof options.size !== "undefined" ? options.size : "maxi";
	text = text.split("");
	for (l in text) {
		if (isChar(l)) {
			continue;
		}
		result += text[l];
		counts = { up: 0, down: 0, mid: 0 };
		switch (options.size) {
			case "mini":
				counts.up = randomNumber(8);
				counts.mid = randomNumber(2);
				counts.down = randomNumber(8);
				break;
			case "maxi":
				counts.up = randomNumber(16) + 3;
				counts.mid = randomNumber(4) + 1;
				counts.down = randomNumber(64) + 3;
				break;
			default:
				counts.up = randomNumber(8) + 1;
				counts.mid = randomNumber(6) / 2;
				counts.down = randomNumber(8) + 1;
				break;
		}

		const arr = ["up", "mid", "down"];
		for (const d in arr) {
			const index = arr[d];
			for (let i = 0; i <= counts[index]; i++) {
				if (options[index]) {
					result += char[index][randomNumber(char[index].length)];
				}
			}
		}
	}
	return result;
};

const convertToOrdinal = (number) => {
	const ordinal = ["th", "st", "nd", "rd"];
	const Metta = number % 100;
	return number + (ordinal[(Metta - 20) % 10] || ordinal[Metta] || ordinal[0]);
};

// make a function to load every each of the files from local files directory
const loadFiles = (dir) => {
	let files = [];
	const list = fs.readdirSync(dir);
	for (const file of list) {
		const path = `${dir}/${file}`;
		const stat = fs.statSync(path);
		if (stat && stat.isDirectory()) {
			files = files.concat(loadFiles(path));
		} else {
			files.push(path);
		}
	}
	return files;
};

// make a function to check if the string contains zilgoo unicode
export const isZilgoo = (str) => str.match(/\u{1F1E6}/g);

// make a function to regex number from a string then return every number on it joined with nothing
export const regexNumber = (str) => (str.match(/\d+/g).length !== 0 ? str.match(/\d+/g).join("") : str);

// make a function to regex only a alphabet unicode then return every alphabet joined with nothing
export const regexAlphabet = (str) => (str.match(/[a-zA-Z]+/g).length !== 0 ? str.match(/[a-zA-Z]+/g).join("") : str);

// check if one value is the same to the other
export const isSame = (value1, value2) => value1 == value2;

// check if the value is undefined
export const isUndefined = (value) => value == undefined;

// check if the value is not undefined
export const isNotUndefined = (value) => value != undefined;

// check if the value is not zero
export const isNotZero = (value) => value != 0;

// check if one value is not the same to the other
export const isNotSame = (value1, value2) => value1 != value2;

// check if the value is not -1
export const isNotMinusOne = (value) => value != -1;

// check value is not null
export const isNotNull = (value) => value != null;

// check if value is null
export const isNull = (value) => value == null;

// check value is zero
export const isZero = (value) => value == 0;

// check if value is empty
export const isEmpty = (value) => value == "";

// check if value is not empty
export const isNotEmpty = (value) => value != "";

// check if value is minus 1
export const isMinusOne = (value) => value == -1;

// check if value is one
export const isOne = (value) => value == 1;

// check if value is not one
export const isNotOne = (value) => value != 1;

// check if number bigger than other number.
// if the arguments are string then convert to number.
// if it's not a string nor number return false.
export const isBigger = (value1, value2) => (typeof value1 == "string" ? value1.toNumber() > value2.toNumber() : typeof value1 == "number" ? value1 > value2 : false);

// check if number smaller than other number.
// if the arguments are string then convert to number.
// if it's not a string nor number return false.
export const isSmaller = (value1, value2) => (typeof value1 == "string" ? value1.toNumber() < value2.toNumber() : typeof value1 == "number" ? value1 < value2 : false);

// check if number is same or bigger than other number.
// if the arguments are string then convert to number.
// if it's not a string nor number return false.
export const isSameOrBigger = (value1, value2) => (typeof value1 == "string" ? value1.toNumber() >= value2.toNumber() : typeof value1 == "number" ? value1 >= value2 : false);

// check if numbe is same or smaller than other number.
// if the arguments are string then convert to number.
// if it's not a string nor number return false.
export const isSameOrSmaller = (value1, value2) => (typeof value1 == "string" ? value1.toNumber() <= value2.toNumber() : typeof value1 == "number" ? value1 <= value2 : false);

// randomize an array and take only one value.
export const randomize = (arr) => arr[Math.floor(Math.random() * arr.length)];

// read json file using fs
export const readJSON = (path) => JSON.parse(fs.readFileSync(path));

// read file buffer using fs
export const readBuffer = (path) => fs.readFileSync(path);

// write json file using fs. check the data using isUndefined function then throw new error saying "you need the data to write!"
export const writeJSON = (path, data) => {
	if (isUndefined(data)) {
		throw new Error("you need the data to write!");
	}
	return fs.writeFileSync(path, JSON.stringify(JSON.parse(beautifyJSON(data)), undefined, 2));
};

// write buffer to file using fs. If the data is undefined then throw new error saying "you need the buffer to write!"
export const writeBuffer = (path, data) => {
	if (isUndefined(data)) {
		throw new Error("you need the buffer to write!");
	} // and if the data is not a buffer throw new error saying "the data is invalid. please input only buffer!"
	else if (!Buffer.isBuffer(data)) {
		throw new Error("the data is invalid. please input only buffer!");
	}
	fs.writeFileSync(path, data);
	return true;
};

// get every function in baileys module
export const getFunctions = (module) => {
	Object.keys(module).filter((key) => {
		typeof module[key] == "function";
	});
};

// check if the file exists then unlink it.
export const unlinkFile = (path) => {
	if (fs.existsSync(path)) {
		fs.unlinkSync(path);
		return true;
	}
};

// check if the file is exists with the name isFileExist
export const isFileExist = (path) => fs.existsSync(path);

export const delaySync = (ms) => {
	const start = new Date();
	while (new Date() - start <= ms) {}
};

export const makeDir = (path) => {
	fs.mkdirSync(path, { recursive: true });
	return true;
};

export const readDir = (path) => fs.readdirSync(path);

export const color = (text, color) => {
	const schemes = ["teen", "passion", "instagram"][Math.floor(Math.random() * 3)];
	return OPTIONS.rainbow ? gradient["rainbow"](text) : typeof color == "object" ? gradient(...color)(text) : typeof color == "string" ? gradient(color, color)(text) : gradient[schemes](text);
};

export const INFOLOG = (...info) => {
	const isLOGS = OPTIONS.noLog || false;
	if (!isLOGS) {
		console.log(...info);
	}
};

export const ERRLOG = (...info) => {
	const isLOGS = OPTIONS.noLog || false;
	if (!isLOGS) {
		console.error(...info);
	}
};

export const isURL = (input) => /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi.test(input);

export const parseCode = (input) => {
	const parse = input.match(/([-_0-9a-zA-Z]{11})/);
	return parse == null ? false : parse[0];
};
