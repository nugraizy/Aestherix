import { Router } from 'express';

export function createSystemRouter({ services }) {
	const { system, audit, middleware } = services;
	const router = Router();

	router.get('/system/health', middleware.requireOwnerAuth, (_req, res) => {
		res.json(system.getHealth());
	});

	router.get('/system/cache', middleware.requireOwnerAuth, (_req, res) => {
		res.json(system.getCacheStats());
	});

	router.get('/system/env', middleware.requireSuperOwnerAuth, (_req, res) => {
		res.json({ keys: system.getEnvKeyPresence() });
	});

	router.get('/commands/analytics', middleware.requireDashboardAuth, async (_req, res) => {
		try {
			const row = await (
				await import('../../../src/helper/database/prisma.js')
			).default.dashboardKV.findUnique({
				where: { key_sessionName: { key: 'command_usage_daily', sessionName: 'main' } }
			});

			const data = row?.value ? JSON.parse(row.value) : {};

			res.json({ daily: data });
		} catch {
			res.json({ daily: {} });
		}
	});

	router.post('/system/cache/:name/clear', middleware.requireSuperOwnerAuth, (req, res) => {
		const name = req.params.name;
		const stats = system.getCacheStats();
		const flat = flattenKeys(stats);

		if (!flat.includes(name)) {
			return res.status(404).json({ ok: false, message: `Cache "${name}" not found.` });
		}

		const cache = resolveCache(name, req.app.get('configuration'));

		if (!cache || typeof cache.clear !== 'function') {
			return res.status(400).json({ ok: false, message: `Cache "${name}" cannot be cleared.` });
		}

		cache.clear();
		res.json({ ok: true, cleared: name });
	});

	router.post('/system/audit/purge', middleware.requireSuperOwnerAuth, (_req, res) => {
		audit.purge();
		res.json({ ok: true, message: 'Audit log purged.' });
	});

	return router;
}

function flattenKeys(obj, prefix = '') {
	const result = [];

	for (const [key, value] of Object.entries(obj || {})) {
		if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			result.push(...flattenKeys(value, prefix ? `${prefix}.${key}` : key));
		} else {
			result.push(prefix ? `${prefix}.${key}` : key);
		}
	}

	return result;
}

function resolveCache(name, configuration) {
	const map = {
		'groups.metadata': configuration?.groups?.metadata,
		'groups.settings': configuration?.groups?.settings,
		users: configuration?.users,
		commands: configuration?.registry?.commands,
		commandUsage: configuration?.registry?.commandUsage,
		pinterest: configuration?.pinterest?.images,
		'anonymous.sessions': configuration?.anonymous?.sessions,
		'anonymous.messages': configuration?.anonymous?.messages,
		'games.tebakGambar': configuration?.games?.tebakGambar,
		'games.wordle': configuration?.games?.wordle,
		'games.werewolf': configuration?.games?.werewolf
	};

	return map[name] || null;
}
