import path from 'path';
import { Router } from 'express';
import express from 'express';
import fs from 'fs-extra';

import { CLIENT_DIST_PATH, PROJECT_ROOT } from '../lib/paths.js';

const PUBLIC_ROOT = path.join(PROJECT_ROOT, 'public');
const SPA_ROUTES = ['/dashboard', '/dashboard/*splat', '/albums', '/albums/*splat'];

export function createStaticRouter() {
	const router = Router();
	const indexHtmlPath = path.join(CLIENT_DIST_PATH, 'index.html');

	router.use('/dashboard', express.static(CLIENT_DIST_PATH, { index: false, fallthrough: true }));
	router.use(express.static(PUBLIC_ROOT, { index: false, fallthrough: true }));

	const sendIndex = async (_req, res, next) => {
		try {
			if (!(await fs.pathExists(indexHtmlPath))) {
				return res.status(503).send('Dashboard build is missing. Run `npm run dashboard:build`.');
			}

			res.sendFile(indexHtmlPath);
		} catch (error) {
			next(error);
		}
	};

	for (const route of SPA_ROUTES) {
		router.get(route, sendIndex);
	}

	router.get('/', sendIndex);

	return router;
}
