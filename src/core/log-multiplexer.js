// @ts-check
import fs from 'fs-extra';
import path from 'node:path';
import { spawn } from 'node:child_process';
import readline from 'node:readline';

import { color } from '../utils/modules/color.js';

const LOG_DIR = './logs';
const DEFAULT_MAX_LOG_SIZE = 5;
const CONNECTED_PATTERN = /Socket connected/;
const BANNER_PATTERN = /╔|╗|╚|╝|║|▄|▀|█/;

export class LogMultiplexer {
	/** @type {Map<string, import('./logger.js').Logger>} */
	#loggers = new Map();

	/** @type {Map<string, import('fs').WriteStream>} */
	#logFiles = new Map();

	/** @type {Map<string, import('child_process').ChildProcess>} */
	#terminals = new Map();

	/** @type {'combined' | 'separated'} */
	#mode = 'combined';

	/** @type {import('readline').Interface | null} */
	#rl = null;

	/** @type {import('fs').WriteStream | null} */
	#mainLogStream = null;

	/** @type {number} */
	#mainLogSize = 0;

	/** @type {boolean} */
	#hasConnectedLog = false;

	/** @type {number} */
	#maxLogBytes;

	/** @type {import('fs').FSWatcher | null} */
	#followWatcher = null;

	/** @type {boolean} */
	#following = false;

	/** @type {boolean} */
	#prompting = false;

	/** @type {(() => Array<{ name: string; state: string; phone?: string; uptime?: string }>) | null} */
	#getBots = null;

	/** @type {(() => Record<string, boolean>) | null} */
	#getFlags = null;

	/** @type {((flag: string, value: boolean) => void) | null} */
	#setFlag = null;

	/** @type {boolean} */
	#skipSub = false;

	/** @param {{ maxLogSize?: number; skipSub?: boolean; getBots?: () => Array<{ name: string; state: string; phone?: string; uptime?: string }>; getFlags?: () => Record<string, boolean>; setFlag?: (flag: string, value: boolean) => void }} [options] */
	constructor(options = {}) {
		const mb = typeof options.maxLogSize === 'number' && options.maxLogSize > 0 ? options.maxLogSize : DEFAULT_MAX_LOG_SIZE;

		this.#maxLogBytes = mb * 1024 * 1024;
		this.#skipSub = Boolean(options.skipSub);
		this.#getBots = this.#skipSub ? null : (options.getBots ?? null);
		this.#getFlags = options.getFlags ?? null;
		this.#setFlag = options.setFlag ?? null;
		fs.ensureDirSync(LOG_DIR);
		this.#initMainLog();
		this.#setupKeyListener();
	}

	get mode() {
		return this.#mode;
	}

	#initMainLog() {
		const logPath = this.#logFilePath('MAIN');

		try {
			if (fs.existsSync(logPath)) {
				const content = fs.readFileSync(logPath, 'utf-8');

				this.#mainLogSize = Buffer.byteLength(content, 'utf-8');
				this.#hasConnectedLog = CONNECTED_PATTERN.test(content);
			}
		} catch {
			this.#mainLogSize = 0;
			this.#hasConnectedLog = false;
		}

