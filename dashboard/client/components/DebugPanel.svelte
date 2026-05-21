<script>
	import { logs, status } from '../lib/stores.js';
	import {
		debugState,
		resetDebugState,
		setBypassDismiss,
		setForcedHardwareLevel
	} from '../lib/debug.js';

	export let renderCount = 0;

	const HARDWARE_LEVELS = [
		{ value: 0, label: 'Off', tone: 'muted' },
		{ value: 1, label: 'Warning', tone: 'warning' },
		{ value: 2, label: 'Danger', tone: 'danger' },
		{ value: 3, label: 'Critical', tone: 'critical' }
	];

	$: forcedLevel = Number($debugState.forcedHardwareLevel || 0);
	$: bypassDismiss = Boolean($debugState.bypassDismiss);
	$: logCount = $logs.length;
	$: socketState = $status.connected ? 'on' : 'off';
</script>

<div class="debug-panel" role="region" aria-label="Debug panel">
	<div class="row meta">
		<span class="dot" class:on={$status.connected}></span>
		<span class="meta-item">renders <strong>{renderCount}</strong></span>
		<span class="meta-item">logs <strong>{logCount}</strong></span>
		<span class="meta-item">socket <strong>{socketState}</strong></span>
		<span class="meta-item">cpu <strong>{$status.cpuPercent.toFixed(1)}%</strong></span>
		<span class="meta-item">mem <strong>{
			$status.totalMemory > 0
				? Math.round((($status.totalMemory - $status.freeMemory) / $status.totalMemory) * 100)
				: 0
		}%</strong></span>
		<button class="reset" type="button" on:click={resetDebugState}>Reset</button>
	</div>

	<div class="row controls">
		<span class="group-label">Hardware banner</span>
		<div class="segmented" role="radiogroup" aria-label="Force hardware warning level">
			{#each HARDWARE_LEVELS as level (level.value)}
				<button
					type="button"
					class="seg tone-{level.tone}"
					class:active={forcedLevel === level.value}
					role="radio"
					aria-checked={forcedLevel === level.value}
					on:click={() => setForcedHardwareLevel(level.value)}
				>
					{level.label}
				</button>
			{/each}
		</div>

		<label class="check">
			<input
				type="checkbox"
				checked={bypassDismiss}
				on:change={(event) => setBypassDismiss(event.currentTarget.checked)}
			/>
			<span>Bypass 60s dismiss window</span>
		</label>
	</div>
</div>

<style>
	.debug-panel {
		position: sticky;
		top: 45px;
		z-index: 29;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0.5rem var(--space-5);
		background: color-mix(in srgb, var(--bg) 86%, #000 8%);
		color: #87f0c1;
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		font-size: var(--fs-xs);
		border-bottom: 1px solid var(--border);
	}

	.row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.meta {
		color: var(--muted);
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #ff8e74;
		flex-shrink: 0;
	}

	.dot.on {
		background: #87f0c1;
		box-shadow: 0 0 6px rgba(135, 240, 193, 0.5);
	}

	.meta-item {
		display: inline-flex;
		gap: 0.3rem;
		align-items: baseline;
	}

	.meta-item strong {
		color: var(--text);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.reset {
		margin-left: auto;
		background: transparent;
		border: 1px solid var(--border);
		color: var(--muted);
		font-family: inherit;
		font-size: inherit;
		padding: 0.18rem 0.6rem;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: border-color var(--tx-base), color var(--tx-base);
	}

	.reset:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.controls {
		gap: var(--space-3);
	}

	.group-label {
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
		font-weight: 600;
	}

	.segmented {
		display: inline-flex;
		gap: 0;
		border: 1px solid var(--border);
		border-radius: var(--radius-pill);
		overflow: hidden;
	}

	.seg {
		background: transparent;
		border: none;
		color: var(--muted);
		font-family: inherit;
		font-size: inherit;
		padding: 0.2rem 0.7rem;
		cursor: pointer;
		transition: background var(--tx-base), color var(--tx-base);
	}

	.seg + .seg {
		border-left: 1px solid var(--border);
	}

	.seg:hover {
		color: var(--text);
		background: rgba(255, 255, 255, 0.04);
	}

	.seg.active.tone-muted {
		background: rgba(135, 240, 193, 0.18);
		color: #87f0c1;
	}

	.seg.active.tone-warning {
		background: rgba(240, 200, 135, 0.22);
		color: #f0c887;
	}

	.seg.active.tone-danger {
		background: rgba(255, 142, 116, 0.24);
		color: #ff8e74;
	}

	.seg.active.tone-critical {
		background: rgba(255, 90, 90, 0.28);
		color: #ff5a5a;
	}

	.check {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		color: var(--muted);
		cursor: pointer;
		user-select: none;
	}

	.check input {
		accent-color: var(--accent);
		cursor: pointer;
	}

	@media (max-width: 720px) {
		.debug-panel {
			padding: 0.5rem var(--space-3);
		}

		.controls {
			align-items: flex-start;
			flex-direction: column;
			gap: 0.5rem;
		}
	}
</style>
