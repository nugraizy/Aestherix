import { Router } from 'express';

export function createAuditRouter({ services }) {
	const { audit, middleware } = services;
	const router = Router();

	router.get('/audit', middleware.requireOwnerAuth, (req, res) => {
		const since = Number(req.query?.since || 0);
		const limit = Number(req.query?.limit || 200);
		const action = String(req.query?.action || '');
		const role = String(req.query?.role || '');
		const query = String(req.query?.query || '');

		res.json(audit.list({ since, limit, action, role, query }));
	});

	return router;
}
