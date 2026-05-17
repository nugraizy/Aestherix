<script>
	import { createEventDispatcher } from 'svelte';

	export let picture;
	export let index;

	const dispatch = createEventDispatcher();
	let loaded = false;
	let errored = false;

	function open() {
		dispatch('open', { index });
	}

	function handleLoad() {
		loaded = true;
	}

	function handleError() {
		errored = true;
		loaded = true;
	}

	$: isGif = !!picture?.url && /\.gif(\?.*)?$/i.test(picture.url);
	$: imageSrc = isGif ? picture.url : picture.thumbnail || picture.url;
</script>

<button class="album-tile" type="button" on:click={open} aria-label="Open image">
	<img
		class="album-image"
		class:loaded
		class:errored
		src={imageSrc}
		alt=""
		loading="lazy"
		decoding="async"
		on:load={handleLoad}
		on:error={handleError}
	/>
</button>

<style>
	.album-tile {
		display: block;
		break-inside: avoid;
		margin: 0 0 10px;
		border: 0;
		padding: 0;
		background: var(--panel);
		border-radius: 10px;
		overflow: hidden;
		cursor: pointer;
		position: relative;
		width: 100%;
		transition: transform 0.18s ease, box-shadow 0.18s ease;
	}

	.album-tile:hover {
		transform: translateY(-1px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.32);
	}

	.album-image {
		display: block;
		width: 100%;
		height: auto;
		object-fit: cover;
		background: var(--bg);
		opacity: 0;
		filter: blur(8px) saturate(0.85);
		transition: opacity 0.24s ease, filter 0.24s ease, transform 0.26s ease;
	}

	.album-image.loaded {
		opacity: 1;
		filter: none;
	}

	.album-image.errored {
		opacity: 0.6;
		filter: grayscale(0.4);
	}

	.album-tile:hover .album-image.loaded {
		transform: scale(1.04);
	}
</style>
