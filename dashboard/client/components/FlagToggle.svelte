<script>
	import { post } from '../lib/api.js';
	import { flags } from '../lib/stores.js';
	import { showError, showSuccess, showUndoToast } from '../lib/toast.js';
	import Toggle from './ui/Toggle.svelte';
	import Tooltip from './ui/Tooltip.svelte';

	export let isViewer = false;

	let search = '';
	let pending = new Set();

	$: entries = $flags.filter((flag) =>
		!search || flag.name.toLowerCase().includes(search.toLowerCase())
	);

	function escapeHtml(value) {
		return String(value)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	function escapeRegex(value) {
		return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	function highlight(text, term) {
		const safe = escapeHtml(text);
		const trimmed = String(term || '').trim();

		if (!trimmed) {
			return safe;
		}

		const pattern = new RegExp(`(${escapeRegex(trimmed)})`, 'gi');

		return safe.replace(pattern, '<mark class="cmd-hl">$1</mark>');
	}

	async function toggle(flag, next) {
		if (isViewer) {
			return;
		}

		if (pending.has(flag.name)) {
			return;
		}

		pending = new Set(pending).add(flag.name);

		try {
			const data = await post(`/flags/${flag.name}`, { enabled: next });

			flags.update((current) =>
				current.map((entry) => (entry.name === flag.name ? { ...entry, enabled: next } : entry))
			);

			if (data?.undo?.token) {
				showUndoToast({
					message: `Flag "${flag.name}" turned ${next ? 'on' : 'off'}.`,
					undo: data.undo
				});
			} else {
				showSuccess(`Flag "${flag.name}" turned ${next ? 'on' : 'off'}.`);
			}
		} catch (error) {
			showError(error?.message || 'Failed to toggle flag.');
		}

		pending = new Set([...pending].filter((name) => name !== flag.name));
	}
</script>

<section class="section flag-list">
	<header class="section-head">
		<h3 class="section-title">Flags <span class="section-count">{entries.length}</span></h3>
		<input class="input" type="text" placeholder="Search flags..." bind:value={search} />
	</header>
	<div class="list">
		{#each entries as flag (flag.name)}
			<Tooltip text={flag.description || ''} placement="left">
				<div class="row">
					<span class="name">{@html highlight(flag.name, search)}</span>
					<Toggle
						checked={flag.enabled}
						disabled={pending.has(flag.name)}
						readonly={isViewer}
						label="{flag.name} flag"
						size="sm"
						on:change={(event) => toggle(flag, event.detail)}
					/>
				</div>
			</Tooltip>
		{/each}
		{#if !entries.length}
			<p class="empty">No flags{search ? ' match the search.' : '.'}</p>
		{/if}
	</div>
</section>

<style>
	.flag-list {
		height: 100%;
		min-height: 0;
	}

	.list {
		overflow-y: auto;
		padding: var(--space-2) var(--space-4);
		flex: 1;
		min-height: 0;
	}

	.list :global(.tooltip-host) {
		display: block;
		width: 100%;
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.42rem 0.5rem;
		border-radius: var(--radius-sm);
		gap: var(--space-3);
		transition: background var(--tx-base);
	}

	.row:hover {
		background: color-mix(in srgb, var(--accent) 8%, transparent);
	}


	.name {
		color: var(--text);
		font-size: var(--fs-sm);
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
	}

	.name :global(mark.cmd-hl) {
		background: color-mix(in srgb, var(--accent) 32%, transparent);
		color: var(--accent);
		padding: 0 2px;
		border-radius: 3px;
		font-weight: 700;
	}

	.input {
		max-width: 220px;
	}

	@media (max-width: 540px) {
		.input {
			max-width: 100%;
			flex: 1;
		}
	}
</style>
