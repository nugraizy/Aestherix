<script>
	export let count = 4;
	export let columns = 'auto-fit';
	export let minWidth = '320px';
</script>

<div class="skeleton-grid" style="--cols: {columns}; --min: {minWidth}">
	{#each Array(count) as _, i}
		<div class="skeleton-card" style="animation-delay: {i * 80}ms">
			<div class="skeleton-head" style="animation-delay: {i * 80 + 20}ms"></div>
			{#each Array(6) as _, j}
				<div class="skeleton-line" style="animation-delay: {i * 80 + 40 + j * 30}ms"></div>
			{/each}
		</div>
	{/each}
</div>

<style>
	.skeleton-grid {
		display: grid;
		grid-template-columns: repeat(var(--cols, auto-fit), minmax(var(--min, 320px), 1fr));
		gap: var(--space-4);
	}

	.skeleton-card {
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		overflow: hidden;
		animation: fadeIn 0.3s ease-out both;
	}

	.skeleton-head {
		height: 2.6rem;
		border-bottom: 1px solid var(--border);
		background: linear-gradient(
			100deg,
			var(--panel) 0%,
			color-mix(in srgb, var(--accent) 14%, transparent) 50%,
			var(--panel) 100%
		);
		background-size: 220% 100%;
		animation: shimmer 1.4s ease-in-out infinite;
	}

	.skeleton-line {
		height: 2rem;
		margin: 8px 16px;
		border-radius: 6px;
		background: linear-gradient(
			100deg,
			var(--panel) 0%,
			color-mix(in srgb, var(--accent) 14%, transparent) 50%,
			var(--panel) 100%
		);
		background-size: 220% 100%;
		animation: shimmer 1.4s ease-in-out infinite;
	}

	@keyframes shimmer {
		0%   { background-position-x: 100%; }
		100% { background-position-x: -120%; }
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(4px); }
		to   { opacity: 1; transform: translateY(0); }
	}
</style>