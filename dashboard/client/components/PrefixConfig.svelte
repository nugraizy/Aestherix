<script>
	import { prefixConfig } from '../lib/stores.js';
	import { get, post } from '../lib/api.js';
	import { onMount } from 'svelte';
	import { showSuccess, showError } from '../lib/toast.js';
	import Dropdown from './ui/Dropdown.svelte';
	import SkeletonList from './ui/SkeletonList.svelte';

	const MODE_OPTIONS = [
		{ value: 'single', label: 'Single', description: 'One prefix character (e.g. .)' },
		{ value: 'multi', label: 'Multi', description: 'Many prefixes (! # ? etc.)' },
		{ value: 'nopref', label: 'No prefix', description: 'Every message can trigger commands' }
	];

	let mode = 'single';
	let singlePref = '.';
	let multiPrefixes = '';
	let saving = false;
	let loading = true;

	onMount(async () => {
		try {
			const data = await get('/prefix');

			mode = data.mode || 'single';
			singlePref = data.pref || '.';
			multiPrefixes = (data.cliPrefixes || []).join(', ');
			prefixConfig.set(data);
		} catch (error) {
			showError(error?.message || 'Failed to load prefix config.');
		}

		loading = false;
	});

	async function save() {
		if (saving) {
			return;
		}

		saving = true;

		const body = { mode };

		if (mode === 'single') {
			body.pref = (singlePref || '.').slice(0, 1);
		} else if (mode === 'multi') {
			body.prefixes = multiPrefixes
				.split(',')
				.map((value) => value.trim())
				.filter(Boolean);
		}

		try {
			const data = await post('/prefix', body);

			prefixConfig.set(data);
			showSuccess(`Prefix mode set to "${mode}".`);
		} catch (error) {
			showError(error?.message || 'Failed to save prefix.');
		}

		saving = false;
	}
</script>

<section class="section prefix-config">
	<header class="section-head">
		<h3 class="section-title">Prefix</h3>
	</header>
	<div class="body">
		{#if loading}
			<SkeletonList rows={5} rowHeight="2.4rem" />
		{:else}
			<div class="grid">
				<div class="field">
					<span class="label">Mode</span>
					<Dropdown
						value={mode}
						options={MODE_OPTIONS}
						on:change={(event) => (mode = event.detail)}
					/>
				</div>

				{#if mode === 'single'}
					<label class="field">
						<span class="label">Prefix character</span>
						<input
							class="input"
							type="text"
							bind:value={singlePref}
							maxlength="1"
							placeholder="."
						/>
					</label>
				{:else if mode === 'multi'}
					<label class="field grow">
						<span class="label">Extra prefixes (comma separated)</span>
						<input class="input" type="text" bind:value={multiPrefixes} placeholder="!, #, ?" />
					</label>
				{:else}
					<p class="hint">No prefix — every message can trigger commands.</p>
				{/if}

				<button class="btn primary" on:click={save} disabled={saving}>
					{saving ? 'Saving...' : 'Save'}
				</button>
			</div>
		{/if}
	</div>
</section>

<style>
	.body {
		padding: var(--space-3) var(--space-4);
	}

	.grid {
		display: flex;
		gap: var(--space-3);
		align-items: flex-end;
		flex-wrap: wrap;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 160px;
	}

	.field.grow {
		flex: 1;
		min-width: 220px;
	}

	.label {
		font-size: var(--fs-xs);
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.hint {
		flex: 1;
		color: var(--muted);
		font-size: var(--fs-sm);
		margin: 0;
		padding: 0.4rem 0.6rem;
		background: color-mix(in srgb, var(--accent) 6%, transparent);
		border-radius: var(--radius-sm);
		border: 1px dashed var(--border);
	}
</style>
