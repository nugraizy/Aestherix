const els = {
	panel: document.querySelector('.login-panel'),
	form: document.getElementById('login-form'),
	phoneNumber: document.getElementById('phone-number'),
	requestCode: document.getElementById('request-code'),
	viewerLogin: document.getElementById('viewer-login'),
	ownerWaiting: document.getElementById('owner-waiting'),
	message: document.getElementById('login-message')
};

const state = {
	requestId: null,
	requestKey: null,
	phoneNumber: null,
	pollTimer: null,
	pollingStartedAt: 0,
	redirecting: false
};

const MAX_POLL_MS = 5 * 60 * 1000;
const MIN_OWNER_DIGITS = 9;
const LOGIN_TRANSITION_MS = 3400;
const REQUEST_LABEL = 'Request Confirmation';
const WAITING_LABEL = 'Awaiting Approval';
const REDIRECT_LABEL = 'Opening Dashboard...';

function normalizeNumber(value) {
	let digits = String(value || '').replace(/\D/g, '');

	if (digits.startsWith('0')) {
		digits = `62${digits.slice(1)}`;
	}

	return digits;
}

const updateRequestButtonVisibility = () => {
	if (els.requestCode.disabled) {
		els.requestCode.classList.remove('hidden');
		return;
	}

	const hasValue = normalizeNumber(els.phoneNumber.value).length >= MIN_OWNER_DIGITS;

	els.requestCode.classList.toggle('hidden', !hasValue);
};

const setWaitingState = (isWaiting) => {
	const locked = isWaiting || state.redirecting;

	els.phoneNumber.readOnly = locked;
	els.phoneNumber.disabled = locked;
	els.requestCode.disabled = locked;
	els.requestCode.textContent = state.redirecting ? REDIRECT_LABEL : isWaiting ? WAITING_LABEL : REQUEST_LABEL;
	els.requestCode.classList.toggle('is-waiting', isWaiting && !state.redirecting);
	els.requestCode.classList.toggle('is-redirecting', state.redirecting);
	els.viewerLogin.disabled = locked;
	els.viewerLogin.classList.toggle('hidden', isWaiting || state.redirecting);
	els.ownerWaiting?.classList.toggle('hidden', !isWaiting || state.redirecting);
	updateRequestButtonVisibility();
};

const setMessage = (text, isError = false) => {
	els.message.textContent = text;
	els.message.classList.toggle('error', isError);
	els.message.classList.toggle('success', !isError && Boolean(text));
};

const wait = (ms) =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});

const runLoginTransition = async (message) => {
	state.redirecting = true;
	setMessage(message);
	els.panel?.classList.add('login-transitioning');
	setWaitingState(false);

	els.phoneNumber.disabled = true;
	els.requestCode.disabled = true;
	els.viewerLogin.disabled = true;

	await wait(LOGIN_TRANSITION_MS);
};

const resetRedirectState = () => {
	state.redirecting = false;
	els.panel?.classList.remove('login-transitioning');
};

const fetchJson = async (url, options = {}) => {
	const response = await fetch(url, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...(options.headers || {})
		}
	});

	const payload = await response.json().catch(() => ({}));

	if (!response.ok) {
		const error = new Error(payload.message || 'Request failed');

		error.status = response.status;
		throw error;
	}

	return payload;
};

const checkSession = async () => {
	try {
		const payload = await fetchJson('/api/dashboard/auth/session');

		if (payload.authenticated) {
			window.location.href = '/dashboard';
		}
	} catch {
		// Keep login page rendered when session check fails.
	}
};

const stopPolling = () => {
	if (state.pollTimer) {
		clearInterval(state.pollTimer);
		state.pollTimer = null;
	}

	setWaitingState(false);
};

const finalizeOwnerLogin = async () => {
	await fetchJson('/api/dashboard/auth/finalize-confirmation', {
		method: 'POST',
		body: JSON.stringify({
			requestId: state.requestId,
			requestKey: state.requestKey
		})
	});

	await runLoginTransition('Login successful. Initializing secure session...');
	window.location.href = '/dashboard';
};

const pollConfirmationStatus = async () => {
	if (!state.requestId || !state.requestKey || !state.phoneNumber) {
		return;
	}

	if (Date.now() - state.pollingStartedAt > MAX_POLL_MS) {
		stopPolling();
		setMessage('Confirmation timed out. Please request a new confirmation.', true);
		return;
	}

	try {
		const payload = await fetchJson('/api/dashboard/auth/confirmation-status', {
			method: 'POST',
			body: JSON.stringify({
				phoneNumber: state.phoneNumber,
				requestId: state.requestId,
				requestKey: state.requestKey
			})
		});

		if (payload.status === 'approved') {
			state.redirecting = true;
			stopPolling();
			await finalizeOwnerLogin();
		}
	} catch (error) {
		resetRedirectState();
		stopPolling();
		setMessage(error.message || 'Confirmation failed.', true);
	}
};

const requestOwnerConfirmation = async (event) => {
	event.preventDefault();

	if (state.redirecting) {
		return;
	}

	const phoneNumber = normalizeNumber(els.phoneNumber.value);

	if (phoneNumber.length < MIN_OWNER_DIGITS) {
		setMessage('Please enter a valid WhatsApp number.', true);
		return;
	}

	stopPolling();
	setWaitingState(false);
	els.requestCode.disabled = true;
	setMessage('Sending confirmation button to your WhatsApp...');

	try {
		const payload = await fetchJson('/api/dashboard/auth/request-code', {
			method: 'POST',
			body: JSON.stringify({ phoneNumber })
		});

		state.phoneNumber = phoneNumber;
		state.requestId = payload.requestId;
		state.requestKey = payload.requestKey;
		state.pollingStartedAt = Date.now();

		els.phoneNumber.value = phoneNumber;
		setWaitingState(true);
		setMessage('');

		state.pollTimer = setInterval(() => {
			void pollConfirmationStatus();
		}, 2000);

		void pollConfirmationStatus();
	} catch (error) {
		resetRedirectState();
		setWaitingState(false);
		setMessage(error.message || 'Failed to request code.', true);
	} finally {
		if (!state.pollTimer && !state.redirecting) {
			els.requestCode.disabled = false;
			els.requestCode.textContent = REQUEST_LABEL;
			els.requestCode.classList.remove('is-waiting');
			els.requestCode.classList.remove('is-redirecting');
			els.ownerWaiting?.classList.add('hidden');
			updateRequestButtonVisibility();
		}
	}
};

const loginAsViewer = async () => {
	els.viewerLogin.disabled = true;
	setMessage('Starting read-only session...');

	try {
		await fetchJson('/api/dashboard/auth/viewer-login', {
			method: 'POST',
			body: JSON.stringify({ name: 'Viewer' })
		});

		await runLoginTransition('Viewer login successful. Preparing dashboard...');
		window.location.href = '/dashboard';
	} catch (error) {
		resetRedirectState();
		setMessage(error.message || 'Viewer login failed.', true);
	} finally {
		if (!state.redirecting) {
			els.viewerLogin.disabled = false;
		}
	}
};

els.form.addEventListener('submit', requestOwnerConfirmation);
els.viewerLogin.addEventListener('click', loginAsViewer);
els.phoneNumber.addEventListener('input', updateRequestButtonVisibility);

updateRequestButtonVisibility();

checkSession();
