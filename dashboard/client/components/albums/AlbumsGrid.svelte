<script>
	import { createEventDispatcher } from 'svelte';
	import AlbumTile from './AlbumTile.svelte';

	export let pictures = [];
	export let loading = false;

	const dispatch = createEventDispatcher();

	function handleOpen(event) {
		dispatch('open', event.detail);
	}
</script>

{#if loading}
	<div class="album-grid skeleton">
		{#each Array(12) as _, i}
			<div class="skeleton-tile" style:animation-delay="{i * 60}ms"></div>
		{/each}
	</div>
{:else if !pictures.length}
	<div class="empty">
		<p>No pictures found.</p>
	</div>
{:else}
	<div class="album-grid">
		{#each pictures as picture, i (picture.timestamp || picture.url)}
			<AlbumTile {picture} index={i} on:open={handleOpen} />
		{/each}
	</div>
{/if}

<style>
	.album-grid {
		column-width: clamp(210px, 16vw, 280px);
		column-gap: clamp(10px, 1.2vw, 16px);
		column-fill: balance;
		width: 100%;
	}

	@media (max-width: 640px) {
		.album-grid {
			column-width: 160px;
			column-gap: 8px;
		}
	}

	.skeleton-tile {
		break-inside: avoid;
		margin: 0 0 10px;
		width: 100%;
		aspect-ratio: 1 / 1;
		border-radius: 10px;
		background: linear-gradient(
			100deg,
			color-mix(in srgb, var(--panel) 70%, transparent) 0%,
			color-mix(in srgb, var(--accent) 18%, transparent) 50%,
			color-mix(in srgb, var(--panel) 70%, transparent) 100%
		);
		background-size: 220% 100%;
		animation: shimmer 1.4s ease-in-out infinite;
	}

	@keyframes shimmer {
		0% {
			background-position-x: 0%;
		}
		100% {
			background-position-x: -220%;
		}
	}

	.empty {
		text-align: center;
		color: var(--muted);
		padding: 4rem 0;
	}
</style>
