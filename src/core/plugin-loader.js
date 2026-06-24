import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { color, loggers } from '../utils/modules/index.js';
import { PLUGIN_SCHEMA } from './plugin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGINS_DIR = path.resolve(__dirname, '../plugins');

export class PluginLoader {
	#configuration;
	#loaded = new Map();

	constructor(configuration) {
		this.#configuration = configuration;
	}

	get loaded() {
		return this.#loaded;
	}

	async load() {
		if (!fs.existsSync(PLUGINS_DIR)) {
			fs.mkdirSync(PLUGINS_DIR, { recursive: true });
			loggers.info(color('Plugins directory created:', 'white'), color(PLUGINS_DIR, 'gray'));
			return this;
		}

		const entries = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true });
		const pluginDirs = entries.filter((e) => e.isDirectory());

		for (const dir of pluginDirs) {
			await this.#loadOne(dir.name);
		}

		if (this.#loaded.size > 0) {
			loggers.info(color('Plugins loaded:', 'white'), color(`${this.#loaded.size}`, 'lilac'));
		}

		return this;
	}

	async #loadOne(dirName) {
		const pluginDir = path.join(PLUGINS_DIR, dirName);
		const indexPath = path.join(pluginDir, 'index.js');

		if (!fs.existsSync(indexPath)) {
			return;
		}

		try {
			const fileUrl = `file://${indexPath.replace(/\\/g, '/')}`;
			const module = await import(fileUrl + '?v=' + Date.now());
			const raw = module?.default;

			if (!raw) {
				loggers.error(color(`Plugin "${dirName}":`, 'red'), color('no default export', 'white'));
				return;
			}

			let validated;

			try {
				validated = PLUGIN_SCHEMA.validateSync(raw, { stripUnknown: false });
			} catch (validationError) {
				loggers.error(
					color(`Plugin "${dirName}":`, 'red'),
					color(validationError.message.split('\n')[0], 'white')
				);
				return;
			}

			if (this.#loaded.has(validated.name)) {
				loggers.error(color(`Plugin "${validated.name}":`, 'red'), color('duplicate name, skipping', 'white'));
				return;
			}

			this.#register(validated);
			this.#loaded.set(validated.name, validated);

			loggers.info(
				color('Plugin:', 'white'),
				color(validated.name, 'lilac'),
				color(`v${validated.version}`, 'gray'),
				color(`— ${validated.commands?.length || 0} commands`, 'softGreen')
			);
		} catch (err) {
			loggers.error(color(`Plugin "${dirName}" load failed:`, 'red'), color(err.message, 'white'));
		}
	}

	#register(plugin) {
		const commands = plugin.commands || [];

		for (const cmd of commands) {
			const existing = this.#configuration.registry.commands.get(cmd.name);

			if (existing) {
				loggers.warning(
					color(`Plugin "${plugin.name}":`, 'red'),
					color(`command "${cmd.name}" conflicts with existing command, skipping`, 'white')
				);
				continue;
			}

			this.#configuration.registry.commands.set(cmd.name, {
				...cmd,
				_source: `plugin:${plugin.name}`
			});

			if (cmd.aliases?.length) {
				this.#configuration.registry.aliases.push(...cmd.aliases);
			}
		}

		const middlewareList = plugin.middleware || [];

		for (const mw of middlewareList) {
			if (this.#configuration.middlewareChain) {
				this.#configuration.middlewareChain.use(mw);
			}
		}

		const hooks = plugin.hooks || {};

		if (hooks.beforeCommand) {
			this.#configuration.pluginHooks.beforeCommand.push(hooks.beforeCommand);
		}

		if (hooks.afterCommand) {
			this.#configuration.pluginHooks.afterCommand.push(hooks.afterCommand);
		}

		if (hooks.onError) {
			this.#configuration.pluginHooks.onError.push(hooks.onError);
		}

		this.#configuration.plugins.set(plugin.name, plugin);
	}
}
