import { Router } from 'express';
import { z } from 'zod';

import { color, loggers } from '../../../src/utils/modules/index.js';
import { validate } from '../middleware/validation.middleware.js';
import { rateLimit } from '../middleware/rate-limit.middleware.js';

const otpRateLimit = rateLimit({ windowMs: 60_000, maxRequests: 5, message: 'Too many code requests. Wait 60 seconds.' });

const authRequestBody = z.object({
	phoneNumber: z.string().min(5)
});

const confirmationStatusBody = z.object({
	phoneNumber: z.string().min(5),
	requestId: z.string().min(10),
	requestKey: z.string().min(10)
});

const finalizeConfirmationBody = z.object({
	requestId: z.string().min(10),
	requestKey: z.string().min(10)
});

const viewerLoginBody = z.object({
	name: z.string().max(60).optional()
});

export function createAuthRouter({ services }) {
	const { auth, middleware } = services;
	const router = Router();

	router.post('/auth/request-code', otpRateLimit, validate({ body: authRequestBody }), async (req, res) => {
		try {
			const result = await auth.issueOtp({ phoneNumber: req.body.phoneNumber });

			if (!result.ok) {
				return res.status(result.status || 400).json({ ok: false, message: result.message });
			}

			res.json({
				ok: true,
				message: result.message,
				requestId: result.requestId,
				requestKey: result.requestKey
			});
		} catch (error) {
			loggers.error(color('Failed to send dashboard confirmation:', 'red'), color(error.message, 'white'));
			res.status(500).json({ ok: false, message: 'Failed to send code. Try again.' });
		}
	});

	router.post('/auth/confirmation-status', validate({ body: confirmationStatusBody }), async (req, res) => {
		const result = await auth.getConfirmationStatus({
			phoneNumber: req.body.phoneNumber,
			requestId: req.body.requestId,
			requestKey: req.body.requestKey
		});

		if (!result.ok) {
			return res.status(result.status || 400).json({ ok: false, message: result.message || 'Request failed.' });
		}

		return res.json({ ok: true, status: result.status || 'pending' });
	});

	router.post('/auth/finalize-confirmation', validate({ body: finalizeConfirmationBody }), async (req, res) => {
		const result = await auth.finalizeConfirmation({
			requestId: req.body.requestId,
			requestKey: req.body.requestKey,
			res
		});

		if (!result.ok) {
			return res.status(result.status || 400).json({ ok: false, message: result.message });
		}

		return res.json({ ok: true });
	});

	router.post('/auth/viewer-login', rateLimit({ windowMs: 60_000, maxRequests: 10, message: 'Too many login attempts. Wait 60 seconds.' }), validate({ body: viewerLoginBody }), (req, res) => {
		const result = auth.issueViewerSession({ name: req.body?.name, res });

		res.json(result);
	});
	router.post('/auth/group-admin-login', otpRateLimit, validate({ body: z.object({ phoneNumber: z.string().min(5) }) }), async (req, res) => {
		const phoneNumber = String(req.body.phoneNumber).trim().replace(/\D/g, '');
		const groups = await services.groups.getGroupsForAdmin(phoneNumber);

		if (!groups.length) {
			return res.status(403).json({ ok: false, message: 'This number is not an admin of any bot group.' });
		}

		try {
			const result = await auth.issueOtp({ phoneNumber, role: 'groupAdmin' });

			if (!result.ok) {
				return res.status(result.status || 400).json({ ok: false, message: result.message });
			}

			res.json({
				ok: true,
				message: result.message,
				requestId: result.requestId,
				requestKey: result.requestKey
			});
		} catch (error) {
			res.status(500).json({ ok: false, message: 'Failed to send confirmation.' });
		}
	});

	router.post('/auth/group-admin-finalize', validate({ body: z.object({ requestId: z.string().min(10), requestKey: z.string().min(10) }) }), async (req, res) => {
		const result = await auth.finalizeGroupAdminConfirmation({
			requestId: req.body.requestId,
			requestKey: req.body.requestKey,
			res
		});

		if (!result.ok) {
			return res.status(result.status || 400).json({ ok: false, message: result.message });
		}

		res.json({ ok: true });
	});

	router.get('/auth/session', (req, res) => {
		const session = auth.getSessionFromRequest(req);

		res.json({
			ok: true,
			authenticated: Boolean(session),
			phoneNumber: session?.phoneNumber || null,
			role: session?.role || null,
			name: session?.name || null
		});
	});

	router.get('/auth/sessions', middleware.requireSuperOwnerAuth, (_req, res) => {
		res.json({ sessions: auth.listSessions() });
	});

	router.post('/auth/sessions/:id/revoke', middleware.requireSuperOwnerAuth, (req, res) => {
		const result = auth.revokeSession(req.params.id);

		res.json(result);
	});

	router.post('/auth/logout', async (req, res) => {
		await auth.logout({ req, res });
		res.json({ ok: true });
	});

	return router;
}
