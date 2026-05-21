<script>
	import { onDestroy, onMount } from 'svelte';
	import { post } from '../lib/api.js';
	import { watchConfirmation } from '../lib/confirmation.js';
	import { showError } from '../lib/toast.js';
	import Footer from './ui/Footer.svelte';

	export let onLogin = () => {};

	let phone = '';
	let viewerName = '';
	let mode = 'owner';
	let step = 'phone';
	let loading = false;
	let viewerLoading = false;
	let requestId = '';
	let requestKey = '';
	let cancelWatch = null;
	let inlineError = '';
	let statusLabel = '';
	let cooldownSeconds = 0;
	let cooldownTimer = null;
	let errorTimer = null;

	let serverInfo = { version: '', loaded: false };
	let now = new Date();
	let clockTimer = null;

	function startCooldown(seconds) {
		clearCooldown();
		cooldownSeconds = seconds;
		cooldownTimer = setInterval(() => {
			cooldownSeconds -= 1;

			if (cooldownSeconds <= 0) {
				clearCooldown();
			}
		}, 1000);
	}

	function clearCooldown() {
		cooldownSeconds = 0;

		if (cooldownTimer) {
			clearInterval(cooldownTimer);
			cooldownTimer = null;
		}
	}

	function disposeWatch() {
		if (cancelWatch) {
			cancelWatch();
			cancelWatch = null;
		}
	}

	onMount(async () => {
		clockTimer = setInterval(() => {
			now = new Date();
		}, 30_000);

		try {
			const response = await fetch('/api/dashboard/auth/session', { credentials: 'include' });

			if (response.ok) {
				const data = await response.json();

				serverInfo = { version: data?.version || '', loaded: true };
			}
		} catch {
			serverInfo = { version: '', loaded: true };
		}
	});

	onDestroy(() => {
		disposeWatch();
		clearCooldown();

		if (clockTimer) {
			clearInterval(clockTimer);
		}

		if (errorTimer) {
			clearTimeout(errorTimer);
		}
	});

	async function requestCode() {
		if (loading || phone.length < 10) {
			return;
		}

		loading = true;
		inlineError = '';

		try {
			const data = await post('/auth/request-code', { phoneNumber: phone });

			requestId = data.requestId;
			requestKey = data.requestKey;
			step = 'waiting';
			statusLabel = 'Waiting for WhatsApp confirmation...';
			watch();
		} catch (error) {
			const message = error?.message || 'Failed to send confirmation.';

			inlineError = message;
			showError(message);

			if (error?.retryAfter) {
				startCooldown(error.retryAfter);
			}
		}

		loading = false;
	}

	function watch() {
		disposeWatch();

		cancelWatch = watchConfirmation({
			phoneNumber: phone,
			requestId,
			requestKey,
			onStatus(status) {
				if (status === 'approved') {
					statusLabel = 'Approved — finalizing session...';
					void finalize();
				} else if (status === 'rejected') {
					statusLabel = '';
					inlineError = 'Login rejected.';
					showError('Login rejected.');
					step = 'phone';
				} else {
					statusLabel = 'Waiting for WhatsApp confirmation...';
				}
			},
			onError(message) {
				inlineError = message;
				showError(message);
				statusLabel = '';
				step = 'phone';
			}
		});
	}

	async function finalize() {
		try {
			await post('/auth/finalize-confirmation', { requestId, requestKey });
			disposeWatch();
			onLogin({ role: 'owner' });
		} catch (error) {
			inlineError = error?.message || 'Login failed.';
			showError(inlineError);
			statusLabel = '';
			step = 'phone';
		}
	}

	async function loginAsViewer() {
		if (viewerLoading) {
			return;
		}

		viewerLoading = true;
		inlineError = '';

		try {
			const trimmed = (viewerName || '').trim();
			const body = trimmed ? { name: trimmed } : {};

			await post('/auth/viewer-login', body);
			onLogin({ role: 'viewer' });
		} catch (error) {
			const message = error?.message || 'Viewer login failed.';

			inlineError = message;
			showError(message);
		}

		viewerLoading = false;
	}

	function switchMode(next) {
		mode = next;
		inlineError = '';
		statusLabel = '';
		step = 'phone';
		disposeWatch();
	}

	$: clockLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	$: dateLabel = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
	$: if (inlineError) {
		if (errorTimer) clearTimeout(errorTimer);
		errorTimer = setTimeout(() => { inlineError = ''; }, 5000);
	}
</script>

