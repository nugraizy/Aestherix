<script>
	import { get, patch } from '../lib/api.js';
	import { toolPanels } from '../lib/stores.js';
	import { showConfirm } from '../lib/confirm.js';
	import { showError, showSuccess } from '../lib/toast.js';
	import Tooltip from '../components/ui/Tooltip.svelte';
	import Dropdown from '../components/ui/Dropdown.svelte';
	import SkeletonCard from '../components/ui/SkeletonCard.svelte';
	import ToolPanel from '../components/tools/ToolPanel.svelte';

	export let active = true;
	export let isSuperOwner = false;

	const CATEGORIES = [
		{ value: 'all', label: 'All' },
		{ value: 'media', label: 'Media' },
		{ value: 'converter', label: 'Converter' },
		{ value: 'utility', label: 'Utility' }
	];

	const STATE_OPTIONS = [
		{ value: 'enabled', label: 'Enabled' },
		{ value: 'disabled', label: 'Disabled' },
		{ value: 'maintenance', label: 'Maintenance' }
	];

	let wasActive = false;
	let loaded = false;
	let loading = true;
	let category = 'all';
	let search = '';
	let activeTool = null;
	const pendingTool = readToolFromUrl();

	$: panels = $toolPanels;
	$: filtered = panels.filter((p) => {
		if (category !== 'all' && p.category !== category) return false;
		if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
		return true;
	});

	$: if (active && !wasActive) { wasActive = true; if (!loaded) void loadPanels(); }

	function readToolFromUrl() {
		if (typeof window === 'undefined') return null;
		const params = new URLSearchParams(window.location.search);
		return params.get('tool') || null;
	}

	function writeToolToUrl(toolId) {
		if (typeof window === 'undefined') return;
		const url = new URL(window.location.href);
		if (toolId) {
			url.searchParams.set('tool', toolId);
		} else {
			url.searchParams.delete('tool');
		}
		history.replaceState(history.state, '', url.pathname + url.search);
	}

	async function loadPanels() {
		loading = true;
		try {
			const data = await get('/tools/panels');
			toolPanels.set(data?.panels || []);
			loaded = true;

			const savedTool = readToolFromUrl();
			if (savedTool) {
				const panel = (data?.panels || []).find(p => p.id === savedTool && p.state === 'enabled');
				if (panel) activeTool = panel;
			}
		} catch (error) {
			showError(error?.message || 'Failed to load tools.');
		}
		loading = false;
	}

	async function changeState(panel, newState) {
		const ok = await showConfirm({
			title: `${newState === 'enabled' ? 'Enable' : newState === 'disabled' ? 'Disable' : 'Set maintenance for'} "${panel.name}"`,
			message: `Change this tool's state to "${newState}"?`,
			confirmLabel: 'Confirm'
		});

		if (!ok) return;

		try {
			await patch(`/tools/panels/${panel.id}`, { state: newState });
			toolPanels.update((list) => list.map((p) => p.id === panel.id ? { ...p, state: newState } : p));
			showSuccess(`${panel.name} → ${newState}`);
		} catch (error) {
			showError(error?.message || 'Failed to update state.');
		}
	}

	function stateClass(state) {
		if (state === 'enabled') return 'state-on';
		if (state === 'maintenance') return 'state-maint';
		return 'state-off';
	}

	function stateLabel(state) {
		if (state === 'enabled') return 'Active';
		if (state === 'maintenance') return 'Maintenance';
		return 'Disabled';
	}

	function openTool(panel) {
		if (panel.state !== 'enabled') return;
		activeTool = panel;
		writeToolToUrl(panel.id);
	}

	function closeTool() {
		activeTool = null;
		writeToolToUrl(null);
	}
</script>

