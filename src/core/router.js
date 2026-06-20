// @ts-check
import { Cache } from '../helper/modules/cache.js';
import {
	incrementCommandUsage as incrementInDB,
	loadCommandUsage as loadFromDB
} from '../helper/database/adapters/command-usage.js';
import prisma from '../helper/database/prisma.js';

const BLOCKED_FOR_SUB = new Set([
	'eval',
	'exec',
	'shell',
	'terminal',
	'addbot',
	'removebot',
	'listbots',
	'botflags',
	'ban',
	'unban',
	'setlimit',
	'setrole',
	'restart',
	'shutdown',
	'setprefix',
	'settings'
]);

/** @typedef {import('../types/Core/index.js').Router} RouterType */

/** @implements {RouterType} */
export class Router {
	#client;
	#commands;
	#aliases;
	#cooldowns;
	#prefixConfig;
	#usage;
	#usageLoaded = false;
	#groupAliases = {};

	/**
	 * @param {import('../types/Core/index.d.ts').ClientSocket} client
	 * @param {{ prefix?: string; prefixMode?: string; prefixReg?: RegExp | null; commands?: object; aliases?: string[] }} [options]
	 */
	constructor(client, options = {}) {
		this.#client = client;
		this.#commands = options.commands ?? new Cache();
		this.#aliases = options.aliases ?? [];
		this.#cooldowns = new Cache();
		this.#usage = new Cache();
		this.#prefixConfig = {
			mode: options.prefixMode ?? 'single',
			value: options.prefix ?? '.',
			regex: options.prefixReg ?? null
		};
	}

	get commands() {
		return this.#commands;
	}

	set commands(value) {
		this.#commands = value;
	}

	get aliases() {
		return this.#aliases;
	}

	set aliases(value) {
		this.#aliases = value;
	}

	get groupAliases() {
		return this.#groupAliases;
	}

	set groupAliases(value) {
		this.#groupAliases = value ?? {};
	}

	get cooldowns() {
		return this.#cooldowns;
	}

	get prefixConfig() {
		return this.#prefixConfig;
	}

	/** @param {{ mode?: string; value?: string; regex?: RegExp | null }} config */
	updatePrefix({ mode, value, regex }) {
		if (mode) {
			this.#prefixConfig.mode = mode;
		}

		if (value !== undefined) {
			this.#prefixConfig.value = value;
		}

		if (regex !== undefined) {
			this.#prefixConfig.regex = regex;
		}
	}

	/**
	 * @param {string} body
	 * @returns {{ command: object; args: string[]; cmdName: string; prefix: string; query: string; isEval: boolean } | null}
	 */
	resolve(body) {
		if (!body) {
			return null;
		}

		const args = body.split(/ +/g);
		const raw = args[0].toLowerCase();
		const prefix = this.#extractPrefix(raw, body);
		const isEval = ['/>', '$>', '=>', '!>'].includes(args[0]);

		if (!isEval && prefix === null) {
			return null;
		}

		const cmdName = isEval ? args[0] : raw.slice(prefix.length);
		const command = this.#findCommand(cmdName);

		if (!command && !isEval) {
			return null;
		}

		return {
			command: command || null,
			args,
			prefix: prefix ?? '',
			cmdName: command?.name ?? cmdName,
			isEval,
			query: args.slice(1).join(' ').trim()
		};
	}

	#extractPrefix(raw, body) {
		const { mode, value, regex } = this.#prefixConfig;

		if (mode === 'nopref') {
			return '';
		}

		if (mode === 'multi' && regex) {
			const match = raw.match(regex);

			return match ? match[0] : null;
		}

		if (body.startsWith(value)) {
			return value;
		}

		return null;
	}

	#findCommand(cmdName) {
		const command = this.#commands.get(cmdName);

		if (command) {
			return command;
		}

		const aliasMatch = this.#aliases.find((a) => a === cmdName);

		if (aliasMatch) {
			return this.#commands.filter((_key, cmd) => cmd.aliases?.includes(aliasMatch), 'find') || null;
		}

		if (this.#groupAliases && this.#groupAliases[cmdName]) {
			const resolved = this.#groupAliases[cmdName];
			const command = this.#commands.get(resolved);

			if (command) {
				return command;
			}

			const byAlias = this.#commands.filter((_key, cmd) => cmd.aliases?.includes(resolved), 'find');

			if (byAlias) {
				return byAlias;
			}
		}

		return null;
	}

	/**
	 * @param {{ name: string; category: string }} command
	 * @returns {boolean}
	 */
	isBlocked(command) {
		if (this.#client?.role !== 'sub') {
			return false;
		}

		if (command.category === 'Owner') {
			return true;
		}

		return BLOCKED_FOR_SUB.has(command.name);
	}

	/**
	 * @param {string} senderId
	 * @param {string} commandName
	 * @param {number} cooldownSec
	 * @returns {{ onCooldown: boolean; remaining: number }}
	 */
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

	get usage() {
		return this.#usage;
	}

	async loadUsage() {
		if (this.#usageLoaded) {
			return;
		}

		this.#usageLoaded = true;
		const raw = await loadFromDB(prisma).catch(() => ({}));

		for (const [name, count] of Object.entries(raw)) {
			this.#usage.set(name, count);
		}
	}

	/**
	 * @param {string} commandName
	 * @returns {Promise<void>}
	 */
	async trackUsage(commandName) {
		if (!commandName) {
			return;
		}

		await this.loadUsage();

		const current = Number(this.#usage.get(commandName) || 0);

		this.#usage.set(commandName, current + 1);
		await incrementInDB(prisma, commandName);

		this.#trackDaily(commandName);
	}

	#dailyBuffer = {};
	#dailyFlushTimer = null;

	#trackDaily(commandName) {
		const today = new Date().toISOString().slice(0, 10);
		const key = `${today}:${commandName}`;

		this.#dailyBuffer[key] = (this.#dailyBuffer[key] || 0) + 1;

		if (!this.#dailyFlushTimer) {
			this.#dailyFlushTimer = setTimeout(() => this.#flushDaily(), 30000);
		}
	}

	async #flushDaily() {
		this.#dailyFlushTimer = null;

		const buffer = this.#dailyBuffer;

		this.#dailyBuffer = {};

		try {
			const row = await prisma.dashboardKV.findUnique({
				where: { key_sessionName: { key: 'command_usage_daily', sessionName: 'main' } }
			});

			const existing = row?.value ? JSON.parse(row.value) : {};

			for (const [key, count] of Object.entries(buffer)) {
				existing[key] = (existing[key] || 0) + count;
			}

			const keys = Object.keys(existing).sort();
			const cutoff = new Date();

			cutoff.setDate(cutoff.getDate() - 30);

			const cutoffStr = cutoff.toISOString().slice(0, 10);
			const pruned = {};

			for (const k of keys) {
				if (k.slice(0, 10) >= cutoffStr) {
					pruned[k] = existing[k];
				}
			}

			await prisma.dashboardKV.upsert({
				where: { key_sessionName: { key: 'command_usage_daily', sessionName: 'main' } },
				update: { value: JSON.stringify(pruned) },
				create: { key: 'command_usage_daily', sessionName: 'main', value: JSON.stringify(pruned) }
			});
		} catch {
			for (const [k, v] of Object.entries(buffer)) {
				this.#dailyBuffer[k] = (this.#dailyBuffer[k] || 0) + v;
			}
		}
	}
}
