import { Router } from 'express';

import { noStoreJson } from '../middleware/no-store.middleware.js';

export function createSpotifyRouter({ services }) {
	const router = Router();

	router.get('/spotify', noStoreJson, async (_req, res) => {
		const payload = await services.spotify.getNowPlaying();

		res.json({ ok: true, spotify: payload });
	});

	return router;
}
