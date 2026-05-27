<script>
	import { onDestroy, onMount } from 'svelte';
	import { scale } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import { extractCoverPalette } from '../lib/colors.js';
	import { formatTrackTime } from '../lib/format.js';
	import { spotify, startSpotify } from '../lib/spotify.js';

	let coverEl;
	let widgetEl;
	let expanded = false;
	let displayProgress = 0;
	let lastSync = Date.now();
	let tickHandle = null;
	let lastCoverUrl = '';
	let bars = Array(9).fill(0);
	let barHandle = null;

	onMount(() => {
		startSpotify();

		tickHandle = setInterval(() => {
			$spotify;
			const elapsed = Date.now() - lastSync;

			if ($spotify.isPlaying) {
				displayProgress = Math.min($spotify.durationMs || displayProgress + elapsed, $spotify.progressMs + elapsed);
			} else {
				displayProgress = $spotify.progressMs;
			}
		}, 1000);

		barHandle = setInterval(() => {
			if ($spotify.isPlaying) {
				bars = bars.map(() => Math.random() * 0.8 + 0.2);
			} else {
				bars = bars.map(() => 0.15);
			}
		}, 180);
	});

	onDestroy(() => {
		if (tickHandle) clearInterval(tickHandle);
		if (barHandle) clearInterval(barHandle);
	});

	$: if ($spotify) {
		displayProgress = $spotify.progressMs;
		lastSync = Date.now();
	}

	$: ratio = $spotify.durationMs > 0 ? Math.min(1, Math.max(0, displayProgress / $spotify.durationMs)) : 0;
	$: currentTime = formatTrackTime(displayProgress);
	$: totalTime = $spotify.durationMs > 0 ? formatTrackTime($spotify.durationMs) : '--:--';
	$: linkHref = $spotify.trackUrl || $spotify.trackUri || '';
	$: visible = $spotify.available;

	function applyPalette() {
		if (!coverEl || !widgetEl) return;

		const palette = extractCoverPalette(coverEl);

		if (!palette) {
			widgetEl.style.removeProperty('--sp-primary');
			widgetEl.style.removeProperty('--sp-secondary');
			return;
		}

		widgetEl.style.setProperty('--sp-primary', palette.primary);
		widgetEl.style.setProperty('--sp-secondary', palette.secondary);
	}

	$: if (coverEl && $spotify.coverUrl !== lastCoverUrl) {
		lastCoverUrl = $spotify.coverUrl;

		if (coverEl.complete && coverEl.naturalWidth > 0) {
			applyPalette();
		}
	}

	function openLink() {
		if (!linkHref) return;

		const href = linkHref.startsWith('spotify:') && $spotify.trackUrl ? $spotify.trackUrl : linkHref;

		window.open(href, '_blank', 'noopener,noreferrer');
	}

	function handleKey(event) {
		if (event.key === 'Escape' && expanded) {
			expanded = false;
		}
	}

	function handleClickOutside(event) {
		if (!expanded || !widgetEl) return;

		if (!widgetEl.contains(event.target)) {
			expanded = false;
		}
	}
</script>

<svelte:window on:keydown={handleKey} on:mousedown={handleClickOutside} />

