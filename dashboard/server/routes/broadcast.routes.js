import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';

import { color, loggers } from '../../../src/utils/modules/index.js';
import { validate } from '../middleware/validation.middleware.js';
import { rateLimit } from '../middleware/rate-limit.middleware.js';

const broadcastRateLimit = rateLimit({ windowMs: 60_000, maxRequests: 20, message: 'Too many requests. Please wait.' });

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 16 * 1024 * 1024 },
	fileFilter: (_req, file, cb) => {
		const allowed = ['image/', 'video/', 'audio/'];

		if (allowed.some((prefix) => file.mimetype.startsWith(prefix))) {
			cb(null, true);
			return;
		}

		cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: image, video, audio.`));
	}
});

const broadcastBody = z.object({
	targets: z.array(z.string().min(5)).min(1).max(50),
	message: z.string().min(1).max(4096),
	header: z.string().max(256).optional(),
	mediaUrl: z.string().url().optional(),
	mediaType: z.enum(['image', 'video', 'document', 'audio']).optional(),
	buttons: z
		.array(
			z.object({
				type: z.enum(['reply', 'url']).optional(),
				label: z.string().min(1).max(60),
				url: z.string().max(500).optional(),
				id: z.string().max(100).optional()
			})
		)
		.max(3)
		.optional(),
	delayMs: z.number().int().min(500).max(10000).optional(),
	mentionAll: z.boolean().optional(),
	dryRun: z.boolean().optional()
});

export function createBroadcastRouter({ services }) {
	const { audit, broadcast, middleware } = services;
	const router = Router();

	router.post(
		'/broadcast',
		broadcastRateLimit,
		middleware.requireSuperOwnerAuth,
		validate({ body: broadcastBody }),
		async (req, res) => {
			const session = req.dashboardSession;

			if (broadcast.isRunning()) {
				return res.status(409).json({ ok: false, message: 'A broadcast is already in progress.' });
			}

			const { targets, message, header, buttons, mediaUrl, mediaType, mentionAll, delayMs, dryRun } = req.body;
			const result = await broadcast.send({
				targets,
				message,
				header,
				buttons,
				mediaUrl,
				mediaType,
				mentionAll,
				delayMs,
				dryRun
			});

			if (!result.ok) {
				audit.push({
					action: 'broadcast.send',
					session,
					target: `${targets.length} targets`,
					status: 'failed',
					message: result.message
				});

				return res.status(result.status || 400).json(result);
			}

			audit.push({
				action: 'broadcast.send',
				session,
				target: `${result.total} targets`,
				after: { sent: result.sent, failed: result.failed, dryRun: Boolean(dryRun) }
			});

			loggers.info(
				color('Dashboard broadcast:', 'white'),
				color(`${result.sent}/${result.total} sent`, 'lilac'),
				dryRun ? color('(dry run)', 'gray') : ''
			);

			res.json(result);
		}
	);

	router.get('/broadcast/status', middleware.requireSuperOwnerAuth, (_req, res) => {
		res.json({
			running: broadcast.isRunning(),
			lastResult: broadcast.getLastResult()
		});
	});

	router.get('/broadcast/contacts', middleware.requireSuperOwnerAuth, async (_req, res) => {
		res.json({ contacts: await broadcast.getContacts() });
	});

	router.get('/broadcast/templates', middleware.requireSuperOwnerAuth, async (_req, res) => {
		const templates = await broadcast.getTemplates();

		res.json({ templates });
	});

	router.post('/broadcast/templates', middleware.requireSuperOwnerAuth, async (req, res) => {
		const result = await broadcast.saveTemplate(req.body);

		res.json(result);
	});

	router.delete('/broadcast/templates/:name', middleware.requireSuperOwnerAuth, async (req, res) => {
		const result = await broadcast.deleteTemplate(decodeURIComponent(req.params.name));

		res.json(result);
	});

	router.post(
		'/broadcast/schedule',
		middleware.requireSuperOwnerAuth,
		validate({ body: broadcastBody.extend({ sendAt: z.number() }) }),
		async (req, res) => {
			const { sendAt, ...payload } = req.body;
			const result = broadcast.schedule(payload, sendAt);

			if (!result.ok) {
				return res.status(400).json(result);
			}

			audit.push({
				action: 'broadcast.schedule',
				session: req.dashboardSession,
				target: `${payload.targets.length} targets`,
				after: { sendAt, id: result.id }
			});

			res.json(result);
		}
	);

	router.post('/broadcast/schedule/:id/cancel', middleware.requireSuperOwnerAuth, (req, res) => {
		const result = broadcast.cancelSchedule(req.params.id);

		res.json(result);
	});

	router.get('/broadcast/schedule', middleware.requireSuperOwnerAuth, (_req, res) => {
		res.json({ schedules: broadcast.getScheduleInfo() });
	});

	router.post('/broadcast/upload-media', middleware.requireSuperOwnerAuth, upload.single('file'), async (req, res) => {
		if (!req.file?.buffer) {
			return res.status(400).json({ ok: false, message: 'No file provided.' });
		}

		try {
			const url = await broadcast.uploadMedia(req.file.buffer);

			res.json({ ok: true, url });
		} catch (error) {
			res.status(500).json({ ok: false, message: error?.message || 'Upload failed.' });
		}
	});

	router.post('/broadcast/upload', middleware.requireSuperOwnerAuth, upload.single('media'), async (req, res) => {
		const session = req.dashboardSession;

		if (broadcast.isRunning()) {
			return res.status(409).json({ ok: false, message: 'A broadcast is already in progress.' });
		}

		let targets;

		try {
			targets = JSON.parse(req.body?.targets || '[]');
		} catch {
			return res.status(400).json({ ok: false, message: 'Invalid targets.' });
		}

		const message = String(req.body?.message || '').trim();
		const header = String(req.body?.header || '').trim() || undefined;
		const mediaType = ['image', 'video', 'document', 'audio'].includes(req.body?.mediaType) ? req.body.mediaType : 'document';
		const delayMs = Number(req.body?.delayMs) || undefined;
		const dryRun = req.body?.dryRun === 'true';
		const mentionAll = req.body?.mentionAll === 'true';
		const mediaBuffer = req.file?.buffer || null;
		const mediaUrl = null;

		let parsedButtons;

		try {
			parsedButtons = req.body?.buttons ? JSON.parse(req.body.buttons) : undefined;
		} catch {
			parsedButtons = undefined;
		}

		const result = await broadcast.send({
			targets,
			message,
			header,
			buttons: parsedButtons,
			mediaBuffer,
			mediaUrl,
			mediaType,
			mentionAll,
			delayMs,
			dryRun
		});

		if (!result.ok) {
			audit.push({
				action: 'broadcast.send',
				session,
				target: `${targets.length} targets`,
				status: 'failed',
				message: result.message
			});

			return res.status(result.status || 400).json(result);
		}

		audit.push({
			action: 'broadcast.send',
			session,
			target: `${result.total} targets`,
			after: { sent: result.sent, failed: result.failed, dryRun }
		});

		loggers.info(color('Dashboard broadcast (upload):', 'white'), color(`${result.sent}/${result.total} sent`, 'lilac'));

		res.json(result);
	});

	return router;
}
