<script>
	import { onMount } from 'svelte';

	import { getSettings, updateSettings } from '../lib/api.js';
	import { showConfirm } from '../lib/confirm.js';
	import { formatBytes } from '../lib/format.js';
	import { maintenanceMode, status } from '../lib/stores.js';
	import { showError, showSuccess } from '../lib/toast.js';

	export let isViewer = false;
	export let onLogout = null;

	let toggling = false;
	let hydrated = false;

	$: memUsedPct = $status.totalMemory > 0
		? Math.round(((($status.totalMemory - $status.freeMemory) / $status.totalMemory) * 100))
		: 0;

	$: heapPct = $status.heapTotal > 0
		? Math.round((($status.heapUsed / $status.heapTotal) * 100))
		: 0;

	$: load1 = Number($status.loadAverage?.[0] || 0).toFixed(2);

	$: isOnline = $status.connected && $status.botOnline !== false;
	$: stateLabel = !$status.connected
		? 'Offline'
		: $status.botOnline === false
			? 'Bot offline'
			: 'Online';

	onMount(async () => {
		if (isViewer) {
			return;
		}

		try {
			const data = await getSettings();

			maintenanceMode.set(Boolean(data?.settings?.maintenance));
			hydrated = true;
		} catch {
			hydrated = true;
		}
	});

	async function toggleMaintenance() {
		if (isViewer || toggling) {
			return;
		}

		const next = !$maintenanceMode;

		if (next) {
			const ok = await showConfirm({
				title: 'Enable maintenance mode',
				message: 'Non-owner messages will be replied to with a maintenance notice and skipped. Continue?',
				confirmLabel: 'Enable',
				danger: true
			});

			if (!ok) {
				return;
			}
		}

		toggling = true;

		try {
			const result = await updateSettings({ maintenance: next });

			maintenanceMode.set(Boolean(result?.settings?.maintenance ?? next));
			showSuccess(next ? 'Maintenance mode enabled.' : 'Maintenance mode disabled.');
		} catch (error) {
			showError(error?.message || 'Failed to toggle maintenance.');
		}

		toggling = false;
	}
</script>

