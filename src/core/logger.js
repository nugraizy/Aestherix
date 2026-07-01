// @ts-check
import chalk from 'chalk';
import { highlight } from 'cli-highlight';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);
dayjs.extend(timezone);

import { color } from '../utils/modules/color.js';
import { pushDashboardLog } from '../../dashboard/server/monitor.js';
import { redact } from './env.js';

const TIME_FORMAT = 'HH:mm DD/MM';

/** @typedef {import('../types/Core/index.js').Logger} LoggerType */

/** @implements {LoggerType} */
export class Logger {
	#muted = false;
	#name;
	#sessionBadge = null;

	/** @type {import('./log-multiplexer.js').LogMultiplexer | null} */
	static multiplexer = null;

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

	setSessionBadge(badge) {
		this.#sessionBadge = badge ?? null;
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

		let errorStack = null;

		const formattedArgs = args.map((arg) => {
			const formatted = this.#formatErrorArg(arg);

			if (formatted === null) {
				return arg;
			}

			if (!errorStack && type === 'ERR' && typeof arg.stack === 'string') {
				errorStack = arg.stack;
			}

			return formatted;
		});

		const time = this.#formatTime();
		const badgePrefix = this.#sessionBadge
			? `${color('•', this.#badgeColor(this.#sessionBadge))} `
			: '';
		const prefix = this.#name
			? `${badgePrefix}${color('[', 'gray')}${chalk.bold(color(this.#name, this.#typeColor(type)))}${color(']', 'gray')} `
			: badgePrefix;
		const typeTag = `${color('[', 'gray')}${chalk.bold(color(type, this.#typeColor(type)))}${color(']', 'gray')}`;
		const separator = color(' •', this.#typeColor(type));
		const rawStr = `${prefix}${typeTag} ${time}${separator} ${formattedArgs.join(' ')}`;
		const str = /** @type {string} */ (redact(rawStr));

		if (ignoreIndex === -1) {
			pushDashboardLog(type, str);

			if (Logger.multiplexer) {
				const badge = this.#sessionBadge || 'MAIN';
				const stackStr = errorStack ? /** @type {string} */ (redact(this.#trimStack(errorStack))) : null;

				Logger.multiplexer.route(badge, type, str, stackStr);
			} else {
				console.log(str);

				if (errorStack) {
					const trimmed = this.#trimStack(errorStack);

					if (trimmed) {
						console.log(/** @type {string} */ (redact(trimmed)));
					}
				}
			}
		}

		return str;
	}

	#isErrorLike(arg) {
		if (arg instanceof Error) {
			return true;
		}

		return Boolean(arg && typeof arg === 'object' && typeof arg.message === 'string' && typeof arg.stack === 'string');
	}

	#formatErrorArg(arg) {
		if (!this.#isErrorLike(arg)) {
			return null;
		}

		const message = color(String(arg.message || arg), 'white');
		const location = this.#getErrorLocation(arg.stack);

		if (!location) {
			return message;
		}

		return `${message} ${color(`(${location.file}:${location.line})`, 'gray')}`;
	}

	#getErrorLocation(stack) {
		if (!stack || typeof stack !== 'string') {
			return null;
		}

		const lines = stack.split('\n');
		const framePattern = /\((?:file:\/\/)?(.+?):(\d+):(\d+)\)|at (?:file:\/\/)?(.+?):(\d+):(\d+)/;

		for (const line of lines) {
			if (!line.includes(' at ')) {
				continue;
			}

			if (line.includes('node:internal') || line.includes('internal/')) {
				continue;
			}

			const match = line.match(framePattern);

			if (!match) {
				continue;
			}

			const filePath = (match[1] || match[4] || '')
				.trim()
				.replace(/\\/g, '/')
				.replace(/[?#].*$/, '');
			const lineNumber = match[2] || match[5] || 'unknown';

			if (!filePath) {
				continue;
			}

			const srcIndex = filePath.lastIndexOf('/src/');
			const displayPath = srcIndex !== -1 ? filePath.slice(srcIndex + 1) : filePath.split('/').slice(-2).join('/');

			return { file: displayPath || filePath, line: lineNumber };
		}

		return null;
	}

	#trimStack(stack, max = 5) {
		if (!stack || typeof stack !== 'string') {
			return '';
		}

		const frames = stack
			.split('\n')
			.slice(1)
			.filter((line) => {
				const trimmed = line.trim();

				if (!trimmed.startsWith('at ')) {
					return false;
				}

				if (trimmed.includes('node:internal') || trimmed.includes('internal/')) {
					return false;
				}

				return true;
			})
			.slice(0, max)
			.map((line) => color(`  ${line.trim()}`, 'gray'));

		return frames.join('\n');
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

	/** @param {string} badge */
	#badgeColor(badge) {
		if (badge === 'MAIN') {
			return 'purple';
		}

		const palette = ['cyan', 'green', 'pink', 'salmon', 'amber', 'teal', 'mint', 'coral', 'lime', 'sky'];
		let hash = 0;

		for (const char of badge) {
			hash = ((hash << 5) - hash) + char.charCodeAt(0);
			hash |= 0;
		}

		return palette[Math.abs(hash) % palette.length];
	}
}
