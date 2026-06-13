import { Router } from 'express';
import { z } from 'zod';

import { color, loggers } from '../../../src/utils/modules/index.js';
import { isWaConnectedHere } from '../lib/client.js';
import { validate } from '../middleware/validation.middleware.js';
import { UNDO_WINDOW_SHORT_MS } from '../services/undo.service.js';

const flagToggleBody = z.object({
	enabled: z.boolean()
});

const flagNameParams = z.object({
	flagName: z.string().min(1)
});

export function createFlagsRouter({ services }) {
	const { audit, monitor, undo, botBridge, middleware } = services;
	const router = Router();

	router.get('/flags', middleware.requireDashboardAuth, (_req, res) => {
		const flags = monitor.listFlags();

		res.json({ count: flags.length, flags });
	});

	router.post(
		'/flags/:flagName',
		middleware.requireOwnerAuth,
		validate({ params: flagNameParams, body: flagToggleBody }),
		async (req, res) => {
			const { flagName } = req.params;
			const enabled = Boolean(req.body?.enabled);
			const session = req.dashboardSession;
			const previousState = monitor.listFlags().find((item) => item.name === flagName) || null;
			const result = await monitor.setFlagState(flagName, enabled);

			if (!result.ok) {
				audit.push({
					action: 'flag.toggle',
					session,
					target: flagName,
					status: 'failed',
					message: result.message || 'Flag not found.',
					after: { enabled }
				});
				return res.status(404).json(result);
			}

			const hasLiveClient = isWaConnectedHere();

			if (!hasLiveClient) {
				const runtimeSync = await botBridge.sendRuntimeSync({
					type: 'flag.toggle',
					payload: { flagName, enabled }
				});

				if (!runtimeSync.ok) {
					return res.status(runtimeSync.status || 503).json({ ok: false, message: runtimeSync.message });
				}
			}

			audit.push({
				action: 'flag.toggle',
				session,
				target: flagName,
				before: previousState ? { enabled: Boolean(previousState.enabled) } : null,
				after: { enabled }
			});

			const undoToken =
				previousState && typeof previousState.enabled === 'boolean' && previousState.enabled !== enabled
					? undo.register({
							kind: 'flag.toggle',
							target: flagName,
							before: { enabled: Boolean(previousState.enabled) },
							actionLabel: 'Undo Toggle',
							ttlMs: UNDO_WINDOW_SHORT_MS,
							risk: 'low'
						})
					: null;

			loggers.info(
				color('Dashboard changed flag state:', 'white'),
				color(flagName, 'lilac'),
				color('→', 'white'),
				color(enabled ? 'enabled' : 'disabled', enabled ? 'green' : 'red')
			);

			res.json({ ok: true, flagName, enabled, undo: undoToken });
		}
	);

	return router;
}
