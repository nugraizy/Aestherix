import { EventEmitter } from 'node:events';
import path from 'node:path';
import chokidar from 'chokidar';

import { Cache } from '../helper/modules/cache.js';
import { loadFiles, color, loggers } from '../utils/modules/index.js';
import { normalizeImportPath, validatePlugins } from '../helper/connection/utils/cache.js';
import { ModuleError, isMissingProperty } from '../helper/connection/utils/util.js';

const COMMANDS_DIR = './src/commands';
const EXCLUDE_DIR = /([/\\])(subcommands|ui|__tests__|_)([/\\]|$)/;
const EXCLUDE_FILE = /(template|\.d\.ts$)/;
const EXCLUDE_CONTENT = ['template', 'd.ts', '__tests__', '/subcommands/', '/ui/', '/_'];

const exclude = (file) => !EXCLUDE_CONTENT.some((v) => file.includes(v));

const nocache = (module) => {
	const param = '?v=' + Date.now();

	return import(module + param);
};

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
		let files = loadFiles(this.#dir, { excludeDir: EXCLUDE_DIR, excludeFile: EXCLUDE_FILE }).filter(exclude);

		if (flags.test) {
			const include = ['menu', 'ping', 'moderate', 'owner'];

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
		if (this.#watcher) return this;

		const watchPath = path.resolve(this.#dir);

		this.#watcher = chokidar.watch(watchPath, {
			ignoreInitial: true,
			ignored: EXCLUDE_DIR,
			...options
		});

		this.#watcher.on('add', (filePath) => this.#onAdd(filePath));
		this.#watcher.on('change', (filePath) => this.#onChange(filePath));
		this.#watcher.on('unlink', (filePath) => this.#onUnlink(filePath));

		this.#watcher.on('ready', () => {
			this.emit('watcher:ready');
		});

		return this;
	}

	async stopWatching() {
		if (this.#watcher) {
			await this.#watcher.close();
			this.#watcher = null;
		}
	}

	async #loadOne(filename, flags, seenErrors) {
		const file = normalizeImportPath(filename, true);
		const normalize = path.normalize(filename);

		try {
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

			const validated = isMissingProperty(module.default);

			validated.absolutePath = file;
			validated.path = normalize;

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
				validatePlugins(filename, Boolean(flags.watch));
			}

			this.#commands.set('UNKNOWN-' + Date.now(), { absolutePath: file, path: normalize });
		}
	}

	async #onAdd(filename) {
		const entries = this.#commands.entries();
		const resolved = path.resolve(filename);
		const exists = entries.some(([, cmd]) => path.resolve(cmd.path) === resolved);

		if (exists) return;

		const file = normalizeImportPath(filename, true);
		const displayName = path.relative(process.cwd(), filename);

		try {
			const module = await nocache(file);

			if (!module?.default?.name) {
				this.emit('error', { file: displayName, reason: 'no default export or missing name' });
				return;
			}

			if (this.#commands.has(module.default.name)) {
				this.emit('error', { file: displayName, reason: 'duplicate name', name: module.default.name });
				return;
			}

			const validated = isMissingProperty(module.default);

			this.#commands.set(module.default.name, { ...validated, absolutePath: file, path: resolved });

			this.emit('added', { name: module.default.name, file: displayName });
		} catch (error) {
			if (error instanceof ModuleError) {
				this.emit('error', { file: displayName, reason: error.info });
				return;
			}

			await validatePlugins(filename, true);
			this.emit('error', { file: displayName, reason: String(error?.message || error) });
		}
	}

	async #onChange(filename) {
		const file = normalizeImportPath(filename, true);
		const displayName = path.relative(process.cwd(), filename);
		const resolved = path.resolve(filename);
		const entries = this.#commands.entries();
		const index = entries.findIndex(([, cmd]) => path.resolve(cmd.path) === resolved);

		if (index === -1) {
			return this.#onAdd(filename);
		}

		try {
			const module = await nocache(file);
			const command = module?.default;

			if (!command?.name || typeof command.run !== 'function') {
				this.emit('error', { file: displayName, reason: 'invalid command after change' });
				return;
			}

			const validated = isMissingProperty(command);
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

			await validatePlugins(filename, true);
			this.emit('error', { file: displayName, reason: String(error?.message || error) });
		}
	}

	#onUnlink(filename) {
		const displayName = path.relative(process.cwd(), filename);
		const resolved = path.resolve(filename);
		const entries = this.#commands.entries();
		const index = entries.findIndex(([, cmd]) => path.resolve(cmd.path) === resolved);

		if (index === -1) return;

		const allFiles = loadFiles(this.#dir, { excludeDir: EXCLUDE_DIR, excludeFile: EXCLUDE_FILE }).filter(exclude);
		const existingPaths = entries.map(([, cmd]) => cmd.path);
		const normalizedFiles = allFiles.map((c) => path.normalize(c));
		const renamedFile = normalizedFiles.find((v) => !existingPaths.includes(v));

		const entry = entries[index];

		if (renamedFile) {
			this.#commands.delete(entry[0]);
			entry[1].path = renamedFile;
			entry[1].absolutePath = normalizeImportPath(renamedFile);
			this.#commands.set(entry[0], entry[1]);

			this.emit('renamed', { name: entry[0], from: displayName, to: renamedFile });
		} else {
			this.#commands.delete(entry[0]);

			this.emit('removed', { name: entry[0], file: displayName });
		}
	}
}