		this.#mainLogStream = fs.createWriteStream(logPath, { flags: 'a' });
	}

	#rotateMainLog() {
		const logPath = this.#logFilePath('MAIN');
		const rotatedPath = `${logPath}.1`;

		try {
			if (this.#mainLogStream) {
				this.#mainLogStream.end();
			}

			if (fs.existsSync(rotatedPath)) {
				fs.removeSync(rotatedPath);
			}

			fs.renameSync(logPath, rotatedPath);
		} catch {
			// ignore rotation errors
		}

		this.#mainLogStream = fs.createWriteStream(logPath, { flags: 'a' });
		this.#mainLogSize = 0;
		this.#hasConnectedLog = false;
	}

	/**
	 * @param {string} type
	 * @param {string} formattedStr
	 * @returns {boolean}
	 */
	#shouldLogToMain(type, formattedStr) {
		if (BANNER_PATTERN.test(formattedStr)) {
			return false;
		}

		if (CONNECTED_PATTERN.test(formattedStr)) {
			if (this.#hasConnectedLog) {
				return false;
			}

			this.#hasConnectedLog = true;
		}

		return true;
	}

	/**
	 * @param {string} type
	 * @param {string} formattedStr
	 * @param {string | null} [errorStack]
	 */
	#writeToMain(type, formattedStr, errorStack = null) {
		if (!this.#shouldLogToMain(type, formattedStr)) {
			return;
		}

		const line = `${formattedStr}\n`;
		const size = Buffer.byteLength(line, 'utf-8');

		if (this.#mainLogSize + size > this.#maxLogBytes) {
			this.#rotateMainLog();
		}

		this.#mainLogStream?.write(line);
		this.#mainLogSize += size;

		if (errorStack) {
			const stackLine = `${errorStack}\n`;

			this.#mainLogStream?.write(stackLine);
			this.#mainLogSize += Buffer.byteLength(stackLine, 'utf-8');
		}
	}

	/**
	 * @param {import('./logger.js').Logger} logger
	 * @param {string} badge
	 */
	register(logger, badge) {
		this.#loggers.set(badge, logger);

		if (badge !== 'MAIN') {
			const logPath = this.#logFilePath(badge);
			const stream = fs.createWriteStream(logPath, { flags: 'a' });

			this.#logFiles.set(badge, stream);
		}
	}

	/** @param {string} badge */
	unregister(badge) {
		this.#loggers.delete(badge);

		const stream = this.#logFiles.get(badge);

		if (stream) {
			stream.end();
			this.#logFiles.delete(badge);
		}

		if (this.#mode === 'separated') {
			this.#killTerminal(badge);
		}
	}

	/**
	 * @param {string} badge
	 * @param {string} type
	 * @param {string} formattedStr
	 * @param {string | null} [errorStack]
	 */
	route(badge, type, formattedStr, errorStack = null) {
		this.#writeToMain(type, formattedStr, errorStack);

		if (this.#following || this.#prompting) {
			return;
		}

		if (this.#mode === 'combined') {
			console.log(formattedStr);

			if (errorStack) {
				console.log(errorStack);
			}

			return;
		}

		if (badge === 'MAIN') {
			console.log(formattedStr);

			if (errorStack) {
				console.log(errorStack);
			}
		} else {
			const stream = this.#logFiles.get(badge);

			if (stream) {
				stream.write(`${formattedStr}\n`);

				if (errorStack) {
					stream.write(`${errorStack}\n`);
				}
			}
		}
	}

	toggle() {
		if (this.#mode === 'combined') {
			this.#enterSeparated();
		} else {
			this.#enterCombined();
		}
	}

	#enterSeparated() {
		if (this.#loggers.size <= 1) {
			console.log(color('No sub-bots to separate.', 'gray'));
			return;
		}

		this.#mode = 'separated';
		console.log(color('Separated mode — each bot has its own terminal. Press T to combine.', 'lilac'));

		for (const badge of this.#loggers.keys()) {
			if (badge === 'MAIN') {
				continue;
			}

			this.#spawnTerminal(badge);
		}
	}

	#enterCombined() {
		this.#mode = 'combined';
		this.#killAllTerminals();
		console.log(color('Combined mode — all logs in one terminal.', 'lilac'));
	}

	/** @param {string} badge */
	#spawnTerminal(badge) {
		const logPath = path.resolve(this.#logFilePath(badge));
		const title = badge;

		/** @type {string[]} */
		let cmd;

		if (process.platform === 'win32') {
			const psScript = path.join(LOG_DIR, `${badge}-tail.ps1`);
			const wrapper = path.join(LOG_DIR, `${badge}-tail.cmd`);

			fs.writeFileSync(
				psScript,
				`$Host.UI.RawUI.WindowTitle = '${title}'\nif (Test-Path '${logPath}') { Get-Content '${logPath}' -Wait } else { Write-Host 'Waiting for logs...' -ForegroundColor Gray; while (!(Test-Path '${logPath}')) { Start-Sleep -Milliseconds 500 }; Get-Content '${logPath}' -Wait }`
			);

			fs.writeFileSync(wrapper, `@echo off\r\npowershell -ExecutionPolicy Bypass -NoExit -File "${psScript}"\r\n`);

			cmd = [wrapper];
		} else if (process.platform === 'darwin') {
			cmd = [
				'osascript',
				'-e',
				`tell application "Terminal" to do script "tail -F '${logPath}' 2>/dev/null || echo 'Waiting for logs...'; while [ ! -f '${logPath}' ]; do sleep 0.5; done; tail -F '${logPath}'"`
			];
		} else {
			const terminals = ['x-terminal-emulator', 'gnome-terminal', 'konsole', 'xfce4-terminal', 'xterm'];
			const term = this.#findTerminal(terminals);

			if (!term) {
				console.log(color(`No terminal emulator found for ${badge}. Logs at: ${logPath}`, 'gray'));
				return;
			}

			if (term === 'xterm') {
				cmd = ['xterm', '-title', title, '-e', `tail -F '${logPath}' 2>/dev/null || sleep 999`];
			} else if (term === 'gnome-terminal') {
				cmd = ['gnome-terminal', `--title=${title}`, '--', 'bash', '-c', `tail -F '${logPath}' 2>/dev/null || sleep 999`];
			} else if (term === 'konsole') {
				cmd = ['konsole', `--title=${title}`, '-e', 'bash', '-c', `tail -F '${logPath}' 2>/dev/null || sleep 999`];
			} else {
				cmd = [term, '-e', `bash -c "tail -F '${logPath}' 2>/dev/null || sleep 999"`];
			}
		}

		try {
			const child = spawn(cmd[0], cmd.slice(1), {
				detached: true,
				stdio: 'ignore',
				shell: true
			});

			child.unref();
			child.on('exit', () => this.#terminals.delete(badge));
			this.#terminals.set(badge, child);
		} catch (err) {
			console.log(color(`Failed to spawn terminal for ${badge}: ${err.message}. Logs at: ${logPath}`, 'gray'));
		}
	}

	/** @param {string} badge */
	#killTerminal(badge) {
		const child = this.#terminals.get(badge);

		if (child && !child.killed) {
			if (process.platform === 'win32') {
				spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
			} else {
				child.kill();
			}
		}

		this.#terminals.delete(badge);
	}

	#killAllTerminals() {
		for (const [badge, child] of this.#terminals) {
			if (!child.killed) {
				if (process.platform === 'win32') {
					spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
				} else {
					child.kill();
				}
			}

			this.#terminals.delete(badge);
		}
	}

	#keyBindings = [
		{ key: 'T', description: () => `Separate/combine bot logs (current: ${this.#mode})` },
		{ key: 'L', description: () => 'Load history logs' },
		{ key: 'F', description: () => (this.#following ? 'Stop following logs' : 'Follow logs in real-time') },
		{ key: 'S', description: () => 'Show stats' },
		{ key: 'B', description: () => (this.#skipSub ? 'Show bot list (unavailable with --skip-sub)' : 'Show bot list') },
		{ key: 'M', description: () => 'Show memory usage' },
		{ key: 'D', description: () => (this.#skipSub ? 'Dump sub-bot logs (unavailable with --skip-sub)' : 'Dump sub-bot logs') },
		{ key: 'X', description: () => 'Export logs to file' },
		{ key: 'P', description: () => 'Show/toggle runtime flags' },
		{ key: 'U', description: () => 'Show session indicators' },
		{ key: 'C', description: () => 'Clear terminal' },
		{ key: 'H', description: () => 'Show this help' }
	];

	#setupKeyListener() {
		if (!process.stdin?.isTTY) {
			return;
		}

		try {
			readline.emitKeypressEvents(process.stdin);

			this.#rl = readline.createInterface({ input: process.stdin });

			process.stdin.setRawMode(true);
			process.stdin.resume();

			this.#bindKeypress();
			console.log(color('Press H for keybindings.', 'gray'));
		} catch {
			// stdin not available
		}
	}

	#bindKeypress() {
		process.stdin.removeAllListeners('keypress');

		if (process.stdin.isTTY && !process.stdin.isRaw) {
			process.stdin.setRawMode(true);
		}

		process.stdin.resume();

		process.stdin.on('keypress', (_str, key) => {
			if (!key) {
				return;
			}

			if (key.name === 't' && !key.ctrl && !key.meta) {
				this.toggle();
			}

			if (key.name === 'l' && !key.ctrl && !key.meta) {
				this.loadHistory();
			}

			if (key.name === 'f' && !key.ctrl && !key.meta) {
				this.#toggleFollow();
			}

			if (key.name === 's' && !key.ctrl && !key.meta) {
				this.#showStats();
			}

			if (key.name === 'b' && !key.ctrl && !key.meta) {
				if (this.#skipSub) {
					console.log(color('Sub-bots disabled. B skipped.', 'gray'));
				} else {
					this.#showBots();
				}
			}

			if (key.name === 'm' && !key.ctrl && !key.meta) {
				this.#showMemory();
			}

			if (key.name === 'd' && !key.ctrl && !key.meta) {
				if (this.#skipSub) {
					console.log(color('Sub-bots disabled. D skipped.', 'gray'));
				} else {
					this.#dumpSubLogs();
				}
			}

			if (key.name === 'x' && !key.ctrl && !key.meta) {
				this.#exportLogs();
			}

			if (key.name === 'p' && !key.ctrl && !key.meta) {
				this.#showFlags().catch(() => {});
			}

			if (key.name === 'u' && !key.ctrl && !key.meta) {
				this.#showIndicators();
			}

			if (key.name === 'c' && !key.ctrl && !key.meta) {
				console.clear();
			}

			if (key.name === 'h' && !key.ctrl && !key.meta) {
				this.#showHelp();
			}

			if (key.ctrl && key.name === 'c') {
				this.destroy();
				process.exit(0);
			}
		});
	}

	#showHelp() {
		const lines = this.#keyBindings.map((b) => `  ${color(b.key, 'lilac')}  ${b.description()}`);

		console.log(color('\n── Keybindings ──', 'lilac'));
		console.log(lines.join('\n'));
		console.log(color('──────────────────\n', 'lilac'));
	}

	#showIndicators() {
		if (this.#loggers.size === 0) {
			console.log(color('No sessions registered.', 'gray'));
			return;
		}

		console.log(color('\n── Session Indicators ──', 'lilac'));

		for (const badge of this.#loggers.keys()) {
			const indicator = badge === 'MAIN' ? 'purple' : this.#subColor(badge);

			console.log(`  ${color('•', indicator)}  ${color(badge, 'white')}`);
		}

		console.log(color('────────────────────────\n', 'lilac'));
	}

	/** @param {string} badge */
	#subColor(badge) {
		const palette = ['cyan', 'green', 'pink', 'salmon', 'amber', 'teal', 'mint', 'coral', 'lime', 'sky'];
		let hash = 0;

		for (const char of badge) {
			hash = (hash << 5) - hash + char.charCodeAt(0);
			hash |= 0;
		}

		return palette[Math.abs(hash) % palette.length];
	}

	/** @param {string} badge */
	#logFilePath(badge) {
		return path.join(LOG_DIR, `${badge.replace(/[^a-zA-Z0-9_-]/g, '_')}.log`);
	}

	/**
	 * @param {string[]} candidates
	 * @returns {string | null}
	 */
	#findTerminal(candidates) {
		const { execSync } = require('node:child_process');

		for (const term of candidates) {
			try {
				execSync(`which ${term}`, { stdio: 'ignore' });
				return term;
			} catch {
				// not found, try next
			}
		}

		return null;
	}

	loadHistory() {
		const logPath = this.#logFilePath('MAIN');

		if (!fs.existsSync(logPath)) {
			console.log(color('No history logs found.', 'gray'));
			return;
		}

		try {
			const content = fs.readFileSync(logPath, 'utf-8').trim();

			if (!content) {
				console.log(color('Log file is empty.', 'gray'));
				return;
			}

			const lines = content.split('\n');
			const count = lines.length;

			console.log(color(`\n── History logs (${count} lines) ──`, 'lilac'));
			console.log(content);
			console.log(color(`── End of history ──\n`, 'lilac'));
		} catch (err) {
			console.log(color(`Failed to read log file: ${err.message}`, 'red'));
		}
	}

	#toggleFollow() {
		if (this.#following) {
			this.#stopFollow();
		} else {
			this.#startFollow();
		}
	}

	#startFollow() {
		const logPath = this.#logFilePath('MAIN');

		if (!fs.existsSync(logPath)) {
			console.log(color('No log file to follow.', 'gray'));
			return;
		}

		this.#following = true;
		console.log(color('Following logs in real-time... Press F again to stop.', 'lilac'));

		let size = 0;

		try {
			size = fs.statSync(logPath).size;
		} catch {
			// ignore
		}

		this.#followWatcher = fs.watch(logPath, () => {
			try {
				const newSize = fs.statSync(logPath).size;

				if (newSize > size) {
					const fd = fs.openSync(logPath, 'r');
					const buf = Buffer.alloc(newSize - size);

					fs.readSync(fd, buf, 0, buf.length, size);
					fs.closeSync(fd);
					process.stdout.write(buf.toString('utf-8'));
				}

				size = newSize;
			} catch {
				// file may have been rotated
			}
		});
	}

	#stopFollow() {
		this.#following = false;

		if (this.#followWatcher) {
			this.#followWatcher.close();
			this.#followWatcher = null;
		}

		console.log(color('Stopped following logs.', 'gray'));
	}

	#showStats() {
		const uptime = this.#formatUptime(process.uptime());
		const logPath = this.#logFilePath('MAIN');
		let logSize = '0 B';

		try {
			if (fs.existsSync(logPath)) {
				const bytes = fs.statSync(logPath).size;

				logSize = this.#formatBytes(bytes);
			}
		} catch {
			// ignore
		}

		const botCount = this.#loggers.size;
		const subCount = this.#loggers.size - (this.#loggers.has('MAIN') ? 1 : 0);
		const isPM2 = Boolean(process.env.pm_id || process.env.PM2_HOME);

		console.log(color('\n── Stats ──', 'lilac'));
		console.log(`  Uptime:      ${color(uptime, 'white')}`);
		console.log(`  Log file:    ${color(logSize, 'white')}`);
		console.log(`  Max log:     ${color(`${this.#maxLogBytes / 1024 / 1024} MB`, 'white')}`);
		console.log(`  Bots:        ${color(`${botCount} registered`, 'white')} (${color(`${subCount} sub`, 'gray')})`);
		console.log(`  Mode:        ${color(this.#mode, 'white')}`);
		console.log(`  Following:   ${color(this.#following ? 'yes' : 'no', 'white')}`);
		console.log(`  PM2:         ${color(isPM2 ? 'yes' : 'no', 'white')}`);
		console.log(`  Node:        ${color(process.version, 'white')}`);
		console.log(color('────────────\n', 'lilac'));
	}

	#showBots() {
		if (!this.#getBots) {
			console.log(color('Bot list unavailable.', 'gray'));
			return;
		}

		const bots = this.#getBots();

		if (bots.length === 0) {
			console.log(color('No bots registered.', 'gray'));
			return;
		}

		console.log(color('\n── Bots ──', 'lilac'));

		for (const bot of bots) {
			const icon = bot.state === 'connected' ? '🟢' : bot.state === 'connecting' ? '🟡' : '🔴';
			const phone = bot.phone ?? '-';
			const uptime = bot.uptime ?? '-';

			console.log(`  ${icon} ${color(bot.name, 'white')} (${phone}) — ${uptime}`);
		}

		console.log(color('──────────\n', 'lilac'));
	}

	#showMemory() {
		const mem = process.memoryUsage();

		console.log(color('\n── Memory ──', 'lilac'));
		console.log(`  Heap used:   ${color(this.#formatBytes(mem.heapUsed), 'white')}`);
		console.log(`  Heap total:  ${color(this.#formatBytes(mem.heapTotal), 'white')}`);
		console.log(`  RSS:         ${color(this.#formatBytes(mem.rss), 'white')}`);
		console.log(`  External:    ${color(this.#formatBytes(mem.external), 'white')}`);
		console.log(color('────────────\n', 'lilac'));
	}

	#dumpSubLogs() {
		const badges = [...this.#logFiles.keys()];

		if (badges.length === 0) {
			console.log(color('No sub-bot logs to dump.', 'gray'));
			return;
		}

		for (const badge of badges) {
			const logPath = this.#logFilePath(badge);

			if (!fs.existsSync(logPath)) {
				console.log(color(`\n── ${badge} (empty) ──`, 'gray'));
				continue;
			}

			try {
				const content = fs.readFileSync(logPath, 'utf-8').trim();

				if (!content) {
					console.log(color(`\n── ${badge} (empty) ──`, 'gray'));
					continue;
				}

				const lines = content.split('\n').length;

				console.log(color(`\n── ${badge} (${lines} lines) ──`, 'lilac'));
				console.log(content);
			} catch (err) {
				console.log(color(`\n── ${badge} (error: ${err.message}) ──`, 'red'));
			}
		}

		console.log(color('\n── End of sub-bot logs ──\n', 'lilac'));
	}

	#exportLogs() {
		const srcPath = this.#logFilePath('MAIN');

		if (!fs.existsSync(srcPath)) {
			console.log(color('No logs to export.', 'gray'));
			return;
		}

		const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
		const destPath = path.join(LOG_DIR, `MAIN-export-${timestamp}.log`);

		try {
			fs.copySync(srcPath, destPath);
			console.log(color(`Logs exported to: ${destPath}`, 'lilac'));
		} catch (err) {
			console.log(color(`Export failed: ${err.message}`, 'red'));
		}
	}

	async #showFlags() {
		if (!this.#getFlags || !this.#setFlag) {
			console.log(color('Flag toggling unavailable.', 'gray'));
			return;
		}

		const flags = this.#getFlags();
		const entries = Object.entries(flags);

		if (entries.length === 0) {
			console.log(color('No flags available.', 'gray'));
			return;
		}

		this.#prompting = true;

		try {
			const { checkbox } = await import('@inquirer/prompts');

			const checked = entries.filter(([, v]) => v).map(([k]) => k);

			const choices = entries.map(([name, value]) => ({
				name: `${name.padEnd(16)} ${value ? '(ON)' : '(OFF)'}`,
				value: name,
				checked: value
			}));

			const controller = new AbortController();
			const IDLE_MS = 15000;
			let idleTimer = null;

			const resetIdle = () => {
				if (idleTimer) {
					clearTimeout(idleTimer);
				}

				idleTimer = setTimeout(() => controller.abort(), IDLE_MS);
			};

			const onKey = () => resetIdle();

			process.stdin.on('keypress', onKey);
			resetIdle();

			const result = await checkbox(
				{
					message: 'Toggle runtime flags (space to toggle, enter to confirm)',
					choices,
					theme: { prefix: '✦' }
				},
				{ signal: controller.signal }
			).catch(() => null);

			process.stdin.removeListener('keypress', onKey);

			if (idleTimer) {
				clearTimeout(idleTimer);
			}

			const lines = entries.length + 2;

			process.stdout.write(`\x1b[${lines}A\x1b[0J`);

			if (!result) {
				console.log(color('Nothing changed.', 'gray'));
				return;
			}

			const resultSet = new Set(result);
			const changed = [];

			for (const [name] of entries) {
				const wasOn = checked.includes(name);
				const isOn = resultSet.has(name);

				if (wasOn !== isOn) {
					this.#setFlag(name, isOn);
					changed.push({ name, isOn });
				}
			}

			if (changed.length === 0) {
				console.log(color('Nothing changed.', 'gray'));
			} else {
				for (const { name, isOn } of changed) {
					console.log(color(`  ${name}: ${isOn ? 'ON' : 'OFF'}`, isOn ? 'green' : 'red'));
				}
			}
		} catch (err) {
			console.log(color(`Flag toggle failed: ${err.message}`, 'red'));
		} finally {
			this.#prompting = false;
			this.#bindKeypress();
		}
	}

	#formatUptime(seconds) {
		const d = Math.floor(seconds / 86400);
		const h = Math.floor((seconds % 86400) / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = Math.floor(seconds % 60);

		const parts = [];

		if (d > 0) {
			parts.push(`${d}d`);
		}

		if (h > 0) {
			parts.push(`${h}h`);
		}

		if (m > 0) {
			parts.push(`${m}m`);
		}

		parts.push(`${s}s`);
		return parts.join(' ');
	}

	#formatBytes(bytes) {
		if (bytes === 0) {
			return '0 B';
		}

		const units = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		const val = bytes / Math.pow(1024, i);

		return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
	}

	destroy() {
		this.#stopFollow();
		this.#killAllTerminals();

		if (this.#mainLogStream) {
			this.#mainLogStream.end();
			this.#mainLogStream = null;
		}

		for (const stream of this.#logFiles.values()) {
			stream.end();
		}

		this.#logFiles.clear();
		this.#loggers.clear();

		try {
			const scripts = fs.readdirSync(LOG_DIR).filter((f) => f.endsWith('-tail.ps1') || f.endsWith('-tail.cmd'));

			for (const f of scripts) {
				fs.removeSync(path.join(LOG_DIR, f));
			}
		} catch {
			// ignore
		}

		if (this.#rl) {
			this.#rl.close();
			this.#rl = null;
		}

		if (process.stdin?.isTTY && process.stdin.isRaw) {
			process.stdin.setRawMode(false);
		}
	}
}
