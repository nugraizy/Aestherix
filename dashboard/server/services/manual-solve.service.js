import crypto from 'crypto';

import puppeteer from 'puppeteer';

const DEFAULT_VIEWPORT = { width: 1280, height: 720, deviceScaleFactor: 1 };
const DEFAULT_URL = 'https://2captcha.com/demo/cloudflare-turnstile-challenge';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const HEADFUL_ENVS = new Set(['1', 'true', 'yes', 'on']);

export function createManualSolveService() {
	const sessions = new Map();
	let browserPromise = null;
	let io = null;

	function setSocketLayer(socketLayer) {
		io = socketLayer?.io || null;
	}

	async function getBrowser() {
		if (!browserPromise) {
			const headful = HEADFUL_ENVS.has(String(process.env.MANUAL_SOLVE_HEADFUL || '').toLowerCase());

			browserPromise = puppeteer.launch({
				headless: !headful,
				args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-blink-features=AutomationControlled']
			});
		}

		return browserPromise;
	}

	function roomFor(id) {
		return `dashboard:manual-solve:${id}`;
	}

	function emitSessions() {
		if (!io) {
			return;
		}

		io.emit('dashboard:manual-solve:sessions', { sessions: listSessions() });
	}

	function listSessions() {
		return Array.from(sessions.values()).map((session) => ({
			id: session.id,
			url: session.url,
			label: session.label,
			createdAt: session.createdAt,
			viewport: session.viewport,
			status: session.status,
			viewers: session.viewers,
			lastFrameAt: session.lastFrameAt
		}));
	}

	function hasSession(id) {
		return sessions.has(id);
	}

	function getSession(id) {
		return sessions.get(id) || null;
	}

	async function startTestSession({ url = DEFAULT_URL, label = 'Turnstile demo' } = {}) {
		const browser = await getBrowser();
		const page = await browser.newPage();
		const id = crypto.randomBytes(8).toString('hex');
		const viewport = { ...DEFAULT_VIEWPORT };

		await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: viewport.deviceScaleFactor });
		await page.setUserAgent(UA);
		await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

		const cdp = await page.target().createCDPSession();

		const session = {
			id,
			url,
			label,
			page,
			cdp,
			createdAt: Date.now(),
			viewport,
			status: 'active',
			viewers: 0,
			lastFrameAt: 0,
			closing: false
		};

		sessions.set(id, session);
		emitSessions();

		page.on('close', () => {
			void stopSession(id);
		});

		cdp.on('Page.screencastFrame', (frame) => {
			const meta = frame?.metadata || {};

			if (session.viewers > 0 && io) {
				io.to(roomFor(id)).emit('dashboard:manual-solve:frame', {
					id,
					data: frame.data,
					meta: {
						width: meta.deviceWidth || viewport.width,
						height: meta.deviceHeight || viewport.height,
						scale: meta.pageScaleFactor || 1
					},
					timestamp: Date.now()
				});
			}

			session.lastFrameAt = Date.now();

			cdp.send('Page.screencastFrameAck', { sessionId: frame.sessionId }).catch(() => {});
		});

		await cdp.send('Page.enable');
		await cdp.send('Emulation.setDeviceMetricsOverride', {
			width: viewport.width,
			height: viewport.height,
			deviceScaleFactor: viewport.deviceScaleFactor,
			mobile: false
		});
		await cdp.send('Page.startScreencast', {
			format: 'jpeg',
			quality: 70,
			maxWidth: viewport.width,
			maxHeight: viewport.height
		});
		await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(() => {});

		return {
			id,
			url,
			label,
			createdAt: session.createdAt,
			viewport,
			status: session.status
		};
	}

	async function startChallengeSession({ url, label = 'Challenge', challengeId } = {}) {
		const browser = await getBrowser();
		const page = await browser.newPage();
		const id = challengeId || crypto.randomBytes(8).toString('hex');
		const viewport = { ...DEFAULT_VIEWPORT };

		await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: viewport.deviceScaleFactor });
		await page.setUserAgent(UA);
		await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

		const cdp = await page.target().createCDPSession();

		const session = {
			id,
			url,
			label,
			challengeId,
			page,
			cdp,
			createdAt: Date.now(),
			viewport,
			status: 'active',
			viewers: 0,
			lastFrameAt: 0,
			closing: false
		};

		sessions.set(id, session);
		emitSessions();

		page.on('close', () => {
			void stopSession(id);
		});

		cdp.on('Page.screencastFrame', (frame) => {
			const meta = frame?.metadata || {};

			if (session.viewers > 0 && io) {
				io.to(roomFor(id)).emit('dashboard:manual-solve:frame', {
					id,
					data: frame.data,
					meta: {
						width: meta.deviceWidth || viewport.width,
						height: meta.deviceHeight || viewport.height,
						scale: meta.pageScaleFactor || 1
					},
					timestamp: Date.now()
				});
			}

			session.lastFrameAt = Date.now();

			cdp.send('Page.screencastFrameAck', { sessionId: frame.sessionId }).catch(() => {});
		});

		await cdp.send('Page.enable');
		await cdp.send('Emulation.setDeviceMetricsOverride', {
			width: viewport.width,
			height: viewport.height,
			deviceScaleFactor: viewport.deviceScaleFactor,
			mobile: false
		});
		await cdp.send('Page.startScreencast', {
			format: 'jpeg',
			quality: 70,
			maxWidth: viewport.width,
			maxHeight: viewport.height
		});
		await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(() => {});

		return {
			id,
			url,
			label,
			challengeId,
			createdAt: session.createdAt,
			viewport,
			status: session.status
		};
	}

	function addViewer(id) {
		const session = sessions.get(id);

		if (session) {
			session.viewers += 1;
		}
	}

	function removeViewer(id) {
		const session = sessions.get(id);

		if (session) {
			session.viewers = Math.max(0, session.viewers - 1);
		}
	}

	async function stopSession(id) {
		const session = sessions.get(id);

		if (!session || session.closing) {
			return { ok: false, message: 'Session not found.' };
		}

		session.closing = true;
		session.status = 'closed';

		sessions.delete(id);
		emitSessions();

		await session.page?.close().catch(() => {});
		await session.cdp?.detach?.().catch(() => {});

		return { ok: true };
	}

	async function handleInput(id, input = {}) {
		const session = sessions.get(id);

		if (!session || session.closing) {
			return { ok: false, message: 'Session not found.' };
		}

		const cdp = session.cdp;
		const type = String(input.type || '');

		if (!cdp || !type) {
			return { ok: false, message: 'Input is not ready.' };
		}

		if (type === 'mouse') {
			const eventType = input.event;
			const button =
				input.button === 'right' ? 'right' : input.button === 'middle' ? 'middle' : input.button === 'none' ? 'none' : 'left';
			const payload = {
				type: eventType,
				x: Number(input.x || 0),
				y: Number(input.y || 0),
				button,
				buttons: Number.isFinite(input.buttons) ? Number(input.buttons) : button === 'left' ? 1 : 0,
				clickCount: Number(input.clickCount || 1),
				modifiers: Number(input.modifiers || 0)
			};

			await cdp.send('Input.dispatchMouseEvent', payload).catch(() => {});

			return { ok: true };
		}

		if (type === 'wheel') {
			const payload = {
				type: 'mouseWheel',
				x: Number(input.x || 0),
				y: Number(input.y || 0),
				deltaX: Number(input.deltaX || 0),
				deltaY: Number(input.deltaY || 0),
				modifiers: Number(input.modifiers || 0)
			};

			await cdp.send('Input.dispatchMouseEvent', payload).catch(() => {});

			return { ok: true };
		}

		if (type === 'key') {
			const payload = {
				type: input.event || 'keyDown',
				key: String(input.key || ''),
				code: String(input.code || ''),
				windowsVirtualKeyCode: Number(input.keyCode || 0),
				nativeVirtualKeyCode: Number(input.keyCode || 0),
				modifiers: Number(input.modifiers || 0)
			};

			if (input.text) {
				payload.text = String(input.text);
			}

			await cdp.send('Input.dispatchKeyEvent', payload).catch(() => {});

			return { ok: true };
		}

		if (type === 'viewport') {
			const width = Math.max(320, Math.min(1920, Number(input.width || DEFAULT_VIEWPORT.width)));
			const height = Math.max(240, Math.min(1200, Number(input.height || DEFAULT_VIEWPORT.height)));
			const scale = Math.max(1, Math.min(2, Number(input.scale || DEFAULT_VIEWPORT.deviceScaleFactor)));

			session.viewport = { width, height, deviceScaleFactor: scale };
			await session.page?.setViewport(session.viewport).catch(() => {});
			await cdp
				.send('Emulation.setDeviceMetricsOverride', {
					width,
					height,
					deviceScaleFactor: scale,
					mobile: false
				})
				.catch(() => {});

			emitSessions();

			return { ok: true };
		}

		return { ok: false, message: 'Unsupported input.' };
	}

	return {
		setSocketLayer,
		listSessions,
		hasSession,
		getSession,
		getRoom: roomFor,
		startTestSession,
		startChallengeSession,
		stopSession,
		addViewer,
		removeViewer,
		handleInput
	};
}
