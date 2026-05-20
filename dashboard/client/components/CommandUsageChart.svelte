<script>
	import { flip } from 'svelte/animate';
	import { cubicOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';

	import { commands } from '../lib/stores.js';
	import Tooltip from './ui/Tooltip.svelte';

	const TOP_N = 15;

	$: ranked = ($commands || [])
		.map((cmd) => ({
			name: cmd.name,
			category: cmd.category || 'Uncategorized',
			usage: Number(cmd.usageCount || 0),
			enabled: Boolean(cmd.enabled)
		}))
		.filter((cmd) => cmd.usage > 0)
		.sort((a, b) => b.usage - a.usage)
		.slice(0, TOP_N);

	$: maxUsage = ranked.length ? Math.max(...ranked.map((cmd) => cmd.usage)) : 0;
	$: totalUsage = ranked.reduce((sum, cmd) => sum + cmd.usage, 0);

	function formatCount(value) {
		const number = Number(value) || 0;

		if (number >= 1_000_000) {
			return (number / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
		}

		if (number >= 1000) {
			return (number / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
		}

		return String(number);
	}

	function percentOfTotal(value) {
		if (!totalUsage) {
			return '0%';
		}

		return ((Number(value) / totalUsage) * 100).toFixed(1) + '%';
	}
</script>

<section class="section usage-chart">
	<header class="section-head">
		<h3 class="section-title">Top Commands <span class="section-count">{ranked.length}</span></h3>
		<span class="hint">{ranked.length ? `${formatCount(totalUsage)} runs · most → least` : 'usage analytics'}</span>
	</header>

	<div class="section-body">
		{#if !ranked.length}
			<p class="empty">No command usage recorded yet.</p>
		{:else}
			<ul class="rows">
				{#each ranked as cmd, index (cmd.name)}
					<li
						class="row"
						class:top={index < 3}
						class:disabled={!cmd.enabled}
						data-rank={index + 1}
						animate:flip={{ duration: 360, easing: cubicOut }}
						in:fade={{ duration: 180 }}
						out:fade={{ duration: 120 }}
					>
						<span class="rank" data-rank={index + 1}>{index + 1}</span>
						<span class="name">{cmd.name}</span>
						<Tooltip text="{cmd.category} · {percentOfTotal(cmd.usage)} of total" placement="top">
							<div class="bar-track" aria-hidden="true">
								<div
									class="bar"
									style:width="{maxUsage > 0 ? (cmd.usage / maxUsage) * 100 : 0}%"
								></div>
							</div>
						</Tooltip>
						<span class="count" title="{cmd.usage}">{formatCount(cmd.usage)}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>

<style>
	.usage-chart .section-head .hint {
		color: var(--muted);
		font-size: var(--fs-xs);
	}

	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	.row {
		display: grid;
		grid-template-columns: 28px minmax(110px, 1fr) minmax(0, 2fr) auto;
		align-items: center;
		gap: var(--space-3);
		padding: 0.4rem 0.5rem;
		border-radius: var(--radius-sm);
		transition: background var(--tx-base);
	}

	.row:hover {
		background: color-mix(in srgb, var(--accent) 8%, transparent);
	}

	.row.disabled {
		opacity: 0.5;
	}

	.rank {
		font-size: var(--fs-xs);
		font-weight: 700;
		color: var(--muted);
		text-align: center;
		padding: 0.1rem 0;
		border-radius: var(--radius-pill);
		font-variant-numeric: tabular-nums;
	}

	.row.top .rank {
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 14%, transparent);
	}

	.row[data-rank="1"] {
		background: color-mix(in srgb, #ffd700 10%, transparent);
	}

	.row[data-rank="1"] .rank {
		background: rgba(255, 215, 0, 0.2);
		color: #ffd700;
	}

	.row[data-rank="2"] {
		background: color-mix(in srgb, #c0c0c0 8%, transparent);
	}

	.row[data-rank="2"] .rank {
		background: rgba(192, 192, 192, 0.2);
		color: #c0c0c0;
	}

	.row[data-rank="3"] {
		background: color-mix(in srgb, #cd7f32 8%, transparent);
	}

	.row[data-rank="3"] .rank {
		background: rgba(205, 127, 50, 0.2);
		color: #cd7f32;
	}

	.name {
		color: var(--text);
		font-size: var(--fs-sm);
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.bar-track {
		position: relative;
		width: 100%;
		height: 8px;
		background: color-mix(in srgb, var(--muted) 18%, transparent);
		border-radius: var(--radius-pill);
		overflow: hidden;
	}

	.bar {
		height: 100%;
		background: linear-gradient(
			90deg,
			color-mix(in srgb, var(--accent) 80%, transparent),
			var(--accent)
		);
		border-radius: inherit;
		transition: width 0.6s cubic-bezier(0.22, 0.61, 0.36, 1);
		box-shadow: 0 0 6px color-mix(in srgb, var(--accent) 30%, transparent);
	}

	.row.top .bar {
		background: linear-gradient(
			90deg,
			color-mix(in srgb, var(--accent) 100%, transparent),
			color-mix(in srgb, var(--accent) 60%, #fff)
		);
	}

	.count {
		font-size: var(--fs-sm);
		font-weight: 700;
		color: var(--text);
		font-variant-numeric: tabular-nums;
		min-width: 3rem;
		text-align: right;
	}

	.row.top .count {
		color: var(--accent);
	}

	@media (max-width: 600px) {
		.row {
			grid-template-columns: 24px minmax(90px, 1fr) minmax(0, 1.6fr) auto;
			gap: var(--space-2);
		}

		.name {
			font-size: var(--fs-xs);
		}
	}
</style>
