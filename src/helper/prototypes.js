import _ from 'lodash';
import { findPhoneNumbersInText } from 'libphonenumber-js';

import { S_WHATSAPP_NET } from './misc/wa_data/constants.js';

Object.setPrototypeOf(String.prototype, {
	...String.prototype,
	toTime: function () {
		const minutes = Math.floor(this / 60_000);
		const seconds = ((this % 60_000) / 1000).toFixed(0);

		return seconds === 60 ? `${minutes + 1}:00` : `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
	},
	toReadAble: function () {
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
	},
	seperateCamel: function () {
		return this.replace(/[A-Z]/g, (_) => ` ${_}`);
	},
	capitalize: function () {
		return this.toLowerCase()
			.split(' ')
			.map((str) => str.charAt(0).toUpperCase() + str.slice(1))
			.join(' ');
	},
	isExist: function (...args) {
		return args.some((v) => v === this);
	},
	mocking: function () {
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
	},
	formatHeaders: function () {
		return `╭ \`\`\`• ${this || 'This is Headers'}\`\`\` ╮`;
	},
	replaceLast: function (find, replace) {
		const index = this.lastIndexOf(find);

		if (index >= 0) {
			return this.substring(0, index) + replace + this.substring(index + find.length);
		}

		return this.toString();
	},
	replaceFirst: function (find, replace) {
		const index = this.indexOf(find);

		if (index >= 0) {
			return this.substring(0, index) + replace + this.substring(index + find.length);
		}

		return this.toString();
	},
	replaceAll: function (find, replace) {
		return this.replace(new RegExp(find, 'g'), replace);
	},
	parseNumber: function () {
		return _.sortedUniq(findPhoneNumbersInText(this).map((v) => v.number.number.replace('+', '') + S_WHATSAPP_NET));
	}
});

Object.setPrototypeOf(Array.prototype, {
	...Array.prototype,
	insert: function (index) {
		this.splice(...[index, 0].concat(Array.prototype.slice.call(arguments, 1)));
		return this;
	}
});

Object.setPrototypeOf(Number.prototype, {
	...Number.prototype,
	toTime: function () {
		const minutes = Math.floor(this / 60_000);
		const seconds = ((this % 60_000) / 1000).toFixed(0);

		return seconds === 60 ? `${minutes + 1}:00` : `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
	},
	toReadAble: function () {
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
	}
});
