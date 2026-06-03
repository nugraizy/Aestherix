import { Router } from 'express';
import { z } from 'zod';

import { solverManager } from '../../../src/utils/modules/solver-manager.js';
import { validate } from '../middleware/validation.middleware.js';

const testBody = z
	.object({
		url: z.string().url().optional(),
		label: z.string().min(1).optional()
	})
	.optional();

const sessionParams = z.object({
	id: z.string().min(1)
});

const claimBody = z.object({
	userId: z.string().min(1).optional()
});

const registerBody = z.object({
	url: z.string().url(),
	service: z.string().min(1),
	headers: z.record(z.string()).optional()
});

export function createManualSolveRouter({ services }) {
	const { manualSolve, solverCache, middleware, bridgeToken } = services;
	const router = Router();

	function requireBridgeToken(req, res, next) {
		const token = String(req.headers['x-dashboard-bridge-token'] || '');

		if (!token || token !== bridgeToken) {
			return res.status(401).json({ ok: false, message: 'Unauthorized bridge token.' });
		}

		next();
	}

	router.get('/manual-solve/challenges', (_req, res) => {
		res.json({ challenges: solverManager.listChallenges() });
	});

	router.get('/manual-solve/challenges/:id', validate({ params: sessionParams }), (req, res) => {
		const challenge = solverManager.getChallenge(req.params.id);

		if (!challenge) {
			return res.status(404).json({ ok: false, message: 'Challenge not found.' });
		}

		res.json({
			ok: true,
			challenge: {
				id: challenge.id,
				url: challenge.url,
				service: challenge.service,
				status: challenge.status,
				claimedBy: challenge.claimedBy,
				sessionId: challenge.sessionId,
				createdAt: challenge.createdAt,
				solvedAt: challenge.solvedAt,
				cookies: challenge.cookies,
				headers: challenge.headers,
				solveUrl: challenge.solveUrl
			}
		});
	});

	router.post('/manual-solve/register', requireBridgeToken, validate({ body: registerBody }), async (req, res) => {
		try {
			const result = await solverManager.registerChallenge({
				url: req.body.url,
				service: req.body.service,
				headers: req.body.headers || {}
			});

			res.json({ ok: true, ...result });
		} catch (error) {
			res.status(500).json({ ok: false, message: error.message });
		}
	});

	router.post('/manual-solve/challenges/:id/solved', requireBridgeToken, validate({ params: sessionParams }), async (req, res) => {
		const { cookies, headers } = req.body || {};

		await solverManager.solveChallenge(req.params.id, cookies, headers);

		res.json({ ok: true });
	});

	router.post('/manual-solve/challenges/:id/failed', requireBridgeToken, validate({ params: sessionParams }), async (req, res) => {
		const reason = req.body?.reason || 'remote';

		await solverManager.failChallenge(req.params.id, reason);

		res.json({ ok: true });
	});

	router.get('/manual-solve/history', (req, res) => {
		const limit = Number(req.query.limit) || 50;
		const status = req.query.status || undefined;
		const service = req.query.service || undefined;

		const history = solverCache?.getHistory({ limit, status, service }) || [];

		res.json({ history });
	});

	router.post('/manual-solve/challenges/:id/claim', validate({ params: sessionParams, body: claimBody }), async (req, res) => {
		const result = await solverManager.claimChallenge(req.params.id, req.body?.userId);

		if (!result.ok) {
			return res.status(result.message === 'Challenge not found.' ? 404 : 409).json(result);
		}

		res.json(result);
	});

	router.post('/manual-solve/challenges/:id/manual-solve', validate({ params: sessionParams }), async (req, res) => {
		const result = await solverManager.manualSolveChallenge(req.params.id);

		if (!result.ok) {
			return res.status(400).json(result);
		}

		res.json(result);
	});

	router.get('/manual-solve/sessions', middleware.requireDashboardAuth, (_req, res) => {
		res.json({ sessions: manualSolve.listSessions() });
	});

	router.post('/manual-solve/test', middleware.requireOwnerAuth, validate({ body: testBody }), async (req, res) => {
		const session = await manualSolve.startTestSession({
			url: req.body?.url,
			label: req.body?.label
		});

		res.json({ session, sessions: manualSolve.listSessions() });
	});

	router.post('/manual-solve/:id/stop', middleware.requireOwnerAuth, validate({ params: sessionParams }), async (req, res) => {
		const result = await manualSolve.stopSession(req.params.id);

		if (!result.ok) {
			return res.status(404).json(result);
		}

		res.json(result);
	});

	return router;
}
