// @ts-check
import chalk from 'chalk';
import chokidar from 'chokidar';
import { highlight } from 'cli-highlight';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { array, boolean, mixed, number, object, string } from 'yup';

import { Cache } from '../helper/modules/cache.js';
import { getSyntaxAdvice } from '../utils/ai/syntax-check-agent.js';
import { color, loggers } from '../utils/modules/index.js';

const COMMANDS_DIR = './src/commands';
const EXCLUDE_DIR = /([/\\])(subcommands|ui|__tests__|_)([/\\]|$)/;
const EXCLUDE_FILE = /(template|\.d\.ts$)/;
const EXCLUDE_CONTENT = ['template', 'd.ts', '__tests__', '/subcommands/', '/ui/', '/_'];
const IS_WIN32 = os.platform() === 'win32';
const AGENT_ENABLED = true;

const getAgentLanguage = () => {
	try {
		const settings = JSON.parse(require('fs').readFileSync('./src/helper/config/settings.json', 'utf8'));

		return settings.locale || 'id';
	} catch {
		return 'id';
	}
};

export const COMMAND_SCHEMA = object({
	name: string().required(),
	minifiedDescription: string().optional().default('This is minified description'),
	description: string().optional(),
	category: string()
		.oneOf([
			'AI',
			'AL-Quran',
			'Anime',
			'Anonymous',
			'Converter',
			'Debugging',
			'Downloader',
			'Games',
			'Genshin Impact',
			'Helper',
			'Look-up',
			'Misc',
			'Moderation',
			'News',
			'Owner',
			'Search'
		])
		.required(),
	usage: string().required(),
	aliases: array(string()).default([]).optional(),
	cooldown: number().integer().min(0).required(),
	limit: number().integer().min(0).required(),
	status: string().oneOf(['enable', 'disable']).required(),
	timeout: number().integer().min(0).default(30000).optional(),
	restrict: boolean().default(false).optional(),
	premium: boolean().default(false).optional(),
	replyChain: object()
		.shape({
			enabled: boolean().default(false).optional(),
			ttl: number().integer().min(60).max(3600).default(300).optional(),
			maxMessages: number().integer().min(1).max(20).default(5).optional()
		})
		.default(undefined)
		.optional(),
	run: mixed()
		.test({ test: (value) => typeof value === 'function', message: 'Run must be a function', name: 'run' })
		.required()
});

class ModuleError extends Error {
	constructor(error) {
		super(error.message);
		this.name = 'ModuleError';
		this.info = `${this.name}: ${error.message.split('\n')[0]}`;
		Error.captureStackTrace(this, this.constructor);
	}
}

export class CommandLoader extends EventEmitter {
	#commands;
	#aliases;
	#watcher = null;
	#ready = false;
	#dir;

	constructor(options = {}) {
		super();
		this.#commands = options.commands ?? new Cache();
		this.#aliases = options.aliases ?? [];
		this.#dir = options.dir ?? COMMANDS_DIR;
		this.#ready = this.#commands.size > 0;
		this.on('error', ({ file, reason }) => {
			loggers.error(
				color('Command load error:', 'red'),
				color(file || 'unknown', 'gray'),
				color(reason || 'unknown', 'white')
			);
		});
	}

	get commands() {
		return this.#commands;
	}

	get aliases() {
		return this.#aliases;
	}

	get ready() {
		return this.#ready;
	}

