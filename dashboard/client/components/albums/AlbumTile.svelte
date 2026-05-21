<script>
	import { createEventDispatcher } from 'svelte';
	import { showSuccess } from '../../lib/toast.js';

	export let picture;
	export let index;

	const dispatch = createEventDispatcher();
	let loaded = false;
	let errored = false;
	let showTooltip = false;

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
	$: palette = Array.isArray(picture?.colorPalette) ? picture.colorPalette : [];

	function copyColor(color) {
		navigator.clipboard.writeText(color);
		showSuccess('copied', { html: `Color ${color} <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};vertical-align:middle"></span> copied to clipboard` });
	}

	let clickTimer = null;

	function handleSwatchClick(color) {
		if (clickTimer) {
			clearTimeout(clickTimer);
			clickTimer = null;
			return;
		}

		clickTimer = setTimeout(() => {
			clickTimer = null;
			copyColor(color);
		}, 250);
	}

	function handleSwatchDblClick() {
		if (clickTimer) {
			clearTimeout(clickTimer);
			clickTimer = null;
		}

		copyAllColors();
	}

	function copyAllColors() {
		navigator.clipboard.writeText(palette.join(', '));
		showSuccess(`${palette.length} colors copied to clipboard`);
	}

	let holdTimer = null;
	let previewing = false;
	let wasPreview = false;

	function handleMouseDown(event) {
		if (event.button !== 0) return;

		wasPreview = false;
		holdTimer = setTimeout(() => {
			previewing = true;
			wasPreview = true;
			holdTimer = null;
			window.addEventListener('mouseup', handleGlobalUp, { once: true });
		}, 300);

		window.addEventListener('mouseup', handleEarlyUp, { once: true });
	}

	function handleEarlyUp() {
		if (holdTimer) {
			clearTimeout(holdTimer);
			holdTimer = null;
		}
	}

	function handleGlobalUp() {
		previewing = false;
	}

	function handleClick() {
		if (wasPreview) {
			wasPreview = false;
			return;
		}

		open();
	}
</script>

<div
	class="album-tile"
	role="button"
	tabindex="0"
	on:click={handleClick}
	on:keydown={(e) => e.key === 'Enter' && open()}
	on:mouseenter={() => showTooltip = true}
	on:mouseleave={() => showTooltip = false}
	on:mousedown={handleMouseDown}
	aria-label="Open image"
>
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
	{#if showTooltip && palette.length}
		<div class="palette-tooltip" on:click|stopPropagation on:keydown|stopPropagation>
			{#each palette as color}
				<button type="button" class="swatch" style:background={color} on:click|stopPropagation={() => handleSwatchClick(color)} on:dblclick|stopPropagation={handleSwatchDblClick} aria-label="Copy {color}" title={color}></button>
			{/each}
		</div>
	{/if}
</div>

{#if previewing}
	<div class="preview-overlay">
		<img class="preview-image" src={picture.url} alt="" />
	</div>
{/if}

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

	.palette-tooltip {
		position: absolute;
		bottom: 8px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 5px 8px;
		border-radius: 8px;
		background: rgba(10, 14, 20, 0.6);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.12);
		z-index: 5;
	}

	.swatch {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.2);
		cursor: pointer;
		padding: 0;
		transition: transform 0.12s ease;
	}

	.swatch:hover {
		transform: scale(1.3);
	}

	.preview-overlay {
		position: fixed;
		inset: 0;
		z-index: 70;
		display: grid;
		place-items: center;
		background: rgba(2, 8, 11, 0.7);
		backdrop-filter: blur(8px);
		cursor: default;
	}

	.preview-image {
		max-width: 80vw;
		max-height: 80vh;
		border-radius: 12px;
		object-fit: contain;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
	}
</style>