<div class="tools-page">
	{#if activeTool}
		<ToolPanel title={activeTool.name} icon={activeTool.icon} on:close={closeTool}>
			{#if activeTool.id === 'calculator'}
				{#await import('../components/tools/Calculator.svelte') then mod}
					<svelte:component this={mod.default} />
				{/await}
			{:else if activeTool.id === 'color-converter'}
				{#await import('../components/tools/ColorConverter.svelte') then mod}
					<svelte:component this={mod.default} />
				{/await}
			{:else if activeTool.id === 'json-formatter'}
				{#await import('../components/tools/JsonFormatter.svelte') then mod}
					<svelte:component this={mod.default} />
				{/await}
			{:else if activeTool.id === 'timestamp'}
				{#await import('../components/tools/TimestampConverter.svelte') then mod}
					<svelte:component this={mod.default} />
				{/await}
			{:else if activeTool.id === 'downloader'}
				{#await import('../components/tools/Downloader.svelte') then mod}
					<svelte:component this={mod.default} />
				{/await}
			{:else if activeTool.id === 'qr-generator'}
				{#await import('../components/tools/QRGenerator.svelte') then mod}
					<svelte:component this={mod.default} />
				{/await}
			{:else if activeTool.id === 'comics-reader'}
				{#await import('../components/tools/ComicsReader.svelte') then mod}
					<svelte:component this={mod.default} />
				{/await}
			{:else}
				<p class="empty">This tool is coming soon.</p>
			{/if}
		</ToolPanel>
	{:else if loaded || !pendingTool}
	<header class="page-head">
		<h2>Tools</h2>
		<p class="page-sub">Utilities powered by the bot's existing modules. Click a tool to use it.</p>
	</header>

	<div class="toolbar">
		<div class="filter-tabs">
			{#each CATEGORIES as cat (cat.value)}
				<button
					class="tab"
					class:active={category === cat.value}
					type="button"
					on:click={() => (category = cat.value)}
				>
					{cat.label}
				</button>
			{/each}
		</div>
		<input class="input search" type="text" placeholder="Search tools..." bind:value={search} />
	</div>

	{#if loading}
		<SkeletonCard count={6} />
	{:else if !filtered.length}
		<p class="empty">{search ? `No tools found for "${search}".` : 'No tools in this category.'}</p>
	{:else}
		<div class="grid">
			{#each filtered as panel (panel.id)}
				<div
					class="card"
					class:disabled={panel.state === 'disabled'}
					class:maintenance={panel.state === 'maintenance'}
					on:click={() => openTool(panel)}
					on:keydown={(e) => e.key === 'Enter' && openTool(panel)}
					role="button"
					tabindex="0"
				>
					<div class="card-head">
						<span class="card-icon"><i class="nf {panel.icon}"></i></span>
						<span class="card-badge {stateClass(panel.state)}">{stateLabel(panel.state)}</span>
					</div>
					<h3 class="card-title">{panel.name}</h3>
					<p class="card-desc">{panel.description}</p>
					<div class="card-foot">
						<span class="card-cat">{panel.category}</span>
						{#if isSuperOwner}
							<!-- svelte-ignore a11y-click-events-have-key-events -->
							<span class="state-ctrl" on:click|stopPropagation on:keydown|stopPropagation>
								<Dropdown
									value={panel.state}
									options={STATE_OPTIONS}
									size="sm"
									on:change={(e) => changeState(panel, e.detail)}
								/>
							</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
	{:else}
		<SkeletonCard count={6} />
	{/if}
</div>

<style>
	.tools-page {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.page-head {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.page-head h2 {
		margin: 0;
		font-size: var(--fs-xl);
		letter-spacing: -0.01em;
	}

	.page-sub {
		margin: 0;
		color: var(--muted);
		font-size: var(--fs-sm);
	}

	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.filter-tabs {
		display: flex;
		gap: 0.25rem;
		padding: 0.25rem;
		border-radius: var(--radius-pill);
		background: var(--bg);
		border: 1px solid var(--border);
	}

	.tab {
		background: transparent;
		border: none;
		padding: 0.4rem 0.75rem;
		font-size: var(--fs-xs);
		font-weight: 600;
		color: var(--muted);
		cursor: pointer;
		border-radius: var(--radius-pill);
		transition: background var(--tx-base), color var(--tx-base);
	}

	.tab:hover:not(.active) {
		color: var(--text);
	}

	.tab.active {
		background: color-mix(in srgb, var(--accent) 22%, transparent);
		color: var(--accent);
	}

	.search {
		max-width: 220px;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: var(--space-3);
	}

	.card {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-4);
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		transition: border-color var(--tx-base), transform 0.1s ease;
		cursor: pointer;
	}

	.card:hover {
		border-color: var(--accent);
		transform: translateY(-2px);
	}

	.card.disabled {
		opacity: 0.5;
		pointer-events: none;
	}

	.card.disabled .card-badge {
		pointer-events: auto;
	}

	.card.maintenance {
		border-color: color-mix(in srgb, #f0c887 40%, var(--border));
	}

	.card-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.card-icon {
		font-size: 1.5rem;
		color: var(--accent);
	}

	.card-badge {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		padding: 0.12rem 0.5rem;
		border-radius: var(--radius-pill);
	}

	.state-on {
		background: rgba(135, 240, 193, 0.18);
		color: #87f0c1;
	}

	.state-off {
		background: rgba(255, 142, 116, 0.16);
		color: #ff8e74;
	}

	.state-maint {
		background: rgba(240, 200, 135, 0.18);
		color: #f0c887;
	}

	.card-title {
		margin: 0;
		font-size: var(--fs-md);
		font-weight: 600;
		color: var(--text);
	}

	.card-desc {
		margin: 0;
		font-size: var(--fs-sm);
		color: var(--muted);
		line-height: 1.4;
	}

	.card-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: auto;
		padding-top: var(--space-2);
	}

	.card-cat {
		font-size: var(--fs-xs);
		color: var(--muted);
		text-transform: capitalize;
		padding: 0.1rem 0.5rem;
		border-radius: var(--radius-pill);
		background: var(--bg);
		border: 1px solid var(--border);
	}

	@media (max-width: 640px) {
		.grid {
			grid-template-columns: 1fr;
		}

		.search {
			max-width: 100%;
			flex: 1;
		}
	}
</style>
