<script>
	import { onMount } from 'svelte';

	import { getCommandAnalytics } from '../lib/api.js';

	let data = {};
	let loading = true;

	$: days = buildDays(data);
	$: maxCount = Math.max(1, ...days.map((d) => d.count));

	onMount(async () => {
		try {
			const result = await getCommandAnalytics();

			data = result?.daily || {};
		} catch {
			data = {};
		}

		loading = false;
	});

	function buildDays(raw) {
		const byDay = {};

		for (const [key, count] of Object.entries(raw)) {
			const date = key.slice(0, 10);

			byDay[date] = (byDay[date] || 0) + count;
		}

		const sorted = Object.entries(byDay)
			.map(([date, count]) => ({ date, count }))
			.sort((a, b) => a.date.localeCompare(b.date));

		return sorted.slice(-30);
	}

	function formatDate(date) {
		const d = new Date(date + 'T00:00:00');

		return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	}
</script>

<section class="section daily-chart">
	<header class="section-head">
		<h3 class="section-title">Usage Over Time <span class="section-count">last 30 days</span></h3>
	</header>
	<div class="section-body">
		{#if loading}
			<div class="chart-skeleton">
				{#each Array(15) as _, i}
					<div class="skel-bar" style="animation-delay: {i * 40}ms"></div>
				{/each}
			</div>
		{:else if !days.length}
			<p class="empty">No daily usage data yet. Data starts collecting after the next command run.</p>
		{:else}
			<div class="chart">
				{#each days as day (day.date)}
					<div class="bar-col">
						<div class="bar" style:height="{(day.count / maxCount) * 100}%"></div>
						<span class="bar-label">{formatDate(day.date)}</span>
						<span class="bar-count">{day.count}</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
	.daily-chart .section-body {
		overflow-x: auto;
	}

	.chart {
		display: flex;
		align-items: flex-end;
		gap: 3px;
		height: 160px;
		padding: var(--space-2) 0;
	}

	.chart-skeleton {
		display: flex;
		align-items: flex-end;
		gap: 3px;
		height: 160px;
		padding: var(--space-2) 0;
	}

	.skel-bar {
		flex: 1;
		min-width: 28px;
		height: 100%;
		border-radius: var(--radius-sm) var(--radius-sm) 0 0;
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--panel) 70%, transparent) 0%,
			color-mix(in srgb, var(--accent) 18%, transparent) 100%
		);
		background-size: 100% 220%;
		background-position: 0% 100%;
		animation: shimmer 1.4s ease-in-out infinite;
	}

	@keyframes shimmer {
		0%   { background-position: 0% 100%; }
		100% { background-position: 0% -120%; }
	}

	.bar-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex: 1;
		min-width: 28px;
		height: 100%;
		justify-content: flex-end;
		position: relative;
	}

	.bar {
		width: 100%;
		max-width: 32px;
		background: linear-gradient(180deg, var(--accent), color-mix(in srgb, var(--accent) 60%, transparent));
		border-radius: var(--radius-sm) var(--radius-sm) 0 0;
		transition: height 0.4s cubic-bezier(0.22, 0.61, 0.36, 1);
		min-height: 2px;
	}

	.bar-label {
		font-size: 0.55rem;
		color: var(--muted);
		margin-top: 0.3rem;
		white-space: nowrap;
		transform: rotate(-45deg);
		transform-origin: top center;
	}

	.bar-count {
		position: absolute;
		top: -1.2rem;
		font-size: 0.6rem;
		color: var(--text);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		opacity: 0;
		transition: opacity var(--tx-base);
	}

	.bar-col:hover .bar-count {
		opacity: 1;
	}

	.bar-col:hover .bar {
		filter: brightness(1.2);
	}
</style>
