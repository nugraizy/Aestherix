import {
	DEFAULT_THEME_PALETTE,
	THEME_ICON_MORPH_MS,
	THEME_PALETTE_STORAGE_KEY,
	THEME_PALETTES,
	THEME_STORAGE_KEY,
	THEME_TRANSITION_MS
} from './app/constants.js';

let themeTransitionTimer = null;
let themeIconMorphTimer = null;

const els = {
	panel: document.querySelector('.login-panel'),
	themeToggle: document.getElementById('theme-toggle'),
	form: document.getElementById('login-form'),
	loginInline: document.querySelector('.login-inline'),
	phoneLabel: document.querySelector('label[for="phone-number"]'),
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
	redirecting: false,
	pollTimeout: null,
	awaitingConfirmation: false
};

const MAX_POLL_MS = 5 * 60 * 1000;
const MIN_OWNER_DIGITS = 9;
const LOGIN_TRANSITION_MS = 2200;
const REQUEST_LABEL = 'Request Confirmation';
const WAITING_MESSAGE = 'Awaiting approval. Please confirm via WhatsApp...';

let confirmationSocket = null;
let confirmationSocketConnected = false;

const prefersReducedMotion = () =>
	typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const startThemeTransition = () => {
	document.documentElement.classList.add('theme-transitioning');

	if (themeTransitionTimer) {
		clearTimeout(themeTransitionTimer);
	}

	themeTransitionTimer = setTimeout(() => {
		document.documentElement.classList.remove('theme-transitioning');
		themeTransitionTimer = null;
	}, THEME_TRANSITION_MS);
};

const startThemeIconMorph = () => {
	if (!els.themeToggle || prefersReducedMotion()) {
		return;
	}

	els.themeToggle.classList.remove('is-switching');
	void els.themeToggle.offsetWidth;
	els.themeToggle.classList.add('is-switching');

	if (themeIconMorphTimer) {
		clearTimeout(themeIconMorphTimer);
	}

	themeIconMorphTimer = setTimeout(() => {
		els.themeToggle?.classList.remove('is-switching');
		themeIconMorphTimer = null;
	}, THEME_ICON_MORPH_MS);
};

const updateThemeToggleLabel = () => {
	if (!els.themeToggle) {
		return;
	}

	const currentTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';

	els.themeToggle.setAttribute('aria-label', `Switch to ${currentTheme === 'light' ? 'dark' : 'light'} mode`);
};

const applyTheme = (theme, options = {}) => {
	const safeTheme = theme === 'light' ? 'light' : 'dark';
	const shouldAnimate = options.animate === true;

	if (shouldAnimate) {
		startThemeTransition();
		startThemeIconMorph();
	}

	document.documentElement.setAttribute('data-theme', safeTheme);
	updateThemeToggleLabel();
};

const normalizeThemePalette = (palette) => {
	const safePalette = String(palette || '')
		.trim()
		.toLowerCase();

	if (THEME_PALETTES.includes(safePalette)) {
		return safePalette;
	}

	return DEFAULT_THEME_PALETTE;
};

const applyThemePalette = (palette) => {
	const safePalette = normalizeThemePalette(palette);

	document.documentElement.setAttribute('data-palette', safePalette);
};

const loadThemePreferences = () => {
	let preferredTheme = null;
	let preferredPalette = null;

	try {
		preferredTheme = localStorage.getItem(THEME_STORAGE_KEY);
		preferredPalette = localStorage.getItem(THEME_PALETTE_STORAGE_KEY);
	} catch {
		// Ignore storage access errors and use fallbacks.
	}

	if (preferredTheme === 'light' || preferredTheme === 'dark') {
		applyTheme(preferredTheme, { animate: false });
	} else {
		const prefersLight = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches;

		applyTheme(prefersLight ? 'light' : 'dark', { animate: false });
	}

	applyThemePalette(preferredPalette || DEFAULT_THEME_PALETTE);
};

const toggleThemePreference = () => {
	const currentTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
	const nextTheme = currentTheme === 'light' ? 'dark' : 'light';

	applyTheme(nextTheme, { animate: true });

	try {
		localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
	} catch {
		// Ignore storage write errors.
	}
};

