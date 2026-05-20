<script>
	export let rows = 8;
	export let rowHeight = '2rem';
	export let compact = false;
</script>

<div class="skeleton-list" class:compact>
	{#each Array(rows) as _, i}
		<div class="skeleton-row" style="height: {rowHeight}; animation-delay: {i * 40}ms"></div>
	{/each}
</div>

<style>
	.skeleton-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: var(--space-3) var(--space-4);
	}

	.skeleton-row {
		border-radius: var(--radius-sm);
		background: linear-gradient(
			100deg,
			var(--panel) 0%,
			color-mix(in srgb, var(--accent) 16%, transparent) 50%,
			var(--panel) 100%
		);
		background-size: 220% 100%;
		animation: shimmer 1.4s ease-in-out infinite;
	}

	.compact .skeleton-row {
		border-radius: 6px;
	}

	@keyframes shimmer {
		0%   { background-position-x: 100%; }
		100% { background-position-x: -120%; }
	}
</style>