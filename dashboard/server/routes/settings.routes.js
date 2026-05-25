import { Router } from 'express';

import { color, loggers } from '../../../src/utils/modules/index.js';
import { UNDO_WINDOW_MEDIUM_MS } from '../services/undo.service.js';

export function createSettingsRouter({ services }) {
	const { audit, settings, undo, middleware } = services;
	const router = Router();

	router.get('/settings', middleware.requireOwnerAuth, async (_req, res) => {
		try {
			const data = await settings.read();

			res.json({ settings: data });
		} catch (error) {
			res.status(500).json({ ok: false, message: error?.message || 'Failed to read settings.' });
		}
	});

	router.get('/settings/export', middleware.requireSuperOwnerAuth, async (_req, res) => {
		try {
			const data = await settings.readRaw();

			res.setHeader('Content-Disposition', 'attachment; filename="settings.json"');
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify(data, null, 2));
		} catch (error) {
			res.status(500).json({ ok: false, message: error?.message || 'Failed to export settings.' });
		}
	});

	router.post('/settings/import', middleware.requireSuperOwnerAuth, async (req, res) => {
		const session = req.dashboardSession;
		const imported = req.body;

		if (!imported || typeof imported !== 'object') {
			return res.status(400).json({ ok: false, message: 'Invalid JSON body.' });
		}

		const result = await settings.update(imported);

		if (!result.ok) {
			return res.status(result.status || 400).json(result);
		}

		audit.push({
			action: 'settings.import',
			session,
			target: 'settings',
			after: { keys: result.changedKeys }
		});

		res.json({ ok: true, settings: result.settings });
	});

	router.patch('/settings', middleware.requireOwnerAuth, async (req, res) => {
		const session = req.dashboardSession;
		const patch = req.body && typeof req.body === 'object' ? req.body : {};

		const SUPER_OWNER_FIELDS = ['owner_number', 'team_number', 'main_host_number', 'backups_host_numbers'];
		const touchesRestricted = SUPER_OWNER_FIELDS.some((key) => key in patch);

		if (touchesRestricted && session.role !== 'superOwner') {
			return res.status(403).json({ ok: false, message: 'Only the super owner can modify host numbers.' });
		}

		const validation = settings.validate(patch);

		if (!validation.ok) {
			audit.push({
				action: 'settings.update',
				session,
				target: 'settings',
				status: 'failed',
				message: validation.message
			});

			return res.status(400).json({ ok: false, message: validation.message });
		}

		const previous = await settings.readRaw();
		const result = await settings.update(validation.data);

		if (!result.ok) {
			audit.push({
				action: 'settings.update',
				session,
				target: 'settings',
				status: 'failed',
				message: result.message
			});

			return res.status(result.status || 500).json({ ok: false, message: result.message });
		}

		const undoToken = undo.register({
			kind: 'settings.update',
			target: 'settings',
			before: previous,
			actionLabel: 'Undo Settings',
			ttlMs: UNDO_WINDOW_MEDIUM_MS,
			risk: 'medium'
		});

		audit.push({
			action: 'settings.update',
			session,
			target: 'settings',
			before: { keys: result.changedKeys },
			after: { keys: result.changedKeys }
		});

		loggers.info(color('Dashboard updated settings:', 'white'), color(result.changedKeys.join(', ') || '(no keys)', 'lilac'));

		res.json({ ok: true, settings: result.settings, undo: undoToken });
	});

	return router;
}
