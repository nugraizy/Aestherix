import { writable } from 'svelte/store';
import { socket } from './socket.js';

const initial = {
	available: false,
	isPlaying: false,
	trackTitle: '',
	artists: '',
	coverUrl: '',
	trackUrl: '',
	trackUri: '',
	durationMs: 0,
	progressMs: 0,
	message: ''
};

export const spotify = writable(initial);

let bound = false;

function applyPayload(payload) {
	if (!payload) {
		spotify.set({ ...initial });
		return;
	}

	spotify.set({
		available: Boolean(payload.available),
		isPlaying: Boolean(payload.isPlaying),
		trackTitle: String(payload.trackTitle || '').trim(),
		artists: String(payload.artists || '').trim(),
		coverUrl: String(payload.coverUrl || '').trim(),
		trackUrl: String(payload.trackUrl || '').trim(),
		trackUri: String(payload.trackUri || '').trim(),
		durationMs: Number(payload.durationMs || 0),
		progressMs: Number(payload.progressMs || 0),
		message: String(payload.message || '').trim()
	});
}

export function startSpotify() {
	if (bound) {
		return;
	}

	bound = true;

	socket.on('dashboard:status', (payload) => {
		if (!payload || typeof payload !== 'object') {
			return;
		}

		if (payload.spotify) {
			applyPayload(payload.spotify);
		}
	});
}

export function stopSpotify() {
	// no-op: we keep the socket listener for the page lifetime
}
