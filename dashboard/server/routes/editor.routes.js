import { Router } from 'express';
import { z } from 'zod';

import { noStoreJson } from '../middleware/no-store.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { rateLimit } from '../middleware/rate-limit.middleware.js';

const editorRateLimit = rateLimit({ windowMs: 60_000, maxRequests: 20, message: 'Too many editor requests. Slow down.' });

const editorFileQuery = z.object({
	path: z.string().min(1)
});

const editorWriteBody = z.object({
	path: z.string().min(1),
	content: z.string()
});

const editorFormatBody = z.object({
	path: z.string().min(1),
	content: z.string(),
	configJson: z.string().nullable().optional()
});

export function createEditorRouter({ services }) {
	const { audit, editor, middleware } = services;
	const router = Router();

	router.get('/editor/tree', middleware.requireOwnerAuth, noStoreJson, async (_req, res) => {
		const tree = await editor.buildTree();

		if (!tree) {
			return res.status(500).json({ ok: false, message: 'Failed building command tree.' });
		}

		return res.json({ ok: true, root: tree });
	});

	router.get(
		'/editor/file',
		middleware.requireOwnerAuth,
		noStoreJson,
		validate({ query: editorFileQuery }),
		async (req, res) => {
			const result = await editor.readFile(req.query.path);

			if (!result.ok) {
				return res.status(result.status || 400).json(result);
			}

			return res.json(result);
		}
	);

	router.post(
		'/editor/file',
		editorRateLimit,
		middleware.requireOwnerAuth,
		noStoreJson,
		validate({ body: editorWriteBody }),
		async (req, res) => {
			const session = req.dashboardSession;
			const result = await editor.writeFile(req.body.path, req.body.content);

			if (!result.ok) {
				audit.push({
					action: 'editor.save',
					session,
					target: req.body.path,
					status: 'failed',
					message: result.message || 'Failed saving file.'
				});
				return res.status(result.status || 500).json(result);
			}

			audit.push({
				action: 'editor.save',
				session,
				target: result.path,
				message: 'Command file saved.'
			});

			return res.json(result);
		}
	);

	router.post(
		'/editor/format',
		middleware.requireOwnerAuth,
		noStoreJson,
		validate({ body: editorFormatBody }),
		async (req, res) => {
			const result = await editor.format(req.body.path, req.body.content, req.body.configJson);

			if (!result.ok) {
				return res.status(result.status || 400).json(result);
			}

			return res.json(result);
		}
	);

	return router;
}