const setupZenCursor = () => {
	if (typeof window === 'undefined' || !document?.body) {
		return false;
	}

	if (!window.matchMedia('(pointer: fine)').matches) {
		return false;
	}

	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		return false;
	}

	const cursor = document.createElement('div');
	const cursorText = document.createElement('div');
	let isCursorVisible = true;

	cursor.id = 'zen-cursor';
	cursor.className = 'zen-cursor rounded blur cursor-normal';
	cursorText.id = 'zen-cursor-text';
	cursorText.className = 'zen-cursor-text';
	document.body.appendChild(cursor);
	document.body.appendChild(cursorText);
	document.documentElement.classList.add('zen-cursor-enabled');
	document.body.classList.add('zen-cursor-enabled');
	document.body.style.cursor = 'none';

	const setCursorVisibility = (isVisible) => {
		if (isCursorVisible === isVisible) {
			return;
		}

		isCursorVisible = isVisible;
		cursor.style.opacity = isVisible ? '1' : '0';

		if (!isVisible) {
			cursorText.style.scale = '0';
		}
	};

	const moveCursor = (event) => {
		const mouseY = event.clientY;
		const mouseX = event.clientX;
		const tooltipGap = 24;

		setCursorVisibility(true);

		cursor.style.translate = `${mouseX}px ${mouseY}px`;

		if (mouseX > window.innerWidth - cursorText.clientWidth - tooltipGap) {
			cursorText.style.left = `${mouseX - cursorText.clientWidth - tooltipGap}px`;
		} else {
			cursorText.style.left = `${mouseX + tooltipGap}px`;
		}

		if (mouseY > window.innerHeight - cursorText.clientHeight - tooltipGap) {
			cursorText.style.top = `${mouseY - cursorText.clientHeight - tooltipGap}px`;
		} else {
			cursorText.style.top = `${mouseY + tooltipGap}px`;
		}
	};

	const updateTitle = (titleText) => {
		if (titleText) {
			cursorText.style.scale = '1';
			cursorText.textContent = titleText;
			return;
		}

		cursorText.style.scale = '0';
	};

	const handleMouseEnterTarget = (event) => {
		const target = event.currentTarget;

		cursor.classList.add('blur-mini');
		cursor.classList.add('cursor-grow');
		updateTitle(target.getAttribute('data-title') || target.getAttribute('data-tooltip'));
	};

	const handleMouseLeaveTarget = () => {
		cursor.classList.remove('blur-mini');
		cursor.classList.remove('cursor-grow');
		updateTitle('');
	};

	const handleMouseDown = (event) => {
		if (event.button !== 0) {
			return;
		}

		cursor.classList.add('is-holding');
	};

	const handleMouseUp = (event) => {
		if (event.button !== 0) {
			return;
		}

		cursor.classList.remove('is-holding');
	};

	const handleWindowBlur = () => {
		setCursorVisibility(false);
	};

	const handleWindowFocus = () => {
		if (!document.hidden) {
			setCursorVisibility(true);
		}
	};

	const handleVisibilityChange = () => {
		setCursorVisibility(!document.hidden);
	};

	const handleDocumentMouseOut = (event) => {
		if (!event.relatedTarget && !event.toElement) {
			setCursorVisibility(false);
		}
	};

	const handleDocumentMouseEnter = () => {
		if (!document.hidden && document.hasFocus()) {
			setCursorVisibility(true);
		}
	};

	window.addEventListener('mousemove', moveCursor);
	window.addEventListener('mousedown', handleMouseDown);
	window.addEventListener('mouseup', handleMouseUp);
	window.addEventListener('blur', handleWindowBlur);
	window.addEventListener('focus', handleWindowFocus);
	document.addEventListener('visibilitychange', handleVisibilityChange);
	document.addEventListener('mouseout', handleDocumentMouseOut);
	document.addEventListener('mouseenter', handleDocumentMouseEnter);

	const attachListeners = () => {
		const targets = document.querySelectorAll('a, button, input, [data-title], [data-tooltip]');

		targets.forEach((target) => {
			target.addEventListener('mouseenter', handleMouseEnterTarget);
			target.addEventListener('mouseleave', handleMouseLeaveTarget);
		});

		return () => {
			targets.forEach((target) => {
				target.removeEventListener('mouseenter', handleMouseEnterTarget);
				target.removeEventListener('mouseleave', handleMouseLeaveTarget);
			});
		};
	};

	let cleanupListeners = attachListeners();

	const observer = new MutationObserver(() => {
		cleanupListeners();
		cleanupListeners = attachListeners();
	});

	observer.observe(document.body, { childList: true, subtree: true });

	window.addEventListener('beforeunload', () => {
		window.removeEventListener('mousemove', moveCursor);
		window.removeEventListener('mousedown', handleMouseDown);
		window.removeEventListener('mouseup', handleMouseUp);
		window.removeEventListener('blur', handleWindowBlur);
		window.removeEventListener('focus', handleWindowFocus);
		document.removeEventListener('visibilitychange', handleVisibilityChange);
		document.removeEventListener('mouseout', handleDocumentMouseOut);
		document.removeEventListener('mouseenter', handleDocumentMouseEnter);
		cleanupListeners();
		observer.disconnect();
	});

	return true;
};

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