<section class="status-grid">
	<header class="status-head">
		<div class="indicator-wrap" aria-hidden="true">
			<span class="indicator" class:online={isOnline}></span>
			<span class="indicator-glow" class:online={isOnline}></span>
		</div>
		<div class="head-meta">
			<span class="state">{stateLabel}</span>
			<span class="muted">↑ {$status.uptime || '—'}</span>
			{#if $status.version}
				<span class="version">v{$status.version}</span>
			{/if}
			{#if $status.platform}
				<span class="muted">{$status.platform}</span>
			{/if}
			{#if $status.nodeVersion}
				<span class="muted">{$status.nodeVersion}</span>
			{/if}
			{#if !isViewer && hydrated}
				<button
					class="maint-pill"
					class:on={$maintenanceMode}
					type="button"
					on:click={toggleMaintenance}
					disabled={toggling}
					aria-pressed={$maintenanceMode}
				>
					<span class="dot" aria-hidden="true"></span>
					Maintenance: {$maintenanceMode ? 'ON' : 'OFF'}
				</button>
			{/if}
		</div>
		{#if onLogout}
			<button class="logout-btn" type="button" on:click={onLogout}>Logout</button>
		{/if}
	</header>

	<div class="metrics">
		<article class="metric">
			<div class="metric-head">
				<span class="metric-label">CPU</span>
				<span class="metric-sub">{$status.cpuCount} cores</span>
			</div>
			<div class="metric-value">{$status.cpuPercent.toFixed(1)}<span class="unit">%</span></div>
			<div class="bar"><span style:width="{Math.min(100, $status.cpuPercent)}%"></span></div>
			<div class="metric-foot">
				<span>process {$status.processCpu.toFixed(1)}%</span>
				<span>load {load1}</span>
			</div>
		</article>

		<article class="metric">
			<div class="metric-head">
				<span class="metric-label">Memory</span>
				<span class="metric-sub">{formatBytes($status.totalMemory)} total</span>
			</div>
			<div class="metric-value">{memUsedPct}<span class="unit">%</span></div>
			<div class="bar"><span style:width="{memUsedPct}%"></span></div>
			<div class="metric-foot">
				<span>used {formatBytes($status.totalMemory - $status.freeMemory)}</span>
				<span>free {formatBytes($status.freeMemory)}</span>
			</div>
		</article>

		<article class="metric">
			<div class="metric-head">
				<span class="metric-label">Process</span>
				<span class="metric-sub">heap {heapPct}%</span>
			</div>
			<div class="metric-value">{formatBytes($status.rss)}</div>
			<div class="bar"><span style:width="{heapPct}%"></span></div>
			<div class="metric-foot">
				<span>heap {formatBytes($status.heapUsed)} / {formatBytes($status.heapTotal)}</span>
			</div>
		</article>

		<article class="metric">
			<div class="metric-head">
				<span class="metric-label">Bot</span>
				<span class="metric-sub">{$status.commandsEnabled}/{$status.commands} cmds on</span>
			</div>
			<div class="metric-value">{$status.commands}</div>
			<div class="metric-foot">
				<span>flags {$status.flagsEnabled}/{$status.flagsTotal}</span>
				<span>sessions {$status.sessions}</span>
			</div>
		</article>
	</div>
</section>

<style>
	.status-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
	}

	.status-head {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.logout-btn {
		margin-left: auto;
		background: transparent;
		border: 1px solid var(--border);
		color: var(--muted);
		font-size: var(--fs-xs);
		font-weight: 600;
		padding: 0.3rem 0.7rem;
		border-radius: var(--radius-pill);
		cursor: pointer;
		transition: border-color var(--tx-base), color var(--tx-base);
	}

	.logout-btn:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.indicator-wrap {
		position: relative;
		width: 14px;
		height: 14px;
		display: grid;
		place-items: center;
		flex-shrink: 0;
	}

	.indicator {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #ff8e74;
	}

	.indicator.online {
		background: #87f0c1;
	}

	.indicator-glow {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: #87f0c1;
		opacity: 0;
	}

	.indicator-glow.online {
		opacity: 0.4;
		animation: pulse 2s ease-out infinite;
	}

	.head-meta {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
		font-size: var(--fs-sm);
	}

	.state {
		color: var(--text);
		font-weight: 600;
	}

	.muted {
		color: var(--muted);
	}

	.version {
		color: var(--accent);
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
	}

	.maint-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.18rem 0.6rem;
		border-radius: var(--radius-pill);
		border: 1px solid var(--border);
		background: color-mix(in srgb, var(--bg) 70%, var(--panel));
		color: var(--muted);
		font-size: var(--fs-xs);
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		cursor: pointer;
		transition: border-color var(--tx-base), color var(--tx-base), background var(--tx-base);
	}

	.maint-pill:hover:not(:disabled) {
		border-color: var(--accent);
		color: var(--accent);
	}

	.maint-pill .dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: color-mix(in srgb, var(--muted) 60%, transparent);
	}

	.maint-pill.on {
		background: rgba(255, 142, 116, 0.18);
		color: #ff8e74;
		border-color: rgba(255, 142, 116, 0.45);
	}

	.maint-pill.on .dot {
		background: #ff8e74;
		box-shadow: 0 0 8px rgba(255, 142, 116, 0.6);
	}

	.maint-pill:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.metrics {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-3);
	}

	.metric {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: var(--space-3);
		background: color-mix(in srgb, var(--bg) 65%, var(--panel));
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
	}

	.metric-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-2);
	}

	.metric-label {
		font-size: var(--fs-xs);
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 600;
	}

	.metric-sub {
		font-size: var(--fs-xs);
		color: var(--muted);
	}

	.metric-value {
		font-size: var(--fs-xl);
		font-weight: 700;
		color: var(--text);
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}

	.metric-value .unit {
		font-size: var(--fs-md);
		color: var(--muted);
		font-weight: 500;
		margin-left: 2px;
	}

	.bar {
		width: 100%;
		height: 4px;
		background: color-mix(in srgb, var(--muted) 20%, transparent);
		border-radius: var(--radius-pill);
		overflow: hidden;
	}

	.bar span {
		display: block;
		height: 100%;
		background: linear-gradient(90deg, color-mix(in srgb, var(--accent) 90%, transparent), var(--accent));
		border-radius: inherit;
		transition: width 0.4s ease;
	}

	.metric-foot {
		display: flex;
		justify-content: space-between;
		gap: var(--space-2);
		font-size: var(--fs-xs);
		color: var(--muted);
		flex-wrap: wrap;
	}

	@keyframes pulse {
		0% {
			transform: scale(0.8);
			opacity: 0.4;
		}
		100% {
			transform: scale(2.2);
			opacity: 0;
		}
	}
</style>
