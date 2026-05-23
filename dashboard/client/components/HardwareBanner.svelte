<script>
	import { cubicOut } from 'svelte/easing';
	import { writable } from 'svelte/store';
	import { fly } from 'svelte/transition';

	import { debugState } from '../lib/debug.js';
	import { status } from '../lib/stores.js';

	const PERCENT_THRESHOLDS = {
		warning: 75,
		danger: 90,
		critical: 97
	};

	const HEAP_LEAK_WINDOW = 60;
	const HEAP_LEAK_MIN_RATIO = 0.7;
	const HEAP_LEAK_LEVELS = [
		{ level: 3, growthMB: 100, floorMB: 1024 },
		{ level: 2, growthMB: 60, floorMB: 512 },
		{ level: 1, growthMB: 30, floorMB: 200 }
	];

	const DISMISS_WINDOW_MS = 60_000;
	const dismissedUntil = writable(0);

	let heapSamples = [];

	$: cpuPercent = Number($status.cpuPercent || 0);
	$: memoryPercent = $status.totalMemory > 0
		? (($status.totalMemory - $status.freeMemory) / $status.totalMemory) * 100
		: 0;
	$: rssPercent = $status.totalMemory > 0
		? ($status.rss / $status.totalMemory) * 100
		: 0;
	$: heapLeak = trackHeap($status.heapUsed, heapSamples);

	$: alerts = computeAlerts({ cpuPercent, memoryPercent, rssPercent, heapLeak });
	$: realLevel = alerts.reduce((max, alert) => Math.max(max, alert.level), 0);
	$: forcedLevel = Number($debugState.forcedHardwareLevel || 0);
	$: maxLevel = forcedLevel > 0 ? forcedLevel : realLevel;
	$: displayAlerts = forcedLevel > 0 ? buildForcedAlerts(forcedLevel) : alerts;
	$: bypassDismiss = Boolean($debugState.bypassDismiss);
	$: visible = maxLevel > 0 && (bypassDismiss || forcedLevel > 0 || Date.now() > $dismissedUntil);
	$: levelMeta = describeLevel(maxLevel);

	function trackHeap(value, samples) {
		const next = Number(value) || 0;

		if (next <= 0) {
			return computeHeapLeak(samples);
		}

		samples.push(next);

		if (samples.length > HEAP_LEAK_WINDOW) {
			samples.splice(0, samples.length - HEAP_LEAK_WINDOW);
		}

		heapSamples = samples;

		return computeHeapLeak(samples);
	}

	function computeHeapLeak(samples) {
		const minSamples = Math.floor(HEAP_LEAK_WINDOW * HEAP_LEAK_MIN_RATIO);

		if (!samples || samples.length < minSamples) {
			return { level: 0, growthMB: 0, currentMB: 0 };
		}

		const half = Math.floor(samples.length / 2);
		const firstSorted = samples.slice(0, half).sort((a, b) => a - b);
		const secondSorted = samples.slice(half).sort((a, b) => a - b);
		const firstMedian = firstSorted[Math.floor(firstSorted.length / 2)];
		const secondMedian = secondSorted[Math.floor(secondSorted.length / 2)];
		const growthMB = (secondMedian - firstMedian) / (1024 * 1024);
		const currentMB = samples[samples.length - 1] / (1024 * 1024);

		for (const rule of HEAP_LEAK_LEVELS) {
			if (growthMB >= rule.growthMB && currentMB >= rule.floorMB) {
				return { level: rule.level, growthMB, currentMB };
			}
		}

		return { level: 0, growthMB, currentMB };
	}

	function buildForcedAlerts(level) {
		return [
			{ name: 'CPU', value: '88.0', level, suffix: '%' },
			{ name: 'Memory', value: '91.2', level, suffix: '%' },
			{ name: 'Process', value: '78.5', level, suffix: '%' },
			{ name: 'Heap leak', value: '+72', level, suffix: ' MB/min' }
		];
	}

	function classifyPercent(value) {
		if (value >= PERCENT_THRESHOLDS.critical) {
			return 3;
		}

		if (value >= PERCENT_THRESHOLDS.danger) {
			return 2;
		}

		if (value >= PERCENT_THRESHOLDS.warning) {
			return 1;
		}

		return 0;
	}

	function computeAlerts({ cpuPercent, memoryPercent, rssPercent, heapLeak }) {
		const list = [];
		const pushPercent = (name, value) => {
			const level = classifyPercent(value);

			if (level > 0) {
				list.push({ name, value: Number(value).toFixed(1), level, suffix: '%' });
			}
		};

		pushPercent('CPU', cpuPercent);
		pushPercent('Memory', memoryPercent);
		pushPercent('Process Mem', rssPercent);

		if (heapLeak.level > 0) {
			list.push({
				name: 'Heap leak',
				value: '+' + heapLeak.growthMB.toFixed(0),
				level: heapLeak.level,
				suffix: ' MB/min'
			});
		}

		return list;
	}

	function describeLevel(level) {
		if (level === 3) {
			return { tone: 'critical', label: 'Critical', headline: 'System resources critically saturated' };
		}

		if (level === 2) {
			return { tone: 'danger', label: 'Danger', headline: 'System under heavy load' };
		}

		if (level === 1) {
			return { tone: 'warning', label: 'Warning', headline: 'Resource usage elevated' };
		}

		return { tone: 'info', label: '', headline: '' };
	}

	function dismiss() {
		dismissedUntil.set(Date.now() + DISMISS_WINDOW_MS);
	}