const clearPendingRequest = () => {
	state.requestId = null;
	state.requestKey = null;
	state.phoneNumber = null;
	state.pollingStartedAt = 0;
};

const clearPollTimeout = () => {
	if (state.pollTimeout) {
		clearTimeout(state.pollTimeout);
		state.pollTimeout = null;
	}
};

const setPhoneLabelHidden = (hidden) => {
	els.phoneLabel?.classList.toggle('hidden', hidden);
};

const resetRequestUI = () => {
	els.requestCode.disabled = false;
	els.requestCode.textContent = REQUEST_LABEL;
	els.requestCode.classList.remove('is-waiting', 'is-redirecting');
	els.ownerWaiting?.classList.add('hidden');
	els.message.classList.remove('waiting');
	setPhoneLabelHidden(false);

	if (els.message.textContent === WAITING_MESSAGE) {
		setMessage('');
	}

	updateRequestButtonVisibility();
};

const setWaitingState = (isWaiting) => {
	const isRedirecting = state.redirecting;
	const locked = isWaiting;

	els.panel?.classList.toggle('is-redirecting', isRedirecting);
	els.panel?.classList.toggle('is-waiting', isWaiting && !isRedirecting);
	els.loginInline?.classList.toggle('is-waiting', isWaiting && !isRedirecting);
	els.phoneNumber.readOnly = locked;
	els.phoneNumber.disabled = locked;
	els.requestCode.disabled = locked;
	els.requestCode.textContent = REQUEST_LABEL;
	els.requestCode.classList.toggle('is-waiting', isWaiting);
	els.requestCode.classList.toggle('is-redirecting', isRedirecting);
	els.requestCode.classList.toggle('hidden', isWaiting);
	els.viewerLogin.disabled = locked;
	els.viewerLogin.classList.toggle('hidden', isWaiting || isRedirecting);
	els.ownerWaiting?.classList.add('hidden');

	if (isWaiting && !isRedirecting) {
		els.message.classList.add('waiting');
		setMessage(WAITING_MESSAGE);
	} else if (!isWaiting && !isRedirecting && els.message.textContent === WAITING_MESSAGE) {
		els.message.classList.remove('waiting');
		setMessage('');
	} else if (!isWaiting) {
		els.message.classList.remove('waiting');
	}

	if (!isRedirecting && !isWaiting) {
		updateRequestButtonVisibility();
	}
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

const prefetchDashboardAssets = () => {
	if (document.getElementById('dashboard-prefetch')) {
		return;
	}

	const marker = document.createElement('span');

	marker.id = 'dashboard-prefetch';
	marker.hidden = true;
	(document.head || document.documentElement).appendChild(marker);

	const hints = [
		{ href: '/dashboard', as: 'document' },
		{ href: '/dashboard/styles.css', as: 'style' },
		{ href: '/dashboard/app.js', as: 'script' },
		{ href: '/socket.io/socket.io.js', as: 'script' }
	];

	for (const hint of hints) {
		const link = document.createElement('link');

		link.rel = 'prefetch';
		link.href = hint.href;
		link.as = hint.as;
		marker.appendChild(link);
	}

	fetch('/dashboard', { credentials: 'include' }).catch(() => {});
};

const runLoginTransition = async (message) => {
	state.redirecting = true;
	setMessage(message);
	els.panel?.classList.add('login-transitioning');
	setWaitingState(false);
	setPhoneLabelHidden(true);

	els.phoneNumber.disabled = true;
	els.requestCode.disabled = true;
	els.viewerLogin.disabled = true;

	await wait(LOGIN_TRANSITION_MS);
};

const resetRedirectState = () => {
	state.redirecting = false;
	els.panel?.classList.remove('login-transitioning');
	setWaitingState(false);
	setPhoneLabelHidden(false);
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

const stopPolling = ({ clearRequest = true, resetUI = true } = {}) => {
	if (state.pollTimer) {
		clearInterval(state.pollTimer);
		state.pollTimer = null;
	}

	clearPollTimeout();
	state.awaitingConfirmation = false;

	setWaitingState(false);

	if (confirmationSocketConnected) {
		confirmationSocket.emit('dashboard:confirmation:stop');
	}

	if (clearRequest) {
		clearPendingRequest();
	}

	if (resetUI) {
		resetRequestUI();
	}
};

const scheduleConfirmationTimeout = () => {
	clearPollTimeout();
	state.pollTimeout = setTimeout(() => {
		stopPolling();
		setMessage('Confirmation timed out. Please request a new confirmation.', true);
	}, MAX_POLL_MS);
};

const handleSocketConfirmationStatus = (payload) => {
	if (!payload || typeof payload !== 'object') {
		return;
	}

	if (payload.status === 'approved') {
		state.redirecting = true;
		stopPolling({ clearRequest: false, resetUI: false });
		void finalizeOwnerLogin();
		return;
	}

	if (payload.status === 'rejected') {
		stopPolling();
		setMessage('Login request rejected. Please request a new confirmation.', true);
	}
};

const ensureConfirmationSocket = () => {
	if (typeof window === 'undefined' || typeof window.io !== 'function') {
		return false;
	}

	if (confirmationSocket) {
		return true;
	}

	confirmationSocket = window.io('/login', {
		path: '/socket.io',
		transports: ['websocket', 'polling'],
		withCredentials: true
	});

	confirmationSocket.on('connect', () => {
		confirmationSocketConnected = true;

		if (state.requestId && state.requestKey && state.phoneNumber) {
			confirmationSocket.emit('dashboard:confirmation:start', {
				phoneNumber: state.phoneNumber,
				requestId: state.requestId,
				requestKey: state.requestKey
			});
		}
	});

	confirmationSocket.on('disconnect', () => {
		confirmationSocketConnected = false;
	});

	confirmationSocket.on('dashboard:confirmation:status', handleSocketConfirmationStatus);
	confirmationSocket.on('dashboard:confirmation:error', (payload) => {
		stopPolling();
		setMessage(payload?.message || 'Confirmation failed.', true);
	});

	return true;
};

const finalizeOwnerLogin = async () => {
	await fetchJson('/api/dashboard/auth/finalize-confirmation', {
		method: 'POST',
		body: JSON.stringify({
			requestId: state.requestId,
			requestKey: state.requestKey
		})
	});

	prefetchDashboardAssets();
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
			stopPolling({ clearRequest: false, resetUI: false });
			await finalizeOwnerLogin();
		} else if (payload.status === 'rejected') {
			stopPolling();
			setMessage('Login request rejected. Please request a new confirmation.', true);
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
		state.awaitingConfirmation = true;

		els.phoneNumber.value = phoneNumber;
		setWaitingState(true);
		scheduleConfirmationTimeout();

		if (ensureConfirmationSocket()) {
			if (confirmationSocketConnected) {
				confirmationSocket.emit('dashboard:confirmation:start', {
					phoneNumber: state.phoneNumber,
					requestId: state.requestId,
					requestKey: state.requestKey
				});
			}
		} else {
			state.pollTimer = setInterval(() => {
				void pollConfirmationStatus();
			}, 2000);

			void pollConfirmationStatus();
		}
	} catch (error) {
		resetRedirectState();
		setWaitingState(false);
		setMessage(error.message || 'Failed to request code.', true);
	} finally {
		if (!state.pollTimer && !state.redirecting && !state.awaitingConfirmation) {
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

		prefetchDashboardAssets();
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
els.themeToggle?.addEventListener('click', toggleThemePreference);

loadThemePreferences();
updateRequestButtonVisibility();
setupZenCursor();

checkSession();
