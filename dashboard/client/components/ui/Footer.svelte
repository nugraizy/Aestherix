<script>
	import { createEventDispatcher } from 'svelte';
	import { changelogOpen } from '../../lib/stores.js';
	import Dropdown from './Dropdown.svelte';

	export let palette = '';
	export let paletteOptions = [];

	const dispatch = createEventDispatcher();
	$: paletteList = paletteOptions.map((name) => ({ value: name, label: name }));

	function openChangelog() {
		changelogOpen.set(true);
	}
</script>

<footer class="app-footer">
	<div class="brand">
		<span class="logo" aria-hidden="true">✦</span>
		<span class="title">Aestherix Dashboard</span>
		{#if paletteList.length}
			<Dropdown
				value={palette}
				options={paletteList}
				size="sm"
				on:change={(event) => dispatch('palette', event.detail)}
			/>
		{/if}
	</div>
	<div class="meta">
		<span>Made with <span class="heart" aria-hidden="true">♥</span> by the Hidden Finder Team</span>
		<span class="dot" aria-hidden="true">·</span>
		<a href="https://github.com/nugraizy/aestherix" target="_blank" rel="noopener noreferrer">GitHub</a>
		<span class="dot" aria-hidden="true">·</span>
		<button type="button" class="link-btn" on:click={openChangelog}>Changelog</button>
	</div>
</footer>

<style>
	.app-footer {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-5);
		border-top: 1px solid var(--border);
		background: color-mix(in srgb, var(--panel) 70%, transparent);
		font-size: var(--fs-xs);
		color: var(--muted);
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.logo {
		color: var(--accent);
	}

	.title {
		color: var(--text);
		font-weight: 600;
	}

	.meta {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.heart {
		color: #ff8e74;
	}

	.dot {
		opacity: 0.6;
	}

	.meta a,
	.link-btn {
		color: var(--muted);
		text-decoration: none;
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		cursor: pointer;
		transition: color var(--tx-base);
	}

	.meta a:hover,
	.link-btn:hover {
		color: var(--accent);
	}

	@media (max-width: 640px) {
		.app-footer {
			padding: var(--space-2) var(--space-3);
			justify-content: center;
			text-align: center;
		}
	}
</style>
