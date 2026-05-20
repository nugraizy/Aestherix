const DEFAULT_BRIDGE_URL = String(process.env.DASHBOARD_BOT_BRIDGE_URL || 'http://127.0.0.1:4010').replace(/\/+$/, '');

const rawBridgeToken = process.env.DASHBOARD_BRIDGE_TOKEN;

if (!rawBridgeToken) {
	throw new Error(
		'DASHBOARD_BRIDGE_TOKEN environment variable is not set. '
		+ 'Generate a strong random token and set it in your .env file:\n'
		+ '  DASHBOARD_BRIDGE_TOKEN=$(openssl rand -hex 32)'
	);
}

const bridgeToken = String(rawBridgeToken);

export function createBotBridgeService({ bridgeUrl = DEFAULT_BRIDGE_URL } = {}) {
	function bridgeUnavailable() {
		return { ok: false, status: 503, message: 'Runtime bridge URL is not configured.' };
	}

	async function callBridge(path, init = {}) {
		if (!bridgeUrl) {
			return bridgeUnavailable();
		}

		const delays = [1000, 2000, 4000];
		let lastError = null;

		for (let attempt = 0; attempt <= delays.length; attempt++) {
			try {
				const response = await fetch(`${bridgeUrl}${path}`, {
					...init,
					headers: {
						'x-dashboard-bridge-token': bridgeToken,
						...(init.headers || {})
					}
				});

				const data = await response.json().catch(() => ({}));

				if (!response.ok) {
					return {
						ok: false,
						status: response.status,
						message: data?.message || 'Bridge request failed.'
					};
				}

				return { ok: true, data };
			} catch (error) {
				lastError = error;

				if (attempt < delays.length) {
					await sleep(delays[attempt]);
				}
			}
		}

		return { ok: false, status: 503, message: lastError?.message || 'Bridge is not reachable.' };
	}

	function sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	async function pingBot({ timeoutMs = 1000 } = {}) {
		if (!bridgeUrl) {
			return { ok: false, status: 503, online: false, message: 'Bridge URL is not configured.' };
		}

		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), Math.max(150, Number(timeoutMs) || 1000));

		try {
			const response = await fetch(`${bridgeUrl}/internal/dashboard/ping`, {
				headers: { 'x-dashboard-bridge-token': bridgeToken },
				signal: controller.signal
			});

			clearTimeout(timer);

			if (!response.ok) {
				return { ok: false, status: response.status, online: false };
			}

			const data = await response.json().catch(() => ({}));

			return {
				ok: true,
				online: Boolean(data?.online),
				waConnected: Boolean(data?.waConnected),
				pid: Number(data?.pid) || null,
				uptimeSeconds: Number(data?.uptimeSeconds) || 0
			};
		} catch {
			clearTimeout(timer);
			return { ok: false, status: 503, online: false, message: 'Bridge is not reachable.' };
		}
	}

	async function sendConfirmation({ to, approveButtonId, rejectButtonId, phoneNumber }) {
		if (!bridgeUrl) {
			return { ok: false };
		}

		try {
			const response = await fetch(`${bridgeUrl}/internal/dashboard/send-confirmation`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-dashboard-bridge-token': bridgeToken
				},
				body: JSON.stringify({ to, approveButtonId, rejectButtonId, phoneNumber })
			});

			if (!response.ok) {
				return { ok: false };
			}

			const payload = await response.json().catch(() => ({}));

			return { ok: payload?.ok === true };
		} catch {
			return { ok: false };
		}
	}

	async function sendRuntimeSync({ type, payload }) {
		return callBridge('/internal/dashboard/runtime-sync', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ type, payload })
		});
	}

	async function fetchBotLogs({ since = 0, limit = 200 } = {}) {
		const params = new URLSearchParams({
			since: String(Number(since) || 0),
			limit: String(Math.max(1, Math.min(500, Number(limit) || 200)))
		});

		return callBridge(`/internal/dashboard/logs?${params.toString()}`);
	}

	async function requestBotRestart() {
		return callBridge('/internal/dashboard/restart', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' }
		});
	}

	return {
		sendConfirmation,
		sendRuntimeSync,
		fetchBotLogs,
		requestBotRestart,
		pingBot,
		isConfigured: Boolean(bridgeUrl)
	};
}
