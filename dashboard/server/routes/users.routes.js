import { Router } from 'express';
import { z } from 'zod';

import { color, loggers } from '../../../src/utils/modules/index.js';
import { isWaConnectedHere } from '../lib/client.js';
import { validate } from '../middleware/validation.middleware.js';
import { UNDO_WINDOW_LONG_MS, UNDO_WINDOW_MEDIUM_MS } from '../services/undo.service.js';

const userIdParams = z.object({ userId: z.string().min(3) });
const userLimitBody = z.object({ limit: z.number().int().min(0) });
const userToggleBody = z.object({ enabled: z.boolean() });

async function maybeRuntimeSync({ botBridge, type, payload }) {
	if (isWaConnectedHere()) {
		return { ok: true };
	}

	return botBridge.sendRuntimeSync({ type, payload });
}

export function createUsersRouter({ services, configuration }) {
	const { audit, users, undo, botBridge, middleware } = services;
	const router = Router();

	router.get('/users', middleware.requireDashboardAuth, async (req, res) => {
		const session = req.dashboardSession || services.auth.getSessionFromRequest(req);
		const list = await users.list({ redactNumbers: session?.role !== 'owner' });

		res.json({ count: list.length, users: list });
	});

	router.post(
		'/users/:userId/limit',
		middleware.requireOwnerAuth,
		validate({ params: userIdParams, body: userLimitBody }),
		async (req, res) => {
			const session = req.dashboardSession;
			const normalized = users.normalizeUserJid(req.params.userId);
			const before = normalized ? await users.readState(normalized).catch(() => null) : null;
			const result = await users.setLimit(req.params.userId, req.body.limit);

			if (!result.ok) {
				audit.push({
					action: 'user.limit',
					session,
					target: req.params.userId,
					status: 'failed',
					message: result.message,
					after: { limit: req.body.limit }
				});
				return res.status(400).json(result);
			}

			const sync = await maybeRuntimeSync({
				botBridge,
				type: 'user.limit',
				payload: { userId: result.user.id, limit: result.user.limit }
			});

			if (!sync.ok) {
				return res.status(sync.status || 503).json({ ok: false, message: sync.message });
			}

			audit.push({
				action: 'user.limit',
				session,
				target: result.user.id,
				before: before ? { limit: before.limit } : null,
				after: { limit: result.user.limit }
			});

			const undoToken =
				before && Number(before.limit) !== Number(result.user.limit)
					? undo.register({
							kind: 'user.limit',
							target: result.user.id,
							before: { limit: Number(before.limit || 0) },
							actionLabel: 'Undo Limit',
							ttlMs: UNDO_WINDOW_MEDIUM_MS,
							risk: 'medium'
						})
					: null;

			loggers.info(
				color('Dashboard changed user limit:', 'white'),
				color(result.user.id, 'lilac'),
				color('=>', 'white'),
				color(String(result.user.limit), 'green')
			);

			res.json({ ok: true, user: result.user, undo: undoToken });
		}
	);

	router.post(
		'/users/:userId/premium',
		middleware.requireOwnerAuth,
		validate({ params: userIdParams, body: userToggleBody }),
		async (req, res) => {
			const session = req.dashboardSession;
			const normalized = users.normalizeUserJid(req.params.userId);
			const before = normalized ? await users.readState(normalized).catch(() => null) : null;
			const result = await users.setPremium(req.params.userId, req.body.enabled);

			if (!result.ok) {
				audit.push({
					action: 'user.premium',
					session,
					target: req.params.userId,
					status: 'failed',
					message: result.message,
					after: { enabled: req.body.enabled }
				});
				return res.status(400).json(result);
			}

			const sync = await maybeRuntimeSync({
				botBridge,
				type: 'user.premium',
				payload: { userId: result.user.id, enabled: result.user.role === 'PREMIUM' }
			});

			if (!sync.ok) {
				return res.status(sync.status || 503).json({ ok: false, message: sync.message });
			}

			audit.push({
				action: 'user.premium',
				session,
				target: result.user.id,
				before: before ? { premium: before.role === 'PREMIUM' } : null,
				after: { premium: result.user.role === 'PREMIUM' }
			});

			const previousPremium = before?.role === 'PREMIUM';
			const nextPremium = result.user.role === 'PREMIUM';
			const undoToken =
				before && previousPremium !== nextPremium
					? undo.register({
							kind: 'user.premium',
							target: result.user.id,
							before: { premium: previousPremium },
							actionLabel: 'Undo Role',
							ttlMs: UNDO_WINDOW_LONG_MS,
							risk: 'high'
						})
					: null;

			loggers.info(
				color('Dashboard changed user role:', 'white'),
				color(result.user.id, 'lilac'),
				color('=>', 'white'),
				color(result.user.role, result.user.role === 'PREMIUM' ? 'green' : 'red')
			);

			res.json({ ok: true, user: result.user, undo: undoToken });
		}
	);

	router.post(
		'/users/:userId/banned',
		middleware.requireOwnerAuth,
		validate({ params: userIdParams, body: userToggleBody }),
		async (req, res) => {
			const session = req.dashboardSession;
			const normalized = users.normalizeUserJid(req.params.userId);
			const bannedList = await users.getBannedList();
			const beforeBanned = normalized ? bannedList.includes(normalized) : null;
			const result = await users.setBanned(req.params.userId, req.body.enabled);

			if (!result.ok) {
				audit.push({
					action: 'user.banned',
					session,
					target: req.params.userId,
					status: 'failed',
					message: result.message,
					after: { banned: req.body.enabled }
				});
				return res.status(400).json(result);
			}

			const sync = await maybeRuntimeSync({
				botBridge,
				type: 'user.banned',
				payload: { userId: result.userId, enabled: result.banned }
			});

			if (!sync.ok) {
				return res.status(sync.status || 503).json({ ok: false, message: sync.message });
			}

			audit.push({
				action: 'user.banned',
				session,
				target: result.userId,
				before: beforeBanned === null ? null : { banned: beforeBanned },
				after: { banned: result.banned }
			});

			const undoToken =
				typeof beforeBanned === 'boolean' && beforeBanned !== result.banned
					? undo.register({
							kind: 'user.banned',
							target: result.userId,
							before: { banned: beforeBanned },
							actionLabel: 'Undo Ban',
							ttlMs: UNDO_WINDOW_LONG_MS,
							risk: 'high'
						})
					: null;

			loggers.info(
				color('Dashboard changed user banned state:', 'white'),
				color(result.userId, 'lilac'),
				color('=>', 'white'),
				color(result.banned ? 'banned' : 'unbanned', result.banned ? 'red' : 'green')
			);

			res.json({ ok: true, userId: result.userId, banned: result.banned, undo: undoToken });
		}
	);

	router.post(
		'/users/:userId/blocked',
		middleware.requireOwnerAuth,
		validate({ params: userIdParams, body: userToggleBody }),
		async (req, res) => {
			const session = req.dashboardSession;
			const normalized = users.normalizeUserJid(req.params.userId);
			const beforeBlocked = normalized
				? Array.isArray(configuration.blocklist) && configuration.blocklist.includes(normalized)
				: null;
			const result = await users.setBlocked(req.params.userId, req.body.enabled);

			if (!result.ok) {
				audit.push({
					action: 'user.blocked',
					session,
					target: req.params.userId,
					status: 'failed',
					message: result.message,
					after: { blocked: req.body.enabled }
				});
				return res.status(result.status || 400).json(result);
			}

			if (!isWaConnectedHere() || result.pendingSync) {
				const sync = await botBridge.sendRuntimeSync({
					type: 'user.blocked',
					payload: { userId: result.userId, enabled: result.blocked }
				});

				if (!sync.ok) {
					return res.status(sync.status || 503).json({ ok: false, message: sync.message });
				}

				result.liveApplied = true;
				result.pendingSync = false;
			}

			audit.push({
				action: 'user.blocked',
				session,
				target: result.userId,
				before: beforeBlocked === null ? null : { blocked: beforeBlocked },
				after: { blocked: result.blocked }
			});

			const undoToken =
				typeof beforeBlocked === 'boolean' && beforeBlocked !== result.blocked
					? undo.register({
							kind: 'user.blocked',
							target: result.userId,
							before: { blocked: beforeBlocked },
							actionLabel: 'Undo Block',
							ttlMs: UNDO_WINDOW_LONG_MS,
							risk: 'high'
						})
					: null;

			loggers.info(
				color('Dashboard changed user block state:', 'white'),
				color(result.userId, 'lilac'),
				color('=>', 'white'),
				color(result.blocked ? 'blocked' : 'unblocked', result.blocked ? 'red' : 'green')
			);

			res.json({
				ok: true,
				userId: result.userId,
				blocked: result.blocked,
				liveApplied: result.liveApplied,
				pendingSync: result.pendingSync,
				undo: undoToken
			});
		}
	);

	return router;
}
