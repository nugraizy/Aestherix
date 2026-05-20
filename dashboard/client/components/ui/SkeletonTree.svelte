<script>
	export let depth = 2;
</script>

<div class="skeleton-tree">
	{#each Array(depth) as _, i}
		<div class="skeleton-branch" style="animation-delay: {i * 60}ms">
			{#each Array(i === 0 ? 4 : 3) as _, j}
				<div class="skeleton-leaf" style="animation-delay: {i * 60 + j * 40}ms"></div>
			{/each}
		</div>
	{/each}
</div>

<style>
	.skeleton-tree {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: var(--space-3) var(--space-4);
	}

	.skeleton-branch {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.skeleton-leaf {
		height: 1.9rem;
		border-radius: var(--radius-sm);
		background: linear-gradient(
			100deg,
			var(--panel) 0%,
			color-mix(in srgb, var(--accent) 14%, transparent) 50%,
			var(--panel) 100%
		);
		background-size: 220% 100%;
		animation: shimmer 1.4s ease-in-out infinite;
	}

	.skeleton-leaf:first-child {
		width: 140px;
	}

	.skeleton-leaf:not(:first-child):not(:last-child) {
		width: 110px;
	}

	.skeleton-leaf:last-child {
		width: 80px;
	}

	@keyframes shimmer {
		0%   { background-position-x: 100%; }
		100% { background-position-x: -120%; }
	}
</style>