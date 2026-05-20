import { Router } from 'express';
import { z } from 'zod';

import { color, loggers } from '../../../src/utils/modules/index.js';
import { getEmbeddedWaClient } from '../lib/client.js';
import { validate } from '../middleware/validation.middleware.js';
import { rateLimit } from '../middleware/rate-limit.middleware.js';

const sendMessageBody = z.object({
	jid: z.string().min(5),
	message: z.string().min(1).max(4096),
	quoted: z.string().optional()
});

const sendRateLimit = rateLimit({ windowMs: 60_000, maxRequests: 30, message: 'Too many messages. Slow down.' });

export function createQuickActionsRouter({ services }) {
	const { audit, middleware } = services;
	const router = Router();

	router.post('/quick-send', sendRateLimit, middleware.requireOwnerAuth, validate({ body: sendMessageBody }), async (req, res) => {
		const session = req.dashboardSession;
		const { jid, message } = req.body;
		const client = getEmbeddedWaClient();

		if (!client) {
			return res.status(503).json({ ok: false, message: 'WhatsApp client is not connected.' });
		}

		try {
			await client.send(jid, { text: message });

			audit.push({
				action: 'quick_send',
				session,
				target: jid,
				after: { message: message.slice(0, 80) }
			});

			loggers.info(
				color('Dashboard quick send:', 'white'),
				color(jid, 'lilac'),
				color(message.slice(0, 40), 'gray')
			);

			res.json({ ok: true });
		} catch (error) {
			res.status(500).json({ ok: false, message: error?.message || 'Failed to send message.' });
		}
	});

	return router;
}
