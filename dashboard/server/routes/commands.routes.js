import { Router } from 'express';
import { z } from 'zod';

import { color, loggers } from '../../../src/utils/modules/index.js';
import { isWaConnectedHere } from '../lib/client.js';
import { validate } from '../middleware/validation.middleware.js';
import { UNDO_WINDOW_SHORT_MS } from '../services/undo.service.js';

const commandToggleBody = z.object({
	enabled: z.boolean()
});

const commandNameParams = z.object({
	commandName: z.string().min(1)
});

export function createCommandsRouter({ services, configuration }) {
	const { audit, monitor, undo, botBridge, middleware } = services;
	const router = Router();

	router.get('/commands', middleware.requireDashboardAuth, (_req, res) => {
		const commands = monitor.listCommands();

		res.json({ count: commands.length, commands });
	});

	router.post(
		'/commands/:commandName',
		middleware.requireOwnerAuth,
		validate({ params: commandNameParams, body: commandToggleBody }),
		async (req, res) => {
			const { commandName } = req.params;
			const enabled = Boolean(req.body?.enabled);
			const session = req.dashboardSession;
			const previousState = monitor.listCommands().find((item) => item.name === commandName) || null;
			const result = await monitor.setCommandState(commandName, enabled);

			if (!result.ok) {
				audit.push({
					action: 'command.toggle',
					session,
					target: commandName,
					status: 'failed',
					message: result.message || 'Command not found.',
					after: { enabled }
				});
				return res.status(404).json(result);
			}

			const hasLiveClient = isWaConnectedHere();

			if (!hasLiveClient) {
				const runtimeSync = await botBridge.sendRuntimeSync({
					type: 'command.toggle',
					payload: { commandName, enabled }
				});

				if (!runtimeSync.ok) {
					return res.status(runtimeSync.status || 503).json({ ok: false, message: runtimeSync.message });
				}
			}

			audit.push({
				action: 'command.toggle',
				session,
				target: commandName,
				before: previousState ? { enabled: Boolean(previousState.enabled) } : null,
				after: { enabled }
			});

			const undoToken =
				previousState && typeof previousState.enabled === 'boolean' && previousState.enabled !== enabled
					? undo.register({
							kind: 'command.toggle',
							target: commandName,
							before: { enabled: Boolean(previousState.enabled) },
							actionLabel: 'Undo Toggle',
							ttlMs: UNDO_WINDOW_SHORT_MS,
							risk: 'low'
						})
					: null;

			loggers.info(
				color('Dashboard changed command state:', 'white'),
				color(commandName, 'lilac'),
				color('=>', 'white'),
				color(enabled ? 'enabled' : 'disabled', enabled ? 'green' : 'red')
			);

			res.json({ ok: true, commandName, enabled, undo: undoToken });
		}
	);

	return router;
}
