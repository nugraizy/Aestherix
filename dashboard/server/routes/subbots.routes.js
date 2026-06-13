import { Router } from 'express';

export function createSubBotsRouter({ services }) {
	const { subBots, audit, middleware } = services;
	const router = Router();

	router.get('/subbots', middleware.requireOwnerAuth, async (req, res) => {
		const result = await subBots.list();

		if (!result.ok) {
			return res.status(result.status || 503).json(result);
		}

		return res.json(result);
	});

	router.post('/subbots/:name/start', middleware.requireOwnerAuth, async (req, res) => {
		const session = req.dashboardSession;
		const name = String(req.params.name || '').trim();

		if (!name) {
			return res.status(400).json({ ok: false, message: 'Sub-bot name is required.' });
		}

		const result = await subBots.start(name);

		if (!result.ok) {
			audit.push({
				action: 'subbot.start',
				session,
				target: name,
				status: 'failed',
				message: result.message
			});
			return res.status(result.status || 500).json(result);
		}

		audit.push({
			action: 'subbot.start',
			session,
			target: name,
			message: 'Sub-bot start requested.'
		});

		return res.json(result);
	});

	router.post('/subbots/:name/stop', middleware.requireOwnerAuth, async (req, res) => {
		const session = req.dashboardSession;
		const name = String(req.params.name || '').trim();

		if (!name) {
			return res.status(400).json({ ok: false, message: 'Sub-bot name is required.' });
		}

		const result = await subBots.stop(name);

		if (!result.ok) {
			audit.push({
				action: 'subbot.stop',
				session,
				target: name,
				status: 'failed',
				message: result.message
			});
			return res.status(result.status || 500).json(result);
		}

		audit.push({
			action: 'subbot.stop',
			session,
			target: name,
			message: 'Sub-bot stop requested.'
		});

		return res.json(result);
	});

	router.patch('/subbots/:name/flags', middleware.requireOwnerAuth, async (req, res) => {
		const session = req.dashboardSession;
		const name = String(req.params.name || '').trim();

		if (!name) {
			return res.status(400).json({ ok: false, message: 'Sub-bot name is required.' });
		}

		const { flags } = req.body || {};

		if (!flags || typeof flags !== 'object') {
			return res.status(400).json({ ok: false, message: 'Flags object is required.' });
		}

		const result = await subBots.updateFlags(name, flags);

		if (!result.ok) {
			return res.status(result.status || 500).json(result);
		}

		audit.push({
			action: 'subbot.flags',
			session,
			target: name,
			message: 'Sub-bot flags updated.'
		});

		return res.json(result);
	});

	router.delete('/subbots/:name', middleware.requireOwnerAuth, async (req, res) => {
		const session = req.dashboardSession;
		const name = String(req.params.name || '').trim();

		if (!name) {
			return res.status(400).json({ ok: false, message: 'Sub-bot name is required.' });
		}

		const purge = req.query?.purge === '1' || req.query?.purge === 'true';
		const result = await subBots.remove(name, { purge });

		if (!result.ok) {
			audit.push({
				action: 'subbot.remove',
				session,
				target: name,
				status: 'failed',
				message: result.message
			});
			return res.status(result.status || 500).json(result);
		}

		audit.push({
			action: purge ? 'subbot.purge' : 'subbot.remove',
			session,
			target: name,
			message: purge ? 'Sub-bot purged.' : 'Sub-bot removed.'
		});

		return res.json(result);
	});

	return router;
}
