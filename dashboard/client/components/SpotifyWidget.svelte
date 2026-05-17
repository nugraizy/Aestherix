<script>
	import { onDestroy, onMount } from 'svelte';
	import { extractCoverPalette } from '../lib/colors.js';
	import { formatTrackTime } from '../lib/format.js';
	import { spotify, startSpotify } from '../lib/spotify.js';

	let coverEl;
	let widgetEl;
	let popupOpen = false;
	let displayProgress = 0;
	let lastSync = Date.now();
	let tickHandle = null;
	let lastCoverUrl = '';

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
		}, 500);
	});

	onDestroy(() => {
		if (tickHandle) {
			clearInterval(tickHandle);
		}
	});

	$: if ($spotify) {
		displayProgress = $spotify.progressMs;
		lastSync = Date.now();
	}

	$: ratio = $spotify.durationMs > 0 ? Math.min(1, Math.max(0, displayProgress / $spotify.durationMs)) : 0;
	$: progressLabel = `${formatTrackTime(displayProgress)} / ${$spotify.durationMs > 0 ? formatTrackTime($spotify.durationMs) : '--:--'}`;
	$: linkHref = $spotify.trackUrl || $spotify.trackUri || '';
	$: visible = $spotify.available;

	function applyPalette() {
		if (!coverEl || !widgetEl) {
			return;
		}

		const palette = extractCoverPalette(coverEl);

		if (!palette) {
			widgetEl.style.removeProperty('--spotify-color-primary');
			widgetEl.style.removeProperty('--spotify-color-secondary');
			return;
		}

		widgetEl.style.setProperty('--spotify-color-primary', palette.primary);
		widgetEl.style.setProperty('--spotify-color-secondary', palette.secondary);
	}

	function onCoverLoad() {
		applyPalette();
	}

	$: if (coverEl && $spotify.coverUrl !== lastCoverUrl) {
		lastCoverUrl = $spotify.coverUrl;

		if (coverEl.complete && coverEl.naturalWidth > 0) {
			applyPalette();
		}
	}

	function openLink() {
		if (!linkHref) {
			return;
		}

		const fallback = $spotify.trackUrl;
		const href = linkHref.startsWith('spotify:') && fallback ? fallback : linkHref;

		window.open(href, '_blank', 'noopener,noreferrer');
	}

	function handleKey(event) {
		if (event.key === 'Escape') {
			popupOpen = false;
		}
	}
</script>

<svelte:window on:keydown={handleKey} />