</script>

{#if visible}
	<div
		class="hw-banner tone-{levelMeta.tone}"
		role="status"
		aria-live="polite"
		transition:fly={{ y: -16, duration: 220, easing: cubicOut }}
	>
		<span class="badge" aria-hidden="true">
			{#if maxLevel === 3}
				⚠
			{:else if maxLevel === 2}
				!
			{:else}
				ⓘ
			{/if}
		</span>
		<div class="copy">
			<span class="title">
				<span class="level">{levelMeta.label}</span>
				<span class="headline">{levelMeta.headline}</span>
				{#if forcedLevel > 0}
					<span class="forced-tag" aria-label="Debug forced banner">debug</span>
				{/if}
			</span>
			<ul class="stats">
				{#each displayAlerts as alert (alert.name)}
					<li class="stat tone-{describeLevel(alert.level).tone}">
						<span class="stat-name">{alert.name}</span>
						<span class="stat-value">{alert.value}{alert.suffix}</span>
					</li>
				{/each}
			</ul>
		</div>
		<button class="dismiss" type="button" aria-label="Dismiss" on:click={dismiss}>×</button>
	</div>
{/if}

<style>
	.hw-banner {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		margin: 0 var(--space-5);
		margin-top: var(--space-3);
		border-radius: var(--radius-md);
		border: 1px solid;
		background: color-mix(in srgb, var(--panel) 85%, transparent);
		box-shadow: var(--shadow-sm);
	}

	.hw-banner.tone-warning {
		border-color: color-mix(in srgb, #f0c887 55%, var(--border));
		background: color-mix(in srgb, #f0c887 12%, var(--panel));
	}

	.hw-banner.tone-danger {
		border-color: color-mix(in srgb, #ff8e74 65%, var(--border));
		background: color-mix(in srgb, #ff8e74 14%, var(--panel));
	}

	.hw-banner.tone-critical {
		border-color: color-mix(in srgb, #ff5a5a 70%, var(--border));
		background: color-mix(in srgb, #ff5a5a 16%, var(--panel));
		animation: hw-pulse 1.6s ease-in-out infinite;
	}

	.badge {
		flex-shrink: 0;
		display: inline-grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		font-weight: 700;
		font-size: var(--fs-md);
		line-height: 1;
	}

	.tone-warning .badge {
		background: rgba(240, 200, 135, 0.22);
		color: #f0c887;
	}

	.tone-danger .badge {
		background: rgba(255, 142, 116, 0.24);
		color: #ff8e74;
	}

	.tone-critical .badge {
		background: rgba(255, 90, 90, 0.28);
		color: #ff5a5a;
	}

	.copy {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		flex: 1;
		min-width: 0;
	}

	.title {
		display: inline-flex;
		gap: 0.55rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.level {
		font-size: var(--fs-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		padding: 0.1rem 0.55rem;
		border-radius: var(--radius-pill);
		background: rgba(255, 255, 255, 0.06);
	}

	.tone-warning .level {
		color: #f0c887;
	}

	.tone-danger .level {
		color: #ff8e74;
	}

	.tone-critical .level {
		color: #ff5a5a;
	}

	.headline {
		color: var(--text);
		font-weight: 600;
		font-size: var(--fs-sm);
	}

	.forced-tag {
		font-size: var(--fs-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		padding: 0.1rem 0.5rem;
		border-radius: var(--radius-pill);
		background: rgba(135, 240, 193, 0.18);
		color: #87f0c1;
		border: 1px dashed rgba(135, 240, 193, 0.4);
	}

	.stats {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.stat {
		display: inline-flex;
		gap: 0.35rem;
		align-items: center;
		font-size: var(--fs-xs);
		padding: 0.18rem 0.55rem;
		border-radius: var(--radius-pill);
		border: 1px solid var(--border);
		font-variant-numeric: tabular-nums;
	}

	.stat-name {
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 600;
	}

	.stat-value {
		color: var(--text);
		font-weight: 700;
	}

	.stat.tone-warning {
		background: rgba(240, 200, 135, 0.14);
		border-color: rgba(240, 200, 135, 0.35);
	}

	.stat.tone-warning .stat-value {
		color: #f0c887;
	}

	.stat.tone-danger {
		background: rgba(255, 142, 116, 0.16);
		border-color: rgba(255, 142, 116, 0.4);
	}

	.stat.tone-danger .stat-value {
		color: #ff8e74;
	}

	.stat.tone-critical {
		background: rgba(255, 90, 90, 0.18);
		border-color: rgba(255, 90, 90, 0.5);
	}

	.stat.tone-critical .stat-value {
		color: #ff5a5a;
	}

	.dismiss {
		flex-shrink: 0;
		background: transparent;
		border: none;
		color: var(--muted);
		font-size: 1.3rem;
		line-height: 1;
		padding: 0.25rem 0.45rem;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: color var(--tx-base), background var(--tx-base);
	}

	.dismiss:hover {
		color: var(--text);
		background: rgba(255, 255, 255, 0.06);
	}

	@keyframes hw-pulse {
		0%, 100% {
			box-shadow: 0 0 0 0 rgba(255, 90, 90, 0.32);
		}
		50% {
			box-shadow: 0 0 0 4px rgba(255, 90, 90, 0);
		}
	}

	@media (max-width: 640px) {
		.hw-banner {
			margin: var(--space-2) var(--space-3) 0;
		}

		.title {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.3rem;
		}
	}
</style>
