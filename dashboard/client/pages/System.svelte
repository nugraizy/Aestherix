<script>
	import { clearSystemCache, getSystemCache, getSystemEnv, getSystemHealth, purgeAuditLog, getSessions, revokeSession } from '../lib/api.js';
	import { showConfirm } from '../lib/confirm.js';
	import { showError, showSuccess } from '../lib/toast.js';
	import { status } from '../lib/stores.js';
	import ButtonPill from '../components/ui/ButtonPill.svelte';
	import Tooltip from '../components/ui/Tooltip.svelte';
	import SkeletonCard from '../components/ui/SkeletonCard.svelte';

	export let isSuperOwner = false;
	export let active = true;
	export let debug = false;
	export let onStart = () => {};
	export let onStop = () => {};
	export let onRestart = () => {};

	$: botOnline = $status.botOnline;
	$: pm2 = $status.pm2;
	$: restartDisabled = $status.botMode === 'split' && !botOnline;
	let wasActive = false;
	let loaded = false;

	let health = null;
	let caches = null;
	let env = null;
	let sessions = [];
	let loading = true;

	$: if (active && !wasActive) { wasActive = true; if (!loaded) void loadHealth(); }
	$: if (!active && wasActive) { wasActive = false; }

	async function loadHealth() {
		loading = true;
		try {
			const promises = [getSystemHealth(), getSystemCache()];

			if (isSuperOwner) {
				promises.push(getSystemEnv());
				promises.push(getSessions());
			}

			const [h, c, e, s] = await Promise.all(promises);

			health = h;
			caches = c;
			env = e?.keys || [];
			sessions = s?.sessions || [];
			loaded = true;
		} catch (error) {
			showError(error?.message || 'Failed to load system info.');
		}
		loading = false;
	}

	function statusDot(ok) {
		return ok ? 'dot-ok' : 'dot-err';
	}

	function flattenCaches(obj, prefix = '') {
		const result = [];

		for (const [key, value] of Object.entries(obj || {})) {
			if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
				result.push(...flattenCaches(value, prefix ? `${prefix}.${key}` : key));
			} else {
				result.push({ name: prefix ? `${prefix}.${key}` : key, size: Number(value || 0) });
			}
		}

		return result;
	}

	$: cacheEntries = flattenCaches(caches);
	$: totalCacheSize = cacheEntries.reduce((sum, entry) => sum + entry.size, 0);

	async function handleClearCache(name) {
		const ok = await showConfirm({
			title: 'Clear cache',
			message: `Clear the "${name}" cache? This is non-destructive but may cause temporary slowdowns.`,
			confirmLabel: 'Clear',
			danger: true
		});

		if (!ok) {
			return;
		}

		try {
			await clearSystemCache(name);
			showSuccess(`Cache "${name}" cleared.`);

			const fresh = await getSystemCache();

			caches = fresh;
		} catch (error) {
			showError(error?.message || 'Failed to clear cache.');
		}
	}

	async function handleRevoke(id) {
		const ok = await showConfirm({
			title: 'Revoke session',
			message: `Revoke session ${id}? The user will be logged out.`,
			confirmLabel: 'Revoke',
			danger: true
		});

		if (!ok) {
			return;
		}

		try {
			await revokeSession(id);
			sessions = sessions.filter((s) => s.id !== id);
			showSuccess('Session revoked.');
		} catch (error) {
			showError(error?.message || 'Failed to revoke session.');
		}
	}

	async function handlePurgeAudit() {
		const ok = await showConfirm({
			title: 'Purge audit log',
			message: 'This will permanently delete all audit log entries. Continue?',
			confirmLabel: 'Purge',
			danger: true
		});

		if (!ok) {
			return;
		}

		try {
			await purgeAuditLog();
			showSuccess('Audit log purged.');
		} catch (error) {
			showError(error?.message || 'Failed to purge audit log.');
		}
	}
</script>