	async load(flags = {}) {
		if (this.#ready) {
			this.emit('loaded', { count: this.#commands.size, skipped: true });

			return this;
		}

		let files = CommandLoader.#scanFiles(this.#dir).filter((f) => !EXCLUDE_CONTENT.some((v) => f.includes(v)));

		if (process.env.SUB_BOT_PROCESS === '1') {
			const excluded = ['eval.js', 'fetch-story.js', 'pm2.js', 'unbanned.js', 'premium.js', 'botflags.js', 'banned.js'];

			files = files.filter((f) => !excluded.some((name) => f.endsWith(name)));
		}

		if (flags.test) {
			const include = ['menu', 'ping', 'moderator', 'owner'];

			files = files.filter((f) => include.some((v) => f.includes(v)));
		}

		const seenErrors = new Set();

		await Promise.all(files.map((file) => this.#loadOne(file, flags, seenErrors)));

		this.#aliases = this.#aliases.filter(Boolean);
		this.#ready = true;

		this.emit('loaded', { count: this.#commands.size });

		return this;
	}

	async watch(options = {}) {
		if (this.#watcher) {
			return this;
		}

		const watchPath = path.resolve(this.#dir);

		this.#watcher = chokidar.watch(watchPath, {
			ignoreInitial: true,
			ignored: EXCLUDE_DIR,
			...options
		});

		this.#watcher.on('add', (filePath) => this.#onAdd(filePath));
		this.#watcher.on('change', (filePath) => this.#onChange(filePath));
		this.#watcher.on('unlink', (filePath) => this.#onUnlink(filePath));
		this.#watcher.on('ready', () => this.emit('watcher:ready'));

		return this;
	}

	async stopWatching() {
		if (this.#watcher) {
			await this.#watcher.close();
			this.#watcher = null;
		}
	}

	async #loadOne(filename, flags, seenErrors) {
		const file = CommandLoader.#toImportPath(filename);
		const normalize = path.normalize(filename);

		try {
			const stat = fs.statSync(filename);

			if (stat.size === 0) {
				return;
			}

			const module = await import(file);

			if (!module?.default) {
				this.#commands.set('UNKNOWN-' + Date.now(), { absolutePath: file, path: normalize });
				this.emit('error', { file: normalize, reason: 'no default export' });
				return;
			}

			if (this.#commands.has(module.default.name)) {
				this.emit('error', { file: normalize, reason: 'duplicate name', name: module.default.name });
				return;
			}

			const validated = CommandLoader.#validate(module.default);

			Object.assign(validated, { absolutePath: file, path: normalize });

			this.#commands.set(validated.name, validated);
			this.#aliases.push(...(validated.aliases || []));
		} catch (error) {
			if (error instanceof ModuleError) {
				this.emit('error', { file: normalize, reason: error.info });
				this.#commands.set('UNKNOWN-' + Date.now(), { absolutePath: file, path: normalize });
				return;
			}

			const key = String(error?.message || error);

			if (!seenErrors.has(key)) {
				seenErrors.add(key);
				this.emit('error', { file: normalize, reason: key });
				this.#reportSyntaxError(filename, Boolean(flags.watch));
			}

			this.#commands.set('UNKNOWN-' + Date.now(), { absolutePath: file, path: normalize });
		}
	}

	async #onAdd(filename) {
		const entries = this.#commands.entries();
		const resolved = path.resolve(filename);
		const exists = entries.some(([, cmd]) => path.resolve(cmd.path) === resolved);

		if (exists) {
			return;
		}

		const file = CommandLoader.#toImportPath(filename);
		const displayName = path.relative(process.cwd(), filename);

		try {
			const module = await CommandLoader.#nocache(file);

			if (!module?.default?.name) {
				if (fs.statSync(resolved).size === 0) {
					return;
				}

				this.emit('error', { file: displayName, reason: 'no default export or missing name' });
				return;
			}

			if (this.#commands.has(module.default.name)) {
				this.emit('error', { file: displayName, reason: 'duplicate name', name: module.default.name });
				return;
			}

			const validated = CommandLoader.#validate(module.default);

			this.#commands.set(module.default.name, { ...validated, absolutePath: file, path: resolved });
			this.emit('added', { name: module.default.name, file: displayName });
		} catch (error) {
			if (error instanceof ModuleError) {
				this.emit('error', { file: displayName, reason: error.info });
				return;
			}

			await this.#reportSyntaxError(filename, true);
			this.emit('error', { file: displayName, reason: String(error?.message || error) });
		}
	}

	async #onChange(filename) {
		const file = CommandLoader.#toImportPath(filename);
		const displayName = path.relative(process.cwd(), filename);
		const resolved = path.resolve(filename);
		const entries = this.#commands.entries();
		const index = entries.findIndex(([, cmd]) => path.resolve(cmd.path) === resolved);

		if (index === -1) {
			return this.#onAdd(filename);
		}

		try {
			const module = await CommandLoader.#nocache(file);
			const command = module?.default;

			if (!command?.name || typeof command.run !== 'function') {
				this.emit('error', { file: displayName, reason: 'invalid command after change' });
				return;
			}

			const validated = CommandLoader.#validate(command);
			const currentEntry = entries[index];
			let currentName = currentEntry[0];

			if (currentName !== command.name) {
				this.#commands.delete(currentName);
				currentName = command.name;
			}

			this.#commands.set(currentName, {
				...validated,
				absolutePath: currentEntry[1].absolutePath,
				path: currentEntry[1].path
			});

			this.emit('changed', { name: currentName, file: displayName });
		} catch (error) {
			if (error instanceof ModuleError) {
				this.emit('error', { file: displayName, reason: error.info });
				return;
			}

			await this.#reportSyntaxError(filename, true);
			this.emit('error', { file: displayName, reason: String(error?.message || error) });
		}
	}

	#onUnlink(filename) {
		const displayName = path.relative(process.cwd(), filename);
		const resolved = path.resolve(filename);
		const entries = this.#commands.entries();
		const index = entries.findIndex(([, cmd]) => path.resolve(cmd.path) === resolved);

		if (index === -1) {
			return;
		}

		const allFiles = CommandLoader.#scanFiles(this.#dir).filter((f) => !EXCLUDE_CONTENT.some((v) => f.includes(v)));
		const existingPaths = entries.map(([, cmd]) => cmd.path);
		const normalizedFiles = allFiles.map((c) => path.normalize(c));
		const renamedFile = normalizedFiles.find((v) => !existingPaths.includes(v));
		const entry = entries[index];

