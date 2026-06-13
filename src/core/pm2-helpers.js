import fs from 'fs-extra';
import pm2 from 'pm2';

export const IS_PM2 = Boolean(process.env.pm_id);

function pm2Connect() {
	return new Promise((resolve, reject) => {
		pm2.connect((err) => {
			if (err) {
				reject(new Error(`PM2 connect failed: ${err.message || err}`));
				return;
			}

			resolve();
		});
	});
}

function pm2List() {
	return new Promise((resolve, reject) => {
		pm2.list((err, list) => {
			if (err) {
				reject(err);
				return;
			}

			resolve(list);
		});
	});
}

function pm2Disconnect() {
	try {
		pm2.disconnect();
	} catch {
		// Ignore
	}
}

function pm2Delete(name) {
	return new Promise((resolve) => {
		pm2.delete(name, () => resolve());
	});
}

function pm2Start(options) {
	return new Promise((resolve, reject) => {
		pm2.start(options, (err) => {
			if (err) {
				reject(new Error(`PM2 start failed: ${err.message || err}`));
				return;
			}

			resolve();
		});
	});
}

export async function isPm2SubBotRunning(sessionName) {
	const name = `aestherix-sub-${sessionName}`;

	try {
		await pm2Connect();
		const list = await pm2List();
		const proc = list.find((p) => p.name === name);

		return Boolean(proc && proc.pm2_env?.status === 'online');
	} catch {
		return false;
	} finally {
		pm2Disconnect();
	}
}

export async function getPm2SubBotStatuses() {
	const statuses = new Map();

	try {
		await pm2Connect();
		const list = await pm2List();

		for (const proc of list) {
			if (proc.name?.startsWith('aestherix-sub-')) {
				const sessionName = proc.name.replace('aestherix-sub-', '');

				statuses.set(sessionName, {
					running: proc.pm2_env?.status === 'online',
					pm2Status: proc.pm2_env?.status || 'unknown',
					pid: proc.pid
				});
			}
		}
	} catch {
		// PM2 not available
	} finally {
		pm2Disconnect();
	}

	return statuses;
}

export async function getPm2SubBotLogs(sessionName, { since = 0, limit = 200 } = {}) {
	const name = `aestherix-sub-${sessionName}`;
	const safeLimit = Math.max(1, Math.min(500, Number(limit) || 200));
	const safeSince = Number(since) || 0;

	try {
		await pm2Connect();
		const list = await pm2List();
		const proc = list.find((p) => p.name === name);

		if (!proc) {
			return { ok: false, message: `Sub-bot "${sessionName}" not found in PM2.` };
		}

		const logPath = proc.pm2_env?.pm_out_log_path;

		if (!logPath) {
			return { ok: true, lastId: 0, logs: [] };
		}

		const content = await fs.readFile(logPath, 'utf8').catch(() => '');
		const lines = content.split('\n').filter(Boolean);
		const entries = lines.map((line, i) => ({
			id: i + 1,
			timestamp: Date.now(),
			level: 'info',
			message: line
		}));

		const filtered = entries.filter((e) => e.id > safeSince);
		const logs = filtered.slice(-safeLimit);

		return { ok: true, lastId: entries.length, logs };
	} catch (error) {
		return { ok: false, message: error?.message || 'Failed to read sub-bot logs.' };
	} finally {
		pm2Disconnect();
	}
}

export async function startPm2SubBot(sessionName) {
	const name = `aestherix-sub-${sessionName}`;

	try {
		await pm2Connect();

		const list = await pm2List();
		const existing = list.find((p) => p.name === name);

		if (existing) {
			await pm2Delete(name);
		}

		await pm2Start({
			script: './subbot.js',
			name,
			args: sessionName,
			autorestart: false,
			env: {
				NODE_ENV: 'production',
				SUB_BOT_PROCESS: '1'
			}
		});
	} finally {
		pm2Disconnect();
	}
}

export async function stopPm2SubBot(sessionName) {
	const name = `aestherix-sub-${sessionName}`;

	try {
		await pm2Connect();
		await pm2Delete(name);
	} finally {
		pm2Disconnect();
	}
}

export async function sendToPm2SubBots(message) {
	try {
		await pm2Connect();

		const list = await pm2List();
		const subBots = list.filter((p) => p.name?.startsWith('aestherix-sub-'));

		for (const bot of subBots) {
			try {
				await new Promise((resolve, reject) => {
					pm2.sendDataToProcessId(bot.pm_id, message, (err) => {
						if (err) {
							reject(err);
							return;
						}

						resolve();
					});
				});
			} catch {
				// Sub-bot may have disconnected; ignore
			}
		}
	} finally {
		pm2Disconnect();
	}
}
