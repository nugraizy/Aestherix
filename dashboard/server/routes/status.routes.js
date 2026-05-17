import { Router } from 'express';

import { color, loggers } from '../../../src/utils/modules/index.js';

export function createStatusRouter({ services }) {
	const { system, middleware } = services;
	const router = Router();

	router.get('/status', middleware.requireDashboardAuth, async (_req, res) => {
		const status = await system.getStatus();

		res.json(status);
	});

	router.get('/changelog', async (_req, res) => {
		try {
			const markdown = await system.getChangelog();

			if (!markdown) {
				return res.status(404).send('Changelog file not found.');
			}

			res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
			return res.status(200).send(markdown);
		} catch (error) {
			loggers.error(color('Failed reading root changelog:', 'red'), color(error.message, 'white'));
			return res.status(500).send('Failed to load changelog.');
		}
	});

	router.get('/contributors', middleware.requireDashboardAuth, async (_req, res) => {
		try {
			const contributors = await system.getContributors();

			return res.json({
				ok: true,
				totalContributors: contributors.length,
				contributors
			});
		} catch (error) {
			loggers.error(color('Failed loading dashboard contributors:', 'red'), color(error.message, 'white'));
			return res.status(500).json({
				ok: false,
				message: 'Failed to load contributors.',
				totalContributors: 0,
				contributors: []
			});
		}
	});

	return router;
}
