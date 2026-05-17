import { Router } from 'express';
import { z } from 'zod';

import { validate } from '../middleware/validation.middleware.js';

const undoActionBody = z.object({
	token: z.string().min(12)
});

export function createActionsRouter({ services }) {
	const { audit, undo, botBridge, middleware } = services;
	const router = Router();

	router.post('/actions/undo', middleware.requireOwnerAuth, validate({ body: undoActionBody }), async (req, res) => {
		const session = req.dashboardSession;
		const result = await undo.apply(req.body.token);

		if (!result.ok) {
			return res.status(result.status || 400).json(result);
		}

		audit.push({
			action: `${result.kind}.undo`,
			session,
			target: result.target,
			message: 'Action reverted via undo.',
			after: result.state
		});

		return res.json(result);
	});

	router.post('/bot/restart', middleware.requireOwnerAuth, async (req, res) => {
		const session = req.dashboardSession;
		const result = await botBridge.requestBotRestart();

		if (!result.ok) {
			audit.push({
				action: 'bot.restart',
				session,
				target: 'bot',
				status: 'failed',
				message: result.message || 'Failed restarting bot.'
			});
			return res.status(result.status || 503).json({ ok: false, message: result.message || 'Failed restarting bot.' });
		}

		audit.push({
			action: 'bot.restart',
			session,
			target: 'bot',
			message: 'Bot restart triggered.'
		});

		return res.json({ ok: true, restarting: true });
	});

	return router;
}
