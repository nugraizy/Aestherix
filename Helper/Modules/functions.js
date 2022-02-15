import ms from "parse-ms";
import request from "request";
import fs from "fs";
import gradient from "gradient-string";

const isLOGS = OPTIONS.noLog || false;

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

export const capitalizeFirstLetter = (string = "") =>
	string
		.toLowerCase()
		.split(" ")
		.map((str) => str.charAt(0).toUpperCase() + str.slice(1));

export const print = (code = {}) => {
	if (typeof code == "string") code = JSON.parse(code);
	return JSON.stringify(code, null, "\t");
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

	function isChar(character) {
		let bool = false;
		all.filter(function (i) {
			bool = i === character;
		});
		return bool;
	}
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

function convertToOrdinal(number) {
	const ordinal = ["th", "st", "nd", "rd"];
	const Metta = number % 100;
	return number + (ordinal[(Metta - 20) % 10] || ordinal[Metta] || ordinal[0]);
}

// make a function to load every each of the files from local files directory
function loadFiles(dir) {
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
}

// make a function to check if the string contains zilgoo unicode
export function isZilgoo(str) {
	return str.match(/\u{1F1E6}/g);
}

// make a function to regex number from a string then return every number on it joined with nothing
export function regexNumber(str) {
	return str.match(/\d+/g).length !== 0 ? str.match(/\d+/g).join("") : str;
}

// make a function to regex only a alphabet unicode then return every alphabet joined with nothing
export function regexAlphabet(str) {
	return str.match(/[a-zA-Z]+/g).length !== 0 ? str.match(/[a-zA-Z]+/g).join("") : str;
}

// check if one value is the same to the other
export function isSame(value1, value2) {
	return value1 == value2;
}

// check if the value is undefined
export function isUndefined(value) {
	return value == undefined;
}

// check if the value is not undefined
export function isNotUndefined(value) {
	return value != undefined;
}

// check if the value is not zero
export function isNotZero(value) {
	return value != 0;
}

// check if one value is not the same to the other
export function isNotSame(value1, value2) {
	return value1 != value2;
}

// check if the value is not -1
export function isNotMinusOne(value) {
	return value != -1;
}

// check value is not null
export function isNotNull(value) {
	return value != null;
}

// check if value is null
export function isNull(value) {
	return value == null;
}

// check value is zero
export function isZero(value) {
	return value == 0;
}

// check if value is empty
export function isEmpty(value) {
	return value == "";
}

// check if value is not empty
export function isNotEmpty(value) {
	return value != "";
}

// check if value is minus 1
export function isMinusOne(value) {
	return value == -1;
}

// check if value is one
export function isOne(value) {
	return value == 1;
}

// check if value is not one
export function isNotOne(value) {
	return value != 1;
}

// check if number bigger than other number.
// if the arguments are string then convert to number.
// if it's not a string nor number return false.
export function isBigger(value1, value2) {
	return typeof value1 == "string" ? value1.toNumber() > value2.toNumber() : typeof value1 == "number" ? value1 > value2 : false;
}

// check if number smaller than other number.
// if the arguments are string then convert to number.
// if it's not a string nor number return false.
export function isSmaller(value1, value2) {
	return typeof value1 == "string" ? value1.toNumber() < value2.toNumber() : typeof value1 == "number" ? value1 < value2 : false;
}

// check if number is same or bigger than other number.
// if the arguments are string then convert to number.
// if it's not a string nor number return false.
export function isSameOrBigger(value1, value2) {
	return typeof value1 == "string" ? value1.toNumber() >= value2.toNumber() : typeof value1 == "number" ? value1 >= value2 : false;
}

// check if numbe is same or smaller than other number.
// if the arguments are string then convert to number.
// if it's not a string nor number return false.
export function isSameOrSmaller(value1, value2) {
	return typeof value1 == "string" ? value1.toNumber() <= value2.toNumber() : typeof value1 == "number" ? value1 <= value2 : false;
}

// randomize an array and take only one value.
export function randomize(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

// read json file using fs
export function readJSON(path) {
	return JSON.parse(fs.readFileSync(path));
}

// read file buffer using fs
export function readBuffer(path) {
	return fs.readFileSync(path);
}

// write json file using fs. check the data using isUndefined function then throw new error saying "you need the data to write!"
export function writeJSON(path, data) {
	if (isUndefined(data)) {
		throw new Error("you need the data to write!");
	}
	fs.writeFileSync(path, JSON.stringify(data, undefined, 2));
	return true;
}

// write buffer to file using fs. If the data is undefined then throw new error saying "you need the buffer to write!"
export function writeBuffer(path, data) {
	if (isUndefined(data)) {
		throw new Error("you need the buffer to write!");
	} // and if the data is not a buffer throw new error saying "the data is invalid. please input only buffer!"
	else if (!Buffer.isBuffer(data)) {
		throw new Error("the data is invalid. please input only buffer!");
	}
	fs.writeFileSync(path, data);
	return true;
}

// get every function in baileys module
export function getFunctions(module) {
	return Object.keys(module).filter(function (key) {
		return typeof module[key] == "function";
	});
}

// check if the file exists then unlink it.
export function unlinkFile(path) {
	if (fs.existsSync(path)) {
		fs.unlinkSync(path);
		return true;
	}
}

// check if the file is exists with the name isFileExist
export function isFileExist(path) {
	return fs.existsSync(path);
}

export function delaySync(ms) {
	const start = new Date();
	while (new Date() - start <= ms) {}
}

export function makeDir(path) {
	fs.mkdirSync(path, { recursive: true });
	return true;
}

export function readDir(path) {
	return fs.readdirSync(path);
}

export const color = (text, color) => {
	const schemes = ["teen", "passion", "instagram"][Math.floor(Math.random() * 3)];
	return OPTIONS.rainbow ? gradient["rainbow"](text) : typeof color == "object" ? gradient(...color)(text) : typeof color == "string" ? gradient(color, color)(text) : gradient[schemes](text);
};

export function INFOLOG(...info) {
	if (!isLOGS) {
		console.log(...info);
	}
}

export function ERRLOG(...info) {
	if (!isLOGS) {
		console.error(...info);
	}
}

export function isURL(input) {
	return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi.test(input);
}

export function parseCode(input) {
	const parse = input.match(/([-_0-9a-zA-Z]{11})/);
	return parse == null ? false : parse[0];
}
