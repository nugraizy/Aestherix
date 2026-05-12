import { Cache } from '../helper/modules/cache.js';
import { loadCommands } from '../helper/connection/utils/commands.js';

const BLOCKED_FOR_SUB = new Set([
	'eval', 'exec', 'shell', 'terminal',
	'addbot', 'removebot', 'listbots', 'botflags',
	'ban', 'unban', 'setlimit', 'setrole',
	'restart', 'shutdown', 'setprefix', 'settings'
]);

export class Router {
	#client;
	#commands;
	#aliases;
	#cooldowns;
	#options;

	constructor(client, options = {}) {
		this.#client = client;
		this.#commands = options.commands ?? new Cache();
		this.#aliases = options.aliases ?? [];
		this.#cooldowns = new Cache();
		this.#options = {
			prefix: options.prefix ?? '.',
			...options
		};
	}

	get commands() {
		return this.#commands;
	}

	get aliases() {
		return this.#aliases;
	}

	get cooldowns() {
		return this.#cooldowns;
	}

	get prefix() {
		return this.#options.prefix;
	}

	async loadCommands(flags = {}) {
		await loadCommands(flags);
	}

	resolve(body) {
		if (!body) return null;

		const prefix = this.#options.prefix;
		const hasPrefix = body.startsWith(prefix);

		if (!hasPrefix) return null;

		const args = body.split(/ +/g);
		const cmdName = args[0].slice(prefix.length).toLowerCase();

		let command = this.#commands.get(cmdName);

		if (!command) {
			const aliasMatch = this.#aliases.find((a) => a === cmdName);

			if (aliasMatch) {
				command = this.#commands.filter(
					(_key, cmd) => cmd.aliases?.includes(aliasMatch),
					'find'
				);
			}
		}

		if (!command) return null;

		return { command, args, prefix, cmdName };
	}

	isBlocked(command) {
		if (this.#client.role !== 'sub') return false;

		if (command.category === 'Owner') return true;

		return BLOCKED_FOR_SUB.has(command.name);
	}

	checkCooldown(senderId, commandName, cooldownSec) {
		const key = `${senderId}:${commandName}`;
		const now = Date.now();
		const expiry = this.#cooldowns.get(key);

		if (expiry && now < expiry) {
			return { onCooldown: true, remaining: Math.ceil((expiry - now) / 1000) };
		}

		if (cooldownSec > 0) {
			this.#cooldowns.set(key, now + cooldownSec * 1000);
		}

		return { onCooldown: false, remaining: 0 };
	}
}
