import { Router } from 'express';

const REDACTED_PAYLOAD = { lastId: 0, logs: [], redacted: true };

function isOwner(session) {
	return session?.role === 'owner';
}

export function createLogsRouter({ services }) {
	const { auth, monitor, botBridge, middleware } = services;
	const router = Router();

	function ownerOrRedact(req, res, handler) {
		const session = req.dashboardSession || auth.getSessionFromRequest(req);

		if (!isOwner(session)) {
			return res.json(REDACTED_PAYLOAD);
		}

		return handler(req, res);
	}

	router.get('/logs', middleware.requireDashboardAuth, (req, res) => {
		ownerOrRedact(req, res, () => {
			const since = Number(req.query?.since || 0);
			const limit = Number(req.query?.limit || 200);

			res.json(monitor.getLogs({ since, limit }));
		});
	});

	router.get('/logs/dashboard', middleware.requireDashboardAuth, (req, res) => {
		ownerOrRedact(req, res, () => {
			const since = Number(req.query?.since || 0);
			const limit = Number(req.query?.limit || 200);

			res.json(monitor.getLogs({ since, limit }));
		});
	});

	router.get('/logs/bot', middleware.requireDashboardAuth, (req, res) => {
		ownerOrRedact(req, res, async () => {
			const since = Number(req.query?.since || 0);
			const limit = Number(req.query?.limit || 200);
			const result = await botBridge.fetchBotLogs({ since, limit });

			if (!result.ok) {
				return res.status(result.status || 503).json({
					ok: false,
					message: result.message || 'Failed loading bot logs.',
					lastId: since,
					logs: []
				});
			}

			return res.json(result.data || { lastId: since, logs: [] });
		});
	});

	return router;
}