{#if visible}
	<div
		class="spotify-widget"
		class:is-playing={$spotify.isPlaying}
		class:is-idle={!$spotify.isPlaying}
		bind:this={widgetEl}
	>
		<button class="cover-button" type="button" on:click={() => popupOpen = true} aria-label="Show Spotify details">
			<img
				bind:this={coverEl}
				class="cover"
				src={$spotify.coverUrl || ''}
				alt={$spotify.trackTitle ? `${$spotify.trackTitle} cover` : ''}
				crossorigin="anonymous"
				on:load={onCoverLoad}
			/>
		</button>
		<div class="meta">
			<div class="label">
				<button class="link" type="button" on:click={openLink} disabled={!linkHref}>
					Listening to Spotify
				</button>
			</div>
			<p class="track">{$spotify.trackTitle || $spotify.message || 'Spotify idle'}{#if $spotify.available && !$spotify.isPlaying} (Paused){/if}</p>
			<p class="artist">{$spotify.artists || '-'}</p>
			<p class="timestamp">{progressLabel}</p>
			<div class="progress" title={progressLabel}>
				<span class="progress-fill" style="width: {Math.round(ratio * 100)}%"></span>
			</div>
		</div>
	</div>

	{#if popupOpen}
		<div
			class="popup-backdrop"
			on:click={() => popupOpen = false}
			on:keydown={(event) => event.key === 'Escape' && (popupOpen = false)}
			role="presentation"
		>
			<div
				class="popup"
				role="dialog"
				aria-modal="true"
				aria-label="Spotify details"
				tabindex="-1"
				on:click|stopPropagation
				on:keydown|stopPropagation
			>
				<div class="popup-header">
					<img class="popup-cover" src={$spotify.coverUrl || ''} alt={$spotify.trackTitle ? `${$spotify.trackTitle} cover` : ''} />
					<div>
						<p class="popup-label">Listening to Spotify</p>
						<p class="popup-track">{$spotify.trackTitle || $spotify.message || 'Spotify idle'}</p>
						<p class="popup-artist">{$spotify.artists || '-'}</p>
					</div>
				</div>
				<div class="popup-actions">
					<button class="popup-link" type="button" on:click={openLink} disabled={!linkHref}>Open in Spotify</button>
					<span class="popup-time">{progressLabel}</span>
				</div>
			</div>
		</div>
	{/if}
{/if}

<style>
	.spotify-widget {
		position: fixed;
		left: 50%;
		bottom: 24px;
		transform: translateX(-50%);
		z-index: 50;
		width: min(640px, calc(100vw - 48px));
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 10px 14px;
		border-radius: 16px;
		border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
		background: linear-gradient(
				135deg,
				color-mix(in srgb, var(--spotify-color-primary, var(--accent)) 26%, transparent) 0%,
				color-mix(in srgb, var(--spotify-color-secondary, var(--accent)) 18%, transparent) 100%
			),
			color-mix(in srgb, var(--panel) 78%, transparent);
		backdrop-filter: blur(28px) saturate(1.4);
		box-shadow: none;
		color: var(--text);
	}

	@media (max-width: 720px) {
		.spotify-widget {
			left: 16px;
			right: 16px;
			bottom: 16px;
			width: auto;
			transform: none;
		}
	}

	.cover-button {
		border: none;
		padding: 0;
		background: transparent;
		cursor: pointer;
		border-radius: 12px;
		flex-shrink: 0;
	}

	.cover {
		width: 54px;
		height: 54px;
		border-radius: 12px;
		object-fit: cover;
		display: block;
		background: var(--bg);
	}

	.meta {
		flex: 1;
		min-width: 0;
	}

	.label {
		font-size: 0.7rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--text) 70%, transparent);
		margin: 0;
	}

	.link {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		font: inherit;
		padding: 0;
		text-transform: inherit;
		letter-spacing: inherit;
	}

	.link:hover:not(:disabled) {
		color: var(--accent);
	}

	.link:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.track {
		margin: 4px 0 0;
		font-size: 1rem;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.artist {
		margin: 2px 0 0;
		font-size: 0.85rem;
		color: color-mix(in srgb, var(--text) 65%, transparent);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.timestamp {
		margin: 6px 0 0;
		font-size: 0.7rem;
		color: color-mix(in srgb, var(--text) 65%, transparent);
	}

	.progress {
		margin-top: 6px;
		height: 4px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--text) 14%, transparent);
		overflow: hidden;
		position: relative;
	}

	.progress-fill {
		display: block;
		height: 100%;
		border-radius: 999px;
		background: linear-gradient(
			90deg,
			var(--spotify-color-primary, var(--accent)),
			var(--spotify-color-secondary, var(--accent))
		);
		transition: width 0.6s linear;
	}

	.spotify-widget.is-playing .progress-fill {
		box-shadow: 0 0 12px color-mix(in srgb, var(--spotify-color-primary, var(--accent)) 50%, transparent);
	}

	.popup-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(2, 8, 11, 0.55);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
		z-index: 60;
		backdrop-filter: blur(6px);
	}

	.popup {
		width: min(420px, calc(100vw - 32px));
		border-radius: 20px;
		border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
		background: color-mix(in srgb, var(--panel) 96%, transparent);
		padding: 18px;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
	}

	.popup-header {
		display: flex;
		gap: 14px;
		align-items: center;
	}

	.popup-cover {
		width: 72px;
		height: 72px;
		border-radius: 16px;
		object-fit: cover;
		background: var(--bg);
	}

	.popup-label {
		margin: 0;
		font-size: 0.7rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--text) 65%, transparent);
	}

	.popup-track {
		margin: 6px 0 0;
		font-size: 1.05rem;
		font-weight: 600;
	}

	.popup-artist {
		margin: 2px 0 0;
		font-size: 0.9rem;
		color: color-mix(in srgb, var(--text) 65%, transparent);
	}

	.popup-actions {
		margin-top: 16px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.popup-link {
		background: var(--accent);
		color: var(--bg);
		border: none;
		padding: 8px 14px;
		border-radius: 999px;
		font-weight: 600;
		font-size: 0.85rem;
		cursor: pointer;
	}

	.popup-link:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.popup-time {
		font-size: 0.78rem;
		color: color-mix(in srgb, var(--text) 65%, transparent);
	}
</style>