{#if visible}
	<div class="island-anchor" bind:this={widgetEl}>
		<!-- Pill (collapsed) -->
		<button
			class="pill"
			class:playing={$spotify.isPlaying}
			class:hidden={expanded}
			type="button"
			on:click={() => expanded = true}
			aria-label="Spotify now playing"
		>
				<img
					bind:this={coverEl}
					class="pill-cover"
					src={$spotify.coverUrl || ''}
					alt=""
					crossorigin="anonymous"
					on:load={applyPalette}
				/>
				<div class="pill-content">
					<div class="cava" aria-hidden="true">
						{#each bars as h}
							<span class="cava-bar" style="height:{h * 100}%"></span>
						{/each}
					</div>
					<span class="pill-info"><span class="pill-info-inner">{$spotify.artists || 'Spotify'} - {$spotify.trackTitle || 'idle'}     ·     {$spotify.artists || 'Spotify'} - {$spotify.trackTitle || 'idle'}     ·     </span></span>
				</div>
			</button>

		<!-- Expanded modal -->
		{#if expanded}
			<div class="modal" in:scale={{ duration: 280, start: 0.6, opacity: 0, easing: backOut }} out:scale={{ duration: 180, start: 0.85, opacity: 0 }}>
				<a class="modal-head" href={linkHref || '#'} target="_blank" rel="noopener noreferrer" on:click|preventDefault={openLink}>
					<img
						class="modal-cover"
						src={$spotify.coverUrl || ''}
						alt=""
					/>
					<div class="modal-meta">
						<p class="modal-track" class:marquee={($spotify.trackTitle || '').length > 28}><span>{#if ($spotify.trackTitle || '').length > 28}{$spotify.trackTitle}     ·     {$spotify.trackTitle}     ·     {:else}{$spotify.trackTitle || 'Spotify idle'}{/if}</span></p>
						<p class="modal-artist" class:marquee={($spotify.artists || '').length > 32}><span>{#if ($spotify.artists || '').length > 32}{$spotify.artists}     ·     {$spotify.artists}     ·     {:else}{$spotify.artists || '-'}{/if}</span></p>
					</div>
				</a>
				<div class="modal-progress">
					<div class="bar-track">
						<span class="bar-fill" style="width:{Math.round(ratio * 100)}%"></span>
					</div>
					<div class="modal-times">
						<span>{currentTime}</span>
						<span>{totalTime}</span>
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.island-anchor {
		position: fixed;
		bottom: 60px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 25;
	}

	.pill {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 4px 14px 4px 4px;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: color-mix(in srgb, var(--panel) 85%, transparent);
		backdrop-filter: blur(14px) saturate(1.3);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
		cursor: pointer;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.pill.hidden {
		visibility: hidden;
		pointer-events: none;
	}

	.pill:hover {
		transform: scale(1.04);
		box-shadow: 0 6px 28px rgba(0, 0, 0, 0.45);
	}

	.pill:active {
		transform: scale(0.97);
	}

	.pill-cover {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		object-fit: cover;
		background: var(--bg);
		flex-shrink: 0;
	}

	.pill.playing .pill-cover {
		animation: spin-cover 8s linear infinite;
	}

	@keyframes spin-cover {
		to { transform: rotate(360deg); }
	}

	.pill-content {
		display: grid;
		align-items: center;
		max-width: 54px;
		overflow: hidden;
		transition: max-width 0.35s ease;
	}

	.pill:hover .pill-content {
		max-width: 150px;
	}

	.cava {
		display: flex;
		align-items: flex-end;
		gap: 2px;
		height: 18px;
		grid-area: 1/1;
		opacity: 1;
		transition: opacity 0.3s ease;
	}

	.pill:hover .cava {
		opacity: 0;
	}

	.pill-info {
		grid-area: 1/1;
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--text);
		white-space: nowrap;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.pill:hover .pill-info {
		opacity: 1;
	}

	.pill-info-inner {
		display: inline-block;
		padding-right: 2rem;
		animation: none;
	}

	.pill:hover .pill-info-inner {
		animation: marquee 8s linear infinite;
	}

	@keyframes marquee {
		0% { transform: translateX(0); }
		100% { transform: translateX(-50%); }
	}

	.cava-bar {
		width: 2.5px;
		border-radius: 2px;
		background: var(--accent);
		box-shadow: 0 0 6px var(--accent);
		transition: height 0.15s ease;
		min-height: 3px;
	}

	.modal {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 300px;
		padding: 16px;
		border-radius: 20px;
		background: color-mix(in srgb, var(--panel) 85%, transparent);
		backdrop-filter: blur(14px) saturate(1.3);
		border: 1px solid var(--border);
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
	}

	.modal-head {
		display: flex;
		gap: 12px;
		align-items: center;
		text-decoration: none;
		color: inherit;
		border-radius: 10px;
		padding: 4px;
		margin: -4px;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.modal-head:hover {
		background: color-mix(in srgb, var(--accent) 12%, transparent);
	}

	.modal-cover {
		width: 48px;
		height: 48px;
		border-radius: 10px;
		object-fit: cover;
		background: var(--bg);
		flex-shrink: 0;
	}

	.modal-meta {
		flex: 1;
		min-width: 0;
		overflow: hidden;
	}

	.modal-track {
		margin: 0;
		font-size: 0.92rem;
		font-weight: 650;
		color: var(--text);
		white-space: nowrap;
		overflow: hidden;
	}

	.modal-artist {
		margin: 3px 0 0;
		font-size: 0.78rem;
		color: var(--muted);
		white-space: nowrap;
		overflow: hidden;
	}

	.modal-track span,
	.modal-artist span {
		display: inline-block;
	}

	.modal-track.marquee span,
	.modal-artist.marquee span {
		animation: marquee-modal 10s linear infinite;
	}

	@keyframes marquee-modal {
		0% { transform: translateX(0); }
		100% { transform: translateX(-50%); }
	}

	.modal-progress {
		margin-top: 14px;
	}

	.bar-track {
		height: 4px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--muted) 25%, transparent);
		overflow: hidden;
	}

	.bar-fill {
		display: block;
		height: 100%;
		border-radius: 999px;
		background: var(--accent);
		transition: width 1s linear;
		box-shadow: 0 0 8px var(--accent);
	}

	.modal-times {
		display: flex;
		justify-content: space-between;
		margin-top: 6px;
		font-size: 0.68rem;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}

	@media (max-width: 540px) {
		.modal {
			width: calc(100vw - 48px);
		}
	}
</style>
