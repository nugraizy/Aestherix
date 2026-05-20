import { Router } from 'express';
import { z } from 'zod';

import { validate } from '../middleware/validation.middleware.js';

const undoActionBody = z.object({
	token: z.string().min(12)
});

export function createActionsRouter({ services }) {
	const { audit, undo, botBridge, lifecycle, middleware } = services;
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

	router.post('/bot/start', middleware.requireOwnerAuth, async (req, res) => {
		const session = req.dashboardSession;

		if (!lifecycle?.start) {
			return res.status(503).json({ ok: false, message: 'Lifecycle service unavailable.' });
		}

		const result = await lifecycle.start();

		if (!result.ok) {
			audit.push({
				action: 'bot.start',
				session,
				target: lifecycle.botPm2AppName,
				status: 'failed',
				message: result.message || 'Failed starting bot.'
			});
			return res.status(result.status || 500).json({ ok: false, message: result.message || 'Failed starting bot.' });
		}

		audit.push({
			action: 'bot.start',
			session,
			target: lifecycle.botPm2AppName,
			message: 'Bot start requested.'
		});

		return res.json({ ok: true, starting: true, app: lifecycle.botPm2AppName });
	});

	router.post('/bot/stop', middleware.requireSuperOwnerAuth, async (req, res) => {
		const session = req.dashboardSession;

		if (!lifecycle?.stop) {
			return res.status(503).json({ ok: false, message: 'Lifecycle service unavailable.' });
		}

		const result = await lifecycle.stop();

		if (!result.ok) {
			audit.push({
				action: 'bot.stop',
				session,
				target: lifecycle.botPm2AppName,
				status: 'failed',
				message: result.message || 'Failed stopping bot.'
			});
			return res.status(result.status || 500).json({ ok: false, message: result.message || 'Failed stopping bot.' });
		}

		audit.push({
			action: 'bot.stop',
			session,
			target: lifecycle.botPm2AppName,
			message: 'Bot stop requested.'
		});

		return res.json({ ok: true, stopping: true, app: lifecycle.botPm2AppName });
	});

	return router;
}