<div class="system-page">
	<header class="page-head">
		<h2><i class="nf nf-fa-server"></i> System</h2>
		<p class="page-sub">Health diagnostics, cache stats, and environment.</p>
	</header>

	{#if loading}
		<SkeletonCard count={4} />
	{:else}
		<div class="grid">
			<section class="section card">
				<header class="section-head">
					<h3 class="section-title">Health</h3>
				</header>
				<div class="section-body">
					{#if health}
						<div class="health-grid">
							<div class="health-row">
								<span class="dot {statusDot(health.database?.connected)}"></span>
								<span class="health-label">Database</span>
								<span class="health-value">{health.database?.provider || 'unknown'}</span>
							</div>
							<div class="health-row">
								<span class="dot {statusDot(health.bot?.waConnected)}"></span>
								<span class="health-label">WhatsApp</span>
								<span class="health-value">{health.bot?.waConnected ? 'Connected' : 'Disconnected'}</span>
							</div>
							<div class="health-row">
								<span class="dot {statusDot(health.bot?.embedded)}"></span>
								<span class="health-label">Mode</span>
								<span class="health-value">{health.bot?.embedded ? 'Embedded' : 'Split'}</span>
							</div>
							<div class="health-row">
								<span class="dot {statusDot(health.mqtt?.connected)}"></span>
								<span class="health-label">MQTT</span>
								<span class="health-value">{health.mqtt?.connected ? 'Connected' : 'Disconnected'}</span>
							</div>
							<div class="health-row">
								<span class="dot {statusDot(health.bridge?.configured)}"></span>
								<span class="health-label">Bridge</span>
								<span class="health-value">{health.bridge?.configured ? 'Configured' : 'Not configured'}</span>
							</div>
							<div class="health-row">
								<span class="dot dot-ok"></span>
								<span class="health-label">Session</span>
								<span class="health-value">{health.bot?.sessionName || '—'}</span>
							</div>
							<div class="health-row">
								<span class="dot dot-ok"></span>
								<span class="health-label">Profile pictures</span>
								<span class="health-value">{health.profilePictures?.cacheSize || 0} cached</span>
							</div>
						</div>
					{:else}
						<p class="empty">No health data.</p>
					{/if}
				</div>
			</section>

			<section class="section card">
				<header class="section-head">
					<h3 class="section-title">Caches <span class="section-count">{totalCacheSize} entries</span></h3>
				</header>
				<div class="section-body">
					{#if cacheEntries.length}
						<div class="cache-grid">
							{#each cacheEntries as entry (entry.name)}
								<div class="cache-row">
									<span class="cache-name">{entry.name}</span>
									<span class="cache-size">{entry.size}</span>
									{#if isSuperOwner && entry.size > 0}
										<button
											class="clear-btn"
											type="button"
											on:click={() => handleClearCache(entry.name)}
										>
											clear
										</button>
									{/if}
								</div>
							{/each}
						</div>
					{:else}
						<p class="empty">No cache data.</p>
					{/if}
				</div>
			</section>

			{#if isSuperOwner}
			<section class="section card">
				<header class="section-head">
					<h3 class="section-title">Sessions <span class="section-count">{sessions.length}</span></h3>
				</header>
				<div class="section-body">
					{#if sessions.length}
						<div class="sessions-grid">
							{#each sessions as sess (sess.id)}
								<div class="session-row">
									<span class="sess-id">{sess.id}</span>
									<span class="sess-role">{sess.role}</span>
									<span class="sess-phone">{sess.phoneNumber || sess.name || '—'}</span>
									<button class="clear-btn" type="button" on:click={() => handleRevoke(sess.id)}>revoke</button>
								</div>
							{/each}
						</div>
					{:else}
						<p class="empty">No active sessions.</p>
					{/if}
				</div>
			</section>
			{/if}

			{#if isSuperOwner}
			<section class="section card">
				<header class="section-head">
					<h3 class="section-title">Environment</h3>
				</header>
				<div class="section-body">
					{#if env && env.length}
						<div class="env-grid">
							{#each env as item (item.key)}
								<div class="env-row">
									<span class="dot {statusDot(item.set)}"></span>
									<Tooltip text={item.set ? 'Set' : 'Not set'} placement="left">
										<span class="env-key" class:unset={!item.set}>{item.key}</span>
									</Tooltip>
								</div>
							{/each}
						</div>
					{:else}
						<p class="empty">No environment data.</p>
					{/if}
				</div>
			</section>
			{/if}
		</div>

		{#if isSuperOwner}
			<div class="maintenance-bar">
				<span class="maint-label">Tools</span>
				<ButtonPill>
					<button type="button" on:click={() => debug = !debug}>
						🐛 {debug ? 'Hide' : 'Show'} Debug
					</button>
					{#if pm2}
						<button type="button" class={botOnline ? 'stop' : 'start'} on:click={botOnline ? onStop : onStart}>
							{botOnline ? 'Stop' : 'Start'}
						</button>
						<button type="button" class="danger" on:click={onRestart} disabled={restartDisabled}>
							Restart
						</button>
					{/if}
				</ButtonPill>
				<button class="btn danger-btn" type="button" on:click={handlePurgeAudit}>
					Purge Audit Log
				</button>
			</div>
		{/if}
	{/if}
</div>

<style>
	.system-page {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.page-head {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.page-head h2 {
		margin: 0;
		font-size: var(--fs-xl);
		letter-spacing: -0.01em;
	}

	.page-sub {
		margin: 0;
		color: var(--muted);
		font-size: var(--fs-sm);
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-4);
	}

	.card {
		min-height: 0;
	}

	.health-grid, .cache-grid, .env-grid {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.health-row, .cache-row, .env-row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: 0.3rem 0.4rem;
		border-radius: var(--radius-sm);
		transition: background var(--tx-base);
	}

	.health-row:hover, .cache-row:hover, .env-row:hover {
		background: color-mix(in srgb, var(--accent) 6%, transparent);
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.dot-ok {
		background: #87f0c1;
	}

	.dot-err {
		background: #ff8e74;
	}

	.health-label {
		font-size: var(--fs-sm);
		color: var(--muted);
		flex: 1;
	}

	.health-value {
		font-size: var(--fs-sm);
		color: var(--text);
		font-weight: 600;
	}

	.cache-name {
		font-size: var(--fs-sm);
		color: var(--text);
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		flex: 1;
	}

	.cache-size {
		font-size: var(--fs-sm);
		color: var(--accent);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.env-key {
		font-size: var(--fs-sm);
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		color: var(--text);
	}

	.env-key.unset {
		color: var(--muted);
		opacity: 0.6;
	}

	.sessions-grid {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.session-row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: 0.3rem 0.4rem;
		border-radius: var(--radius-sm);
	}

	.session-row:hover {
		background: color-mix(in srgb, var(--accent) 6%, transparent);
	}

	.sess-id {
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		font-size: var(--fs-xs);
		color: var(--accent);
		font-weight: 600;
	}

	.sess-role {
		font-size: var(--fs-xs);
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.sess-phone {
		font-size: var(--fs-sm);
		color: var(--text);
		flex: 1;
	}

	.clear-btn {
		font-size: var(--fs-xs);
		padding: 0.15rem 0.45rem;
		border-radius: var(--radius-pill);
		border: 1px solid var(--border);
		background: transparent;
		color: var(--muted);
		cursor: pointer;
		transition: border-color var(--tx-base), color var(--tx-base);
	}

	.clear-btn:hover {
		border-color: #ff8e74;
		color: #ff8e74;
	}

	.danger-btn {
		background: rgba(255, 142, 116, 0.16);
		color: #ff8e74;
		border: 1px solid rgba(255, 142, 116, 0.4);
		padding: 0.45rem 1rem;
		border-radius: var(--radius-sm);
		font-size: var(--fs-sm);
		font-weight: 600;
		cursor: pointer;
		transition: background var(--tx-base), border-color var(--tx-base);
	}

	.danger-btn:hover {
		background: rgba(255, 142, 116, 0.28);
		border-color: #ff8e74;
	}

	.maintenance-bar {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
		padding: var(--space-2) var(--space-3);
		border: 1px solid color-mix(in srgb, #ff8e74 30%, var(--border));
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, #ff8e74 5%, transparent);
	}

	.maint-label {
		font-size: var(--fs-xs);
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 600;
	}

	.tool-btn {
		background: color-mix(in srgb, var(--accent) 14%, transparent);
		color: var(--accent);
		border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
		padding: 0.45rem 1rem;
		border-radius: var(--radius-sm);
		font-size: var(--fs-sm);
		font-weight: 600;
		cursor: pointer;
		transition: background var(--tx-base), border-color var(--tx-base);
	}

	.tool-btn:hover {
		background: color-mix(in srgb, var(--accent) 24%, transparent);
		border-color: var(--accent);
	}

	.maintenance-bar :global(.pill button.start) {
		color: #87f0c1;
	}

	.maintenance-bar :global(.pill button.start:hover:not(:disabled)) {
		background: rgba(135, 240, 193, 0.16);
		color: #87f0c1;
	}

	.maintenance-bar :global(.pill button.stop) {
		color: #f0c887;
	}

	.maintenance-bar :global(.pill button.stop:hover:not(:disabled)) {
		background: rgba(240, 200, 135, 0.18);
		color: #f0c887;
	}

	@media (max-width: 700px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}

	@media (pointer: coarse) {
		.clear-btn {
			padding: 0.35rem 0.7rem;
		}
	}
</style>
