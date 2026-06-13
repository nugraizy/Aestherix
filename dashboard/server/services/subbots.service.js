import prisma from '../../../src/helper/database/prisma.js';
import { manager } from '../../../src/core/manager.js';
import { getPm2SubBotStatuses } from '../../../src/core/pm2-helpers.js';
import { isBotEmbeddedHere } from '../lib/client.js';

export function createSubBotsService({ botBridge, monitor }) {
	function buildSubBot(row, pm2Statuses) {
		const inMemory = manager.get(row.sessionName);
		const flags = JSON.parse(row.flags || '{}');
		const pm2 = pm2Statuses?.get(row.sessionName);

		return {
			id: row.id,
			sessionName: row.sessionName,
			flags,
			role: row.role,
			pairNumber: row.pairNumber,
			isActive: row.isActive,
			connected: Boolean(inMemory?.state === 'connected' || pm2?.running),
			phone: inMemory?.phone || null,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt
		};
	}

	async function list() {
		if (isBotEmbeddedHere()) {
			try {
				const rows = await prisma.botInstance.findMany({ orderBy: { createdAt: 'asc' } });
				const pm2Statuses = await getPm2SubBotStatuses().catch(() => new Map());

				return { ok: true, subBots: rows.map((row) => buildSubBot(row, pm2Statuses)) };
			} catch (error) {
				return { ok: false, message: error?.message || 'Failed to fetch sub-bots.' };
			}
		}

		const result = await botBridge.listSubBots();

		if (!result.ok) {
			return { ok: false, message: result.message || 'Failed to fetch sub-bots.' };
		}

		return { ok: true, subBots: result.data?.subBots || [] };
	}

	async function start(name) {
		if (isBotEmbeddedHere()) {
			try {
				const { startPm2SubBot } = await import('../../../src/core/pm2-helpers.js');
				const row = await prisma.botInstance.findUnique({ where: { sessionName: name } });

				if (!row) {
					return { ok: false, status: 404, message: `Sub-bot "${name}" not found.` };
				}

				await prisma.botInstance.update({ where: { sessionName: name }, data: { isActive: true } });
				await startPm2SubBot(name);

				return { ok: true, sessionName: name };
			} catch (error) {
				return { ok: false, message: error?.message || 'Failed to start sub-bot.' };
			}
		}

		const result = await botBridge.startSubBot(name);

		if (!result.ok) {
			return { ok: false, message: result.message || 'Failed to start sub-bot.' };
		}

		return { ok: true, sessionName: name };
	}

	async function stop(name) {
		if (isBotEmbeddedHere()) {
			try {
				const { stopPm2SubBot } = await import('../../../src/core/pm2-helpers.js');
				const row = await prisma.botInstance.findUnique({ where: { sessionName: name } });

				if (!row) {
					return { ok: false, status: 404, message: `Sub-bot "${name}" not found.` };
				}

				manager.remove(name);
				await stopPm2SubBot(name);

				return { ok: true, sessionName: name };
			} catch (error) {
				return { ok: false, message: error?.message || 'Failed to stop sub-bot.' };
			}
		}

		const result = await botBridge.stopSubBot(name);

		if (!result.ok) {
			return { ok: false, message: result.message || 'Failed to stop sub-bot.' };
		}

		return { ok: true, sessionName: name };
	}

	async function updateFlags(name, flags) {
		if (isBotEmbeddedHere()) {
			try {
				const row = await prisma.botInstance.findUnique({ where: { sessionName: name } });

				if (!row) {
					return { ok: false, status: 404, message: `Sub-bot "${name}" not found.` };
				}

				await prisma.botInstance.update({
					where: { sessionName: name },
					data: { flags: JSON.stringify(flags) }
				});

				return { ok: true, sessionName: name, flags };
			} catch (error) {
				return { ok: false, message: error?.message || 'Failed to update flags.' };
			}
		}

		const result = await botBridge.updateSubBotFlags(name, flags);

		if (!result.ok) {
			return { ok: false, message: result.message || 'Failed to update flags.' };
		}

		return { ok: true, sessionName: name, flags };
	}

	async function remove(name, { purge = false } = {}) {
		if (isBotEmbeddedHere()) {
			try {
				const row = await prisma.botInstance.findUnique({ where: { sessionName: name } });

				if (!row) {
					return { ok: false, status: 404, message: `Sub-bot "${name}" not found.` };
				}

				manager.remove(name);

				const { stopPm2SubBot } = await import('../../../src/core/pm2-helpers.js');

				await stopPm2SubBot(name).catch(() => {});

				if (purge) {
					await prisma.botInstance.delete({ where: { sessionName: name } });
				} else {
					await prisma.botInstance.update({ where: { sessionName: name }, data: { isActive: false } });
				}

				return { ok: true, sessionName: name, purged: purge };
			} catch (error) {
				return { ok: false, message: error?.message || 'Failed to remove sub-bot.' };
			}
		}

		const result = await botBridge.removeSubBot(name, { purge });

		if (!result.ok) {
			return { ok: false, message: result.message || 'Failed to remove sub-bot.' };
		}

		return { ok: true, sessionName: name, purged: purge };
	}

	async function getLogs(name, { since = 0, limit = 200 } = {}) {
		if (isBotEmbeddedHere()) {
			try {
				const allLogs = monitor.getLogs({ since, limit: 500 });
				const badge = `[SUB-${name}]`;
				const filtered = (allLogs.logs || []).filter((entry) => entry.message?.includes(badge));

				return { ok: true, lastId: allLogs.lastId, logs: filtered.slice(-limit) };
			} catch (error) {
				return { ok: false, message: error?.message || 'Failed to read sub-bot logs.' };
			}
		}

		return botBridge.fetchSubBotLogs(name, { since, limit });
	}

	return { list, start, stop, updateFlags, remove, getLogs };
}
