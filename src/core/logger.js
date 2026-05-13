import chalk from 'chalk';
import { highlight } from 'cli-highlight';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);
dayjs.extend(timezone);

import { color } from '../utils/modules/color.js';
import { pushDashboardLog } from './dashboard/monitor.js';

const TIME_FORMAT = 'HH:mm DD/MM';

/** @implements {import('../types/Core/index.d.ts').Logger} */
export class Logger {
	#muted = false;
	#name;

	/** @param {{ name?: string; muted?: boolean }} [options] */
	constructor(options = {}) {
		this.#name = options.name ?? null;
		this.#muted = options.muted ?? false;
	}

	get name() {
		return this.#name;
	}

	get muted() {
		return this.#muted;
	}

	mute() {
		this.#muted = true;
	}

	unmute() {
		this.#muted = false;
	}

	color(text, colorName) {
		return color(text, colorName);
	}

	/**
	 * @param {...unknown} args
	 * @returns {string | undefined}
	 */
	info(...args) {
		return this.#log('INF', ...args);
	}

	/**
	 * @param {...unknown} args
	 * @returns {string | undefined}
	 */
	warning(...args) {
		return this.#log('WRN', ...args);
	}

	/**
	 * @param {...unknown} args
	 * @returns {string | undefined}
	 */
	error(...args) {
		return this.#log('ERR', ...args);
	}

	/**
	 * @param {...(string | { language?: string })} args
	 * @returns {string | undefined}
	 */
	prettyCode(...args) {
		const lastArg = args[args.length - 1];
		const hasOptions = lastArg && typeof lastArg === 'object' && !Buffer.isBuffer(lastArg) && !Array.isArray(lastArg);
		const options = hasOptions ? lastArg : {};
		const codes = hasOptions ? args.slice(0, -1) : args;

		const highlighted = codes
			.map((code) =>
				highlight(String(code ?? ''), { language: options.language, ignoreIllegals: true, theme: color.getSyntaxTheme() })
			)
			.join('\n');

		return this.#log('INF', `\n${highlighted}`);
	}

	json(...args) {
		let options = {};

		if (args.length && typeof args[args.length - 1] === 'object' && !Array.isArray(args[args.length - 1])) {
			options = args.pop();
		}

		const format = options.format === true;
		const pretty = options.pretty === true;

		const highlighted = args
			.map((obj) => {
				try {
					const json = format ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);

					return pretty
						? highlight(json, {
								language: options.language || 'json',
								ignoreIllegals: true,
								theme: color.getSyntaxTheme()
							})
						: json;
				} catch {
					return String(obj);
				}
			})
			.join('\n');

		return this.#log('INF', `\n${highlighted}`);
	}

	#log(type, ...args) {
		if (this.#muted) {
			return;
		}

		const ignoreIndex = args.findIndex((v) => v?.ignore);

		if (ignoreIndex !== -1) {
			args.splice(ignoreIndex, 1);
		}

		const time = this.#formatTime();
		const prefix = this.#name
			? `${color('[', 'gray')}${chalk.bold(color(this.#name, this.#typeColor(type)))}${color(']', 'gray')} `
			: '';
		const typeTag = `${color('[', 'gray')}${chalk.bold(color(type, this.#typeColor(type)))}${color(']', 'gray')}`;
		const separator = color(' •', this.#typeColor(type));
		const str = `${prefix}${typeTag} ${time}${separator} ${args.join(' ')}`;

		if (ignoreIndex === -1) {
			pushDashboardLog(type, str);
			console.log(str);
		}

		return str;
	}

	#formatTime() {
		const raw = dayjs.tz().format(TIME_FORMAT);
		const [time, date] = raw.split(' ');
		const [hour, minute] = time.split(':');
		const [day, month] = date.split('/');
		const sep1 = color(':', color.theme?.MUTE || '#6272A4');
		const sep2 = color('/', color.theme?.MUTE || '#6272A4');
		const c = color.theme?.MISC || '#E4C1F9';

		return `${color(hour, c)}${sep1}${color(minute, c)} ${color(day, c)}${sep2}${color(month, c)}`;
	}

	#typeColor(type) {
		const colors = {
			INF: color.theme?.INF || '#50FA7B',
			WRN: color.theme?.WRN || '#FFB86C',
			ERR: color.theme?.ERR || '#FF5555'
		};

		return colors[type] || colors.ERR;
	}
}
