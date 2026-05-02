const els = {
	container: document.getElementById('home-spotify-now-playing'),
	coverButton: document.getElementById('home-spotify-cover-button'),
	cover: document.getElementById('home-spotify-cover'),
	track: document.getElementById('home-spotify-track'),
	artist: document.getElementById('home-spotify-artist'),
	progress: document.getElementById('home-spotify-progress'),
	link: document.getElementById('home-spotify-link'),
	timestamp: document.getElementById('home-spotify-timestamp'),
	popup: document.getElementById('home-spotify-popup'),
	popupCover: document.getElementById('home-spotify-popup-cover'),
	popupTrack: document.getElementById('home-spotify-popup-track'),
	popupArtist: document.getElementById('home-spotify-popup-artist'),
	popupLink: document.getElementById('home-spotify-popup-link'),
	popupTimestamp: document.getElementById('home-spotify-popup-timestamp')
};
let spotifyPollTimer = null;
let spotifyProgressTimer = null;
let spotifyLastProgressAt = 0;
let latestSpotify = null;

const formatSpotifyTime = (value) => {
	const totalSeconds = Math.max(0, Math.floor(Number(value || 0) / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const getSpotifyLinkTargets = (data) => {
	const trackUri = String(data?.trackUri || '').trim();
	const trackUrl = String(data?.trackUrl || '').trim();

	if (trackUri) {
		return { primary: trackUri, fallback: trackUrl || '' };
	}

	if (trackUrl) {
		return { primary: trackUrl, fallback: '' };
	}

	return { primary: '', fallback: '' };
};

const applySpotifyLink = (element, data) => {
	if (!element) {
		return;
	}

	const { primary, fallback } = getSpotifyLinkTargets(data);
	const href = primary || fallback || '#';

	element.dataset.spotifyPrimary = primary;
	element.dataset.spotifyFallback = fallback;
	element.href = href;
	element.classList.toggle('is-disabled', href === '#');
	element.setAttribute('aria-disabled', href === '#' ? 'true' : 'false');
};

const updateSpotifyProgress = ({ force } = {}) => {
	if (!latestSpotify) {
		return;
	}

	const available = Boolean(latestSpotify.available);
	const isPlaying = Boolean(latestSpotify.isPlaying);
	const shouldShow = available && isPlaying;

	if (!shouldShow) {
		return;
	}

	const durationMs = Number(latestSpotify.durationMs || 0);
	const baseProgressMs = Number(latestSpotify.progressMs || 0);
	const now = Date.now();
	const elapsedMs = force ? 0 : Math.max(0, now - spotifyLastProgressAt);
	const nextProgressMs = durationMs > 0 ? Math.min(durationMs, baseProgressMs + elapsedMs) : baseProgressMs + elapsedMs;
	const ratio = durationMs > 0 ? Math.min(1, Math.max(0, nextProgressMs / durationMs)) : 0;
	const durationLabel = durationMs > 0 ? formatSpotifyTime(durationMs) : '--:--';
	const progressLabel = formatSpotifyTime(nextProgressMs);
	const fullDurationLabel = `${progressLabel} / ${durationLabel}`;

	latestSpotify.progressMs = nextProgressMs;
	spotifyLastProgressAt = now;

	if (els.progress) {
		els.progress.style.width = `${Math.round(ratio * 100)}%`;
		els.progress.setAttribute('title', fullDurationLabel);
	}

	if (els.timestamp) {
		els.timestamp.textContent = fullDurationLabel;
	}

	if (els.popupTimestamp) {
		els.popupTimestamp.textContent = fullDurationLabel;
	}
};

const startSpotifyProgressTicker = () => {
	if (spotifyProgressTimer) {
		return;
	}

	spotifyProgressTimer = setInterval(() => {
		updateSpotifyProgress();
	}, 1000);
};

const applySpotifyCoverColor = (img, container) => {
	if (!img || !container) {
		return;
	}

	const extract = async () => {
		try {
			if (!window.Vibrant || !img.complete || img.naturalWidth === 0) {
				return;
			}

			const palette = await window.Vibrant.from(img).getPalette();

			const vibrant = palette.Vibrant || palette.LightVibrant || palette.Muted;
			const dark = palette.DarkVibrant || palette.DarkMuted || vibrant;

			if (!vibrant) {
				return;
			}

			const [r1, g1, b1] = vibrant.rgb.map(Math.round);
			const [r2, g2, b2] = dark.rgb.map(Math.round);

			container.style.setProperty('--spotify-cover-color', `rgb(${r1},${g1},${b1})`);
			container.style.setProperty('--spotify-cover-color-2', `rgb(${r2},${g2},${b2})`);

			const waveSvg = encodeURIComponent(
				`<svg xmlns='http://www.w3.org/2000/svg' width='40' height='12' viewBox='0 0 40 12'>` +
					`<path d='M0 6 C7.33 1,12.67 1,20 6 C27.33 11,32.67 11,40 6' fill='none' stroke='rgb(${r1},${g1},${b1})' stroke-width='2.5' stroke-linecap='round'/>` +
					`</svg>`
			);
			const pausedSvg = encodeURIComponent(
				`<svg xmlns='http://www.w3.org/2000/svg' width='40' height='12' viewBox='0 0 40 12'>` +
					`<path d='M0 6 L40 6' fill='none' stroke='rgb(${r1},${g1},${b1})' stroke-opacity='0.42' stroke-width='2.5' stroke-linecap='round'/>` +
					`</svg>`
			);

			container.style.setProperty('--spotify-wave-image', `url("data:image/svg+xml,${waveSvg}")`);
			container.style.setProperty('--spotify-paused-image', `url("data:image/svg+xml,${pausedSvg}")`);
		} catch {
			// CORS or Vibrant decode error — keep CSS defaults
		}
	};

	if (img.complete && img.naturalWidth > 0) {
		extract();
	} else {
		img.addEventListener('load', extract, { once: true });
	}
};

const renderSpotifyNowPlaying = (payload) => {
	if (!els.container) {
		return;
	}

	const data = payload || {};
	const available = Boolean(data.available);
	const isPlaying = Boolean(data.isPlaying);
	const trackTitle = String(data.trackTitle || '').trim() + (available && !isPlaying ? ' (Paused)' : '');
	const artists = String(data.artists || '').trim();
	const message = String(data.message || '').trim();
	const durationMs = Number(data.durationMs || 0);
	const progressMs = Number(data.progressMs || 0);
	const coverUrl = String(data.coverUrl || '').trim();

	latestSpotify = {
		...data,
		available,
		isPlaying,
		durationMs,
		progressMs
	};
	spotifyLastProgressAt = Date.now();

	els.container.classList.toggle('is-playing', isPlaying);
	els.container.classList.toggle('is-idle', available && !isPlaying);
	els.container.classList.toggle('is-unavailable', !available);

	els.container.classList.toggle('hidden', !available);

	if (!available) {
		closeSpotifyPopup();
		return;
	}

	if (els.track) {
		els.track.textContent = trackTitle || message || 'Spotify idle';
	}

	if (els.artist) {
		els.artist.textContent = artists || '-';
	}

	if (isPlaying) {
		updateSpotifyProgress({ force: true });
	} else {
		const durationLabel = durationMs > 0 ? formatSpotifyTime(durationMs) : '--:--';
		const pausedLabel = `${formatSpotifyTime(progressMs)} / ${durationLabel}`;
		const ratio = durationMs > 0 ? Math.min(1, Math.max(0, progressMs / durationMs)) : 0;

		if (els.progress) {
			els.progress.style.width = `${Math.round(ratio * 100)}%`;
			els.progress.setAttribute('title', pausedLabel);
		}

		if (els.timestamp) {
			els.timestamp.textContent = pausedLabel;
		}

		if (els.popupTimestamp) {
			els.popupTimestamp.textContent = pausedLabel;
		}
	}

	if (els.cover) {
		if (coverUrl) {
			els.cover.crossOrigin = 'anonymous';
			els.cover.src = coverUrl;
			els.cover.removeAttribute('aria-hidden');
			els.cover.alt = `${trackTitle} cover`;
			applySpotifyCoverColor(els.cover, els.container);
		} else {
			els.cover.removeAttribute('src');
			els.cover.setAttribute('aria-hidden', 'true');
			els.container?.style.removeProperty('--spotify-cover-color');
			els.container?.style.removeProperty('--spotify-cover-color-2');
			els.container?.style.removeProperty('--spotify-wave-image');
			els.container?.style.removeProperty('--spotify-paused-image');
		}
	}

	applySpotifyLink(els.link, data);
	applySpotifyLink(els.popupLink, data);

	if (els.popupTrack) {
		els.popupTrack.textContent = trackTitle || message || 'Spotify idle';
	}

	if (els.popupArtist) {
		els.popupArtist.textContent = artists || '-';
	}

	if (els.popupCover) {
		if (coverUrl) {
			els.popupCover.src = coverUrl;
			els.popupCover.removeAttribute('aria-hidden');
			els.popupCover.alt = `${trackTitle} cover`;
		} else {
			els.popupCover.removeAttribute('src');
			els.popupCover.setAttribute('aria-hidden', 'true');
		}
	}
};

const handleSpotifyLinkClick = (event) => {
	const link = event.currentTarget;

	if (!link) {
		return;
	}

	const primary = link.dataset.spotifyPrimary || '';
	const fallback = link.dataset.spotifyFallback || '';

	if (!primary) {
		event.preventDefault();
		return;
	}

	if (primary.startsWith('spotify:') && fallback) {
		event.preventDefault();
		window.open(primary, '_blank', 'noopener,noreferrer');
	}
};

const closeSpotifyPopup = () => {
	els.popup?.classList.add('hidden');
};

const openSpotifyPopup = () => {
	if (!els.popup || !latestSpotify?.isPlaying) {
		return;
	}

	els.popup.classList.remove('hidden');
};

const setupSpotifyInteractions = () => {
	els.coverButton?.addEventListener('click', () => {
		openSpotifyPopup();
	});

	els.popup?.addEventListener('click', (event) => {
		if (event.target === els.popup) {
			closeSpotifyPopup();
		}
	});

	els.link?.addEventListener('click', handleSpotifyLinkClick);
	els.popupLink?.addEventListener('click', handleSpotifyLinkClick);

	window.addEventListener('keydown', (event) => {
		if (event.key === 'Escape') {
			closeSpotifyPopup();
		}
	});
};

const fetchSpotifyStatus = async () => {
	try {
		const response = await fetch('/api/dashboard/spotify', { cache: 'no-store' });

		if (!response.ok) {
			throw new Error('Spotify unavailable');
		}

		const payload = await response.json();

		renderSpotifyNowPlaying(payload.spotify || payload);
	} catch {
		renderSpotifyNowPlaying({ available: false, message: 'Spotify unavailable' });
	}
};

const startSpotifyPolling = () => {
	if (spotifyPollTimer) {
		return;
	}

	void fetchSpotifyStatus();
	spotifyPollTimer = setInterval(() => {
		void fetchSpotifyStatus();
	}, 1000);
};

const setupSocket = () => {
	if (typeof window === 'undefined' || typeof window.io !== 'function') {
		renderSpotifyNowPlaying({ available: false, message: 'Spotify unavailable' });
		startSpotifyPolling();
		return;
	}

	const socket = window.io({
		path: '/socket.io',
		transports: ['websocket', 'polling'],
		withCredentials: true
	});

	socket.on('dashboard:status', (payload) => {
		if (!payload || typeof payload !== 'object') {
			return;
		}

		renderSpotifyNowPlaying(payload.spotify);
	});

	socket.on('connect_error', () => {
		renderSpotifyNowPlaying({ available: false, message: 'Spotify unavailable' });
		startSpotifyPolling();
	});

	window.addEventListener('beforeunload', () => {
		socket.close();
	});
};

setupSpotifyInteractions();
setupSocket();
startSpotifyProgressTicker();
