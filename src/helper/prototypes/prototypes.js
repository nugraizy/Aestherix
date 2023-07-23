import _ from 'lodash';
import PhoneNumber from 'awesome-phonenumber';

import { S_WHATSAPP_NET } from '../misc/wa_data/constants.js';

Number.prototype.toTime = function () {
	const minutes = Math.floor(this / 60_000);
	const seconds = ((this % 60_000) / 1000).toFixed(0);

	return seconds === 60 ? `${minutes + 1}:00` : `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
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
	return args.some((v) => v === this);
};

String.prototype.mocking = function () {
	const replacing = ['4', '8', '3', '9', '1', '0', '5', '7', '2'];
	const container = [];

	this.replace(/[A-Za-z]/gi, (str) => {
		const random = _.random(0, 2);

		return random === 1 ? str.toUpperCase() : str.toLowerCase();
	})
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
						.replace(/Z/gi, replacing[8])
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

Array.prototype.parse = function () {
	return (
		_.sortedUniq(this)
			.filter((v) => PhoneNumber(`+${v.replace(/[A-Za-z-@\s+s.whatsapp.net]/g, '')}`).isValid())
			?.map((v) => `${v.replace(/[\s+-]/g, '')}${S_WHATSAPP_NET}`.trim()) || []
	);
};

Array.prototype.insert = function (index) {
	this.splice(...[index, 0].concat(Array.prototype.slice.call(arguments, 1)));
	return this;
};

Map.prototype.flushAll = function () {
	this.clear();
};