<div class="login-shell">
	<div class="login-card">
		<aside class="info-panel">
			<header class="info-brand">
				<span class="logo" aria-hidden="true">✦</span>
				<span class="title">Aestherix</span>
			</header>
			<p class="lede">Operate the bot from anywhere. Real-time status, live logs, audit trail and one-click toggles.</p>
			<ul class="features">
				<li><span class="bullet">●</span> Live status, hardware monitor & log stream</li>
				<li><span class="bullet">●</span> Toggle commands and runtime flags instantly</li>
				<li><span class="bullet">●</span> Browse profile-picture history with color filters</li>
				<li><span class="bullet">●</span> Edit command files with a built-in code editor</li>
			</ul>
			<footer class="info-foot">
				{#if serverInfo.version}
					<span class="badge mono">v{serverInfo.version}</span>
				{/if}
				<span class="time mono">{clockLabel}</span>
				<span class="date">{dateLabel}</span>
			</footer>
		</aside>

		<div class="form-panel">
			<header class="brand">
				<h1>Sign in</h1>
				<p class="tagline">Manage as the owner via WhatsApp, or browse as a viewer.</p>
			</header>

			<div class="tabs" role="tablist" aria-label="Login mode">
				<button
					type="button"
					class="tab"
					class:active={mode === 'owner'}
					on:click={() => switchMode('owner')}
					role="tab"
					aria-selected={mode === 'owner'}
				>
					Owner
				</button>
				<button
					type="button"
					class="tab"
					class:active={mode === 'viewer'}
					on:click={() => switchMode('viewer')}
					role="tab"
					aria-selected={mode === 'viewer'}
				>
					Viewer
				</button>
			</div>

			{#if mode === 'owner'}
				<section class="panel" role="tabpanel">
					{#if step === 'phone'}
						<label class="field">
							<span class="label">Phone number</span>
							<input
								type="text"
								bind:value={phone}
								placeholder="628123456789"
								minlength="10"
								on:keydown={(event) => event.key === 'Enter' && requestCode()}
							/>
						</label>
						<button class="primary" on:click={requestCode} disabled={loading || phone.length < 10 || cooldownSeconds > 0}>
							{#if cooldownSeconds > 0}
								Retry in {cooldownSeconds}s
							{:else}
								{loading ? 'Sending...' : 'Send WhatsApp Confirmation'}
							{/if}
						</button>
						<p class="hint">
							An approve / reject button will be sent to your WhatsApp.
						</p>
					{:else}
						<div class="waiting-card">
							<div class="spinner" aria-hidden="true"></div>
							<p class="waiting">{statusLabel || 'Waiting for WhatsApp confirmation...'}</p>
							<p class="hint">Check your WhatsApp for the approve / reject button.</p>
							<button type="button" class="ghost" on:click={() => switchMode('owner')}>Cancel</button>
						</div>
					{/if}
				</section>
			{:else}
				<section class="panel" role="tabpanel">
					<label class="field">
						<span class="label">Display name <span class="optional">(optional)</span></span>
						<input
							type="text"
							bind:value={viewerName}
							placeholder="Anonymous"
							maxlength="60"
							on:keydown={(event) => event.key === 'Enter' && loginAsViewer()}
						/>
					</label>
					<button class="primary" on:click={loginAsViewer} disabled={viewerLoading}>
						{viewerLoading ? 'Signing in...' : 'Continue as Viewer'}
					</button>
					<p class="hint">
						Read-only access. Browse status, logs, audit and albums but cannot change anything.
					</p>
				</section>
			{/if}

			{#if inlineError}
				<p class="error" role="alert">{inlineError}</p>
			{/if}
		</div>
	</div>

	<div class="footer-bleed">
		<Footer />
	</div>
</div>

<style>
	.login-shell {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 2rem 1rem 0;
		background:
			radial-gradient(1200px 600px at 18% -10%, color-mix(in srgb, var(--accent) 22%, transparent), transparent),
			radial-gradient(900px 500px at 110% 110%, color-mix(in srgb, var(--accent) 18%, transparent), transparent),
			var(--bg);
	}

	.footer-bleed {
		width: 100vw;
		margin-left: calc(50% - 50vw);
		margin-right: calc(50% - 50vw);
	}

	.login-card {
		display: grid;
		grid-template-columns: 1.05fr 1fr;
		max-width: 920px;
		width: 100%;
		margin: auto;
		background: color-mix(in srgb, var(--panel) 92%, transparent);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		box-shadow: var(--shadow-lg);
		backdrop-filter: blur(14px);
		overflow: hidden;
	}

	.info-panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-6);
		background:
			linear-gradient(135deg, color-mix(in srgb, var(--accent) 24%, transparent) 0%, transparent 65%),
			color-mix(in srgb, var(--bg) 70%, var(--panel));
		border-right: 1px solid var(--border);
		min-height: 100%;
	}

	.info-brand {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: var(--fs-md);
	}

	.info-brand .logo {
		color: var(--accent);
		font-size: 1.2rem;
	}

	.info-brand .title {
		font-weight: 700;
		letter-spacing: 0.02em;
	}

	.lede {
		margin: 0;
		font-size: var(--fs-md);
		line-height: 1.55;
		color: var(--text);
	}

	.features {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0.65rem;
		font-size: var(--fs-sm);
		color: color-mix(in srgb, var(--text) 85%, transparent);
	}

	.features li {
		display: inline-flex;
		gap: 0.5rem;
		align-items: flex-start;
		line-height: 1.4;
	}

	.bullet {
		color: var(--accent);
		font-size: 0.7rem;
		margin-top: 0.4em;
	}

	.info-foot {
		margin-top: auto;
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
		font-size: var(--fs-xs);
		color: var(--muted);
	}

	.badge {
		padding: 2px 8px;
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, var(--accent) 22%, transparent);
		color: var(--accent);
	}

	.mono {
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
	}

	.time {
		color: var(--text);
		font-weight: 600;
	}

	.date {
		text-transform: capitalize;
	}

	.form-panel {
		padding: var(--space-6) var(--space-5);
		display: grid;
		gap: var(--space-3);
		align-content: start;
	}

	.brand h1 {
		margin: 0;
		font-size: var(--fs-xl);
		letter-spacing: -0.01em;
	}

	.tagline {
		margin: 0.2rem 0 0;
		font-size: var(--fs-sm);
		color: var(--muted);
	}

	.tabs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.25rem;
		padding: 0.25rem;
		border-radius: var(--radius-pill);
		background: var(--bg);
		border: 1px solid var(--border);
	}

	.tab {
		background: transparent;
		border: none;
		padding: 0.45rem 0.6rem;
		font-size: var(--fs-sm);
		font-weight: 600;
		color: var(--muted);
		cursor: pointer;
		border-radius: var(--radius-pill);
		transition: background var(--tx-base), color var(--tx-base);
	}

	.tab:hover:not(.active) {
		color: var(--text);
	}

	.tab.active {
		background: color-mix(in srgb, var(--accent) 22%, transparent);
		color: var(--accent);
	}

	.panel {
		display: grid;
		gap: var(--space-3);
	}

	.field {
		display: grid;
		gap: 0.3rem;
	}

	.label {
		font-size: var(--fs-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
	}

	.optional {
		text-transform: none;
		letter-spacing: 0;
		color: color-mix(in srgb, var(--muted) 70%, transparent);
		font-weight: 400;
	}

	input {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 0.7rem 0.9rem;
		color: var(--text);
		font-size: var(--fs-md);
		outline: none;
		transition: border-color var(--tx-base), box-shadow var(--tx-base);
		width: 100%;
		box-sizing: border-box;
	}

	input:focus {
		border-color: var(--accent);
		box-shadow: var(--ring);
	}

	.primary {
		background: var(--accent);
		color: var(--bg);
		border: none;
		padding: 0.75rem;
		border-radius: var(--radius-sm);
		font-weight: 600;
		font-size: var(--fs-md);
		cursor: pointer;
		transition: filter 0.15s ease, transform 0.05s ease;
	}

	.primary:hover:not(:disabled) {
		filter: brightness(1.06);
	}

	.primary:active:not(:disabled) {
		transform: translateY(1px);
	}

	.primary:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.ghost {
		background: transparent;
		border: 1px solid var(--border);
		padding: 0.45rem 0.85rem;
		border-radius: var(--radius-sm);
		color: var(--muted);
		font-size: var(--fs-sm);
		cursor: pointer;
		justify-self: center;
	}

	.ghost:hover {
		color: var(--text);
		border-color: var(--accent);
	}

	.hint {
		margin: 0;
		font-size: var(--fs-sm);
		color: var(--muted);
		line-height: 1.45;
	}

	.error {
		margin: 0;
		font-size: var(--fs-sm);
		color: #ff8e74;
		text-align: center;
	}

	.waiting-card {
		display: grid;
		gap: 0.75rem;
		justify-items: center;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 3px solid color-mix(in srgb, var(--accent) 24%, transparent);
		border-top-color: var(--accent);
		animation: spin 0.9s linear infinite;
	}

	.waiting {
		margin: 0;
		font-size: var(--fs-md);
		color: var(--text);
		text-align: center;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 720px) {
		.login-card {
			grid-template-columns: 1fr;
			max-width: 480px;
		}

		.info-panel {
			border-right: none;
			border-bottom: 1px solid var(--border);
			padding: var(--space-4) var(--space-5);
		}

		.form-panel {
			padding: var(--space-5);
		}

		.features {
			display: none;
		}
	}
</style>