		if (renamedFile) {
			this.#commands.delete(entry[0]);
			entry[1].path = renamedFile;
			entry[1].absolutePath = CommandLoader.#toImportPath(renamedFile);
			this.#commands.set(entry[0], entry[1]);
			this.emit('renamed', { name: entry[0], from: displayName, to: renamedFile });
		} else {
			this.#commands.delete(entry[0]);
			this.emit('removed', { name: entry[0], file: displayName });
		}
	}

	async #reportSyntaxError(filename, isWatch) {
		const absolutePath = path.resolve(filename);
		let source;

		try {
			source = fs.readFileSync(absolutePath, 'utf-8').replace(/\t/g, '    ');
		} catch {
			return;
		}

		let syntaxError;

		try {
			const syntaxErrorLib = (await import('syntax-error')).default;

			syntaxError = syntaxErrorLib(source, absolutePath, {
				allowReturnOutsideFunction: true,
				allowAwaitOutsideFunction: true,
				sourceType: 'module'
			});
		} catch {
			return;
		}

		if (!syntaxError) {
			return;
		}

		const [, , errorLine, arrow, typeError] = String(syntaxError).split('\n');
		const lines = source.split('\n');
		const displayName = path.relative(process.cwd(), filename);
		const waitMsg = isWatch ? 'Waiting for changes...' : 'Fix the error and restart the bot.';

		loggers.error(color(displayName, 'purple'), color(`Syntax Error! ${waitMsg}`, 'red'));

		if (!syntaxError.line || syntaxError.line < 1) {
			return;
		}

		const idx = syntaxError.line - 1;
		const prevLine = lines[idx - 1] || '';
		const nextLine = lines[idx + 1] || '';
		const prevNum = Math.max(0, syntaxError.line - 1);
		const currNum = syntaxError.line;
		const nextNum = syntaxError.line + 1;
		const pad = (n) => ' '.repeat(Math.max(String(currNum).length - String(n).length + 2, 1));
		const hl = (code) =>
			highlight(code.replace(/\t/g, ' '), { language: 'js', ignoreIllegals: true, theme: color.getSyntaxTheme() });
		const lavender = chalk.bgHex(color.getHex('lavender'))(' ');

		loggers.error(
			`${pad(prevNum)}`,
			color('⇢ ', 'green'),
			color(displayName, 'purple') +
				color(':', 'gray') +
				color(currNum, 'yellow') +
				color(':', 'gray') +
				color(syntaxError.column || 0, 'yellow')
		);
		loggers.error(`${pad(nextNum)}`, color('⇢ ', 'green'), color(typeError, 'red'));

		if (prevNum > 0) {
			loggers.error(`${lavender} ${color(prevNum, 'gray')}` + hl(prevLine).trimEnd().replace('\n', ''));
		}

		loggers.error(chalk.bgRed(' ') + ` ${color(currNum, 'white')}` + hl(errorLine).trimEnd().replace('\n', ''));
		loggers.error(`${lavender}` + ' '.repeat(String(currNum).length) + color(arrow.replace(' ^', '˜˜˜'), 'red'));
		loggers.error(`${lavender} ${color(nextNum, 'gray')}` + hl(nextLine).trimEnd().replace('\n', ''));

		if (AGENT_ENABLED) {
			const codeSnippet = [prevLine, lines[idx] || '', nextLine].join('\n');

			getSyntaxAdvice({
				filename: displayName,
				error: typeError || errorLine,
				line: currNum,
				column: syntaxError.column || 0,
				code: codeSnippet,
				language: getAgentLanguage()
			})
				.then((advice) => {
					if (!advice) {
						return;
					}

					const results = [...advice.matchAll(/```(\w+)?\n([\s\S]*?)```/g)];

					for (const result of results) {
						advice = advice.replaceAll(result[0], hl(result[2].trim()));
					}

					advice = advice.replace(/\n{2,}/g, '\n').trim();
					loggers.warning(color('💡 Agent Note:', 'cyan'), chalk.hex(color.getHex('lightGray')).italic(advice));
				})
				.catch(() => {
					/* agent failure is non-critical */
				});
		}
	}

	static #validate(data) {
		try {
			return COMMAND_SCHEMA.validateSync(data);
		} catch (error) {
			throw new ModuleError(error);
		}
	}

	static #toImportPath(file) {
		const absolutePath = path.resolve(file);

		return IS_WIN32 ? `file://${absolutePath.replace(/\\/g, '/')}` : `file://${absolutePath}`;
	}

	static #scanFiles(dir) {
		const files = [];

		const walk = (curDir) => {
			const entries = fs.readdirSync(curDir, { withFileTypes: true });

			for (const entry of entries) {
				const entryPath = `${curDir}/${entry.name}`;

				if (entry.isDirectory()) {
					if (EXCLUDE_DIR.test(entryPath)) {
						continue;
					}

					walk(entryPath);
					continue;
				}

				if (EXCLUDE_FILE.test(entryPath)) {
					continue;
				}

				files.push(entryPath);
			}
		};

		walk(dir);

		return files;
	}

	static async #nocache(modulePath) {
		return import(modulePath + '?v=' + Date.now());
	}
}
