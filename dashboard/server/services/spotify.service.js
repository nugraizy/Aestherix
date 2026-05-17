const initialData = {
	available: false,
	isPlaying: false,
	trackTitle: null,
	artists: null,
	trackId: null,
	trackUri: null,
	trackUrl: null,
	coverUrl: null,
	progressMs: null,
	durationMs: null,
	message: 'Unavailable',
	timestamp: 0
};

export function createSpotifyService() {
	const cache = {
		data: { ...initialData },
		expiresAt: 0,
		pending: null
	};

	async function getNowPlaying() {
		const now = Date.now();

		if (cache.pending) {
			return cache.pending;
		}

		if (cache.expiresAt > now) {
			return cache.data;
		}

		cache.pending = (async () => {
			let next = { ...initialData, timestamp: Date.now() };

			try {
				const { spotifier } = await import('../../../src/utils/spotifier/index.js');
				const data = await spotifier.updateNowPlayingStates();

				if (data === false) {
					next = { ...next, available: true, message: 'Idle' };
				} else if (data?.status === false) {
					next = { ...next, message: data?.message || 'Unavailable' };
				} else if (data?.trackTitle) {
					next = {
						available: true,
						isPlaying: Boolean(data.isPlaying),
						trackTitle: data.trackTitle,
						artists: data.artists || null,
						trackId: data.trackId || null,
						trackUri: data.trackUri || null,
						trackUrl: data.trackUrl || null,
						coverUrl: data.coverUrl || null,
						progressMs: Number(data.progressMs || 0),
						durationMs: Number(data.durationMs || 0),
						message: null,
						timestamp: Date.now()
					};
				}
			} catch {
				// keep unavailable fallback
			}

			cache.data = next;
			cache.expiresAt = Date.now();
			cache.pending = null;

			return next;
		})();

		return cache.pending;
	}

	return { getNowPlaying };
}
