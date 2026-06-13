import { io } from 'socket.io-client';

const POLL_FALLBACK_DELAY = 8000;

function buildSocket() {
	return io('/login', {
		path: '/socket.io',
		transports: ['polling', 'websocket'],
		autoConnect: false,
		reconnectionAttempts: 3,
		reconnectionDelay: 1500,
		timeout: 4000,
		withCredentials: true
	});
}

export function watchConfirmation({ phoneNumber, requestId, requestKey, onStatus, onError }) {
	const socket = buildSocket();
	let resolved = false;
	let fallbackTimer = null;

	const cleanup = () => {
		if (fallbackTimer) {
			clearTimeout(fallbackTimer);
			fallbackTimer = null;
		}

	const removeSpecificListeners = () => {
		socket.off('connect');
		socket.off('dashboard:confirmation:status');
		socket.off('dashboard:confirmation:error');
	};

	if (!socket.connected) {
		removeSpecificListeners();
		return;
	}

	try {
		socket.emit('dashboard:confirmation:stop');
	} catch {
		// socket already gone
	}

	removeSpecificListeners();
	socket.disconnect();
	};

	socket.on('connect', () => {
		socket.emit('dashboard:confirmation:start', { phoneNumber, requestId, requestKey });
	});

	socket.on('dashboard:confirmation:status', (payload) => {
		if (resolved) {
			return;
		}

		const status = String(payload?.status || 'pending');

		onStatus(status);

		if (status === 'approved' || status === 'rejected') {
			resolved = true;
			cleanup();
		}
	});

	socket.on('dashboard:confirmation:error', (payload) => {
		if (resolved) {
			return;
		}

		resolved = true;
		onError(payload?.message || 'Confirmation failed.', payload?.status || 400);
		cleanup();
	});

	socket.on('connect_error', (error) => {
		if (resolved) {
			return;
		}

		fallbackTimer = setTimeout(() => {
			if (resolved) {
				return;
			}

			resolved = true;
			onError(error?.message || 'Confirmation socket unreachable.', 503);
			cleanup();
		}, POLL_FALLBACK_DELAY);
	});

	socket.connect();

	return cleanup;
}
