<script>
	import { post } from '../lib/api.js';
	import { commands } from '../lib/stores.js';
	import { showError, showSuccess, showUndoToast } from '../lib/toast.js';
	import { escapeHtml, escapeRegex, highlight } from '../lib/highlight.js';
	import Toggle from './ui/Toggle.svelte';
	import Tooltip from './ui/Tooltip.svelte';

	export let isViewer = false;

	let search = '';
	let pending = new Set();
	let collapsed = new Set();
	let storeLoaded = false;

	$: if ($commands.length > 0) storeLoaded = true;

	$: filtered = $commands.filter((cmd) => {
		if (!search) {
			return true;
		}

		const term = search.toLowerCase();

		return (
			cmd.name.toLowerCase().includes(term) ||
			cmd.category?.toLowerCase().includes(term) ||
			cmd.aliases?.some((alias) => alias.toLowerCase().includes(term))
		);
	});

	$: grouped = filtered.reduce((acc, cmd) => {
		const cat = cmd.category || 'Uncategorized';

		if (!acc[cat]) {
			acc[cat] = [];
		}

		acc[cat].push(cmd);
		return acc;
	}, {});

	$: categories = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
	$: collapsedView = search ? new Set() : collapsed;

	function toggleCategory(category) {
		const next = new Set(collapsed);

		if (next.has(category)) {
			next.delete(category);
		} else {
			next.add(category);
		}

		collapsed = next;
	}

	function expandAll() {
		collapsed = new Set();
	}

	function collapseAll() {
		collapsed = new Set(categories.map(([cat]) => cat));
	}

	async function toggleCommand(cmd, next) {
		if (isViewer) {
			return;
		}

		if (pending.has(cmd.name)) {
			return;
		}

		pending = new Set(pending).add(cmd.name);

		const prevEnabled = cmd.enabled;

		commands.update((list) =>
			list.map((entry) => (entry.name === cmd.name ? { ...entry, enabled: next } : entry))
		);

		try {
			const data = await post(`/commands/${cmd.name}`, { enabled: next });

			if (data?.undo?.token) {
				showUndoToast({
					message: `Command "${cmd.name}" ${next ? 'enabled' : 'disabled'}.`,
					undo: data.undo
				});
			} else {
				showSuccess(`Command "${cmd.name}" ${next ? 'enabled' : 'disabled'}.`);
			}
		} catch (error) {
			commands.update((list) =>
				list.map((entry) => (entry.name === cmd.name ? { ...entry, enabled: prevEnabled } : entry))
			);
			showError(error?.message || 'Failed to toggle command.');
		}

		pending = new Set([...pending].filter((name) => name !== cmd.name));
	}

	function tooltipFor(cmd) {
		const lines = [];

		if (cmd.minifiedDescription || cmd.description) {
			lines.push(cmd.minifiedDescription || cmd.description);
		}

		if (cmd.usage) {
			lines.push(`Usage: ${cmd.usage}`);
		}

		if (cmd.aliases?.length) {
			lines.push(`Aliases: ${cmd.aliases.join(', ')}`);
		}

		return lines.join('\n');
	}
</script>

<section class="section command-list">
	<header class="section-head">
		<h3 class="section-title">Commands <span class="section-count">{filtered.length}</span></h3>
		<div class="head-actions">
			<input class="input" type="text" placeholder="Search commands..." bind:value={search} />
			<Tooltip text="Expand all categories" placement="bottom">
				<button type="button" class="mini" on:click={expandAll} aria-label="Expand all categories">+</button>
			</Tooltip>
			<Tooltip text="Collapse all categories" placement="bottom">
				<button type="button" class="mini" on:click={collapseAll} aria-label="Collapse all categories">−</button>
			</Tooltip>
		</div>
	</header>
	<div class="list">
	{#if !storeLoaded}
			<div class="cat-skeleton">
				{#each Array(10) as _, i}
					<div class="cat-group" style="animation-delay: {i * 50}ms">
						<div class="skeleton-cat-head"></div>
						{#each Array(i < 3 ? 6 : 4) as _, j}
							<div class="skeleton-row" style="animation-delay: {i * 50 + 30 + j * 25}ms"></div>
						{/each}
					</div>
				{/each}
			</div>
		{:else}
			{#each categories as [category, cmds] (category)}
				{@const enabledCount = cmds.filter((cmd) => cmd.enabled).length}
				{@const disabledCount = cmds.length - enabledCount}
				<div class="category" class:collapsed={collapsedView.has(category)}>
					<button
						type="button"
						class="cat-head"
						on:click={() => toggleCategory(category)}
						aria-expanded={!collapsedView.has(category)}
					>
						<span class="cat-chevron" aria-hidden="true">
							<i class="nf nf-fa-chevron_right"></i>
						</span>
						<span class="cat-name">{@html highlight(category, search)}</span>
						<span class="cat-stats">
							<Tooltip text="Total commands" placement="top">
								<span class="cat-stat">total <strong>{cmds.length}</strong></span>
							</Tooltip>
							<Tooltip text="Enabled commands" placement="top">
								<span class="cat-stat on">on <strong>{enabledCount}</strong></span>
							</Tooltip>
							<Tooltip text="Disabled commands" placement="top">
								<span class="cat-stat off">off <strong>{disabledCount}</strong></span>
							</Tooltip>
						</span>
					</button>
					{#if !collapsedView.has(category)}
						<div class="cat-body">
							{#each cmds as cmd (cmd.name)}
								<Tooltip text={tooltipFor(cmd)} placement="left">
									<div class="row" class:disabled={!cmd.enabled}>
										<span class="name">{@html highlight(cmd.name, search)}</span>
										<Tooltip text="Total times this command was invoked" placement="top">
											<span class="usage">{cmd.usageCount ?? 0}</span>
										</Tooltip>
										<Toggle
											checked={cmd.enabled}
											disabled={pending.has(cmd.name)}
											readonly={isViewer}
											label="{cmd.name} command"
											size="sm"
											on:change={(event) => toggleCommand(cmd, event.detail)}
										/>
									</div>
								</Tooltip>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
			{#if !filtered.length}
				<p class="empty">No commands{search ? ' match the search.' : '.'}</p>
			{/if}
		{/if}
	</div>
</section>

<style>
	.command-list {
		height: 100%;
		min-height: 0;
	}

	.head-actions {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.mini {
		background: var(--bg);
		border: 1px solid var(--border);
		color: var(--muted);
		width: 26px;
		height: 26px;
		border-radius: var(--radius-sm);
		font-size: 0.95rem;
		font-weight: 700;
		cursor: pointer;
		transition: border-color var(--tx-base), color var(--tx-base);
		display: inline-grid;
		place-items: center;
		line-height: 1;
	}

	.mini:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.list {
		overflow-y: auto;
		padding: var(--space-2) var(--space-4);
		flex: 1;
		min-height: 0;
	}

	.cat-body > :global(.tooltip-host) {
		display: block;
		width: 100%;
	}

	.category {
		margin-bottom: var(--space-1);
		border-top: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
		padding-top: var(--space-2);
	}

	.category:first-child {
		border-top: none;
		padding-top: 0;
	}

	.cat-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		gap: 0.5rem;
		background: transparent;
		border: none;
		color: var(--muted);
		font-size: var(--fs-xs);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 600;
		padding: 0.45rem 0.5rem;
		margin: var(--space-2) 0 var(--space-1);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: background var(--tx-base), color var(--tx-base);
	}

	.cat-head:hover {
		background: color-mix(in srgb, var(--accent) 10%, transparent);
		color: var(--accent);
	}

	.cat-chevron {
		display: inline-block;
		transition: transform var(--tx-base);
		font-size: 0.75rem;
		color: var(--muted);
	}

	.category:not(.collapsed) .cat-chevron {
		transform: rotate(90deg);
		color: var(--accent);
	}

	.cat-name {
		flex: 1;
		text-align: left;
	}

	.cat-stats {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		flex-shrink: 0;
	}

	.cat-stat {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.1rem 0.5rem;
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, var(--muted) 16%, transparent);
		color: var(--muted);
		font-size: var(--fs-xs);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		line-height: 1.4;
	}

	.cat-stat strong {
		color: var(--text);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.cat-stat.on {
		background: rgba(135, 240, 193, 0.16);
		color: rgba(135, 240, 193, 0.8);
	}

	.cat-stat.on strong {
		color: #87f0c1;
	}

	.cat-stat.off {
		background: rgba(255, 142, 116, 0.16);
		color: rgba(255, 142, 116, 0.8);
	}

	.cat-stat.off strong {
		color: #ff8e74;
	}

	.cat-body {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.row {
		display: flex;
		align-items: center;
		padding: 0.4rem 0.5rem;
		border-radius: var(--radius-sm);
		gap: var(--space-3);
		transition: background var(--tx-base);
	}

	.row:hover {
		background: color-mix(in srgb, var(--accent) 8%, transparent);
	}


	.row.disabled {
		opacity: 0.6;
	}

	.name {
		color: var(--text);
		font-size: var(--fs-sm);
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.name :global(mark.cmd-hl),
	.cat-name :global(mark.cmd-hl) {
		background: color-mix(in srgb, var(--accent) 32%, transparent);
		color: var(--accent);
		padding: 0 2px;
		border-radius: 3px;
		font-weight: 700;
	}

	.usage {
		color: var(--muted);
		font-size: var(--fs-xs);
		font-variant-numeric: tabular-nums;
		min-width: 1.5rem;
		text-align: right;
	}

	.input {
		max-width: 220px;
	}

	@media (max-width: 540px) {
.cat-skeleton {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
	}

	.cat-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
		animation: fadeIn 0.2s ease-out both;
	}

	.skeleton-cat-head {
		height: 2.2rem;
		border-radius: var(--radius-sm);
		background: linear-gradient(
			100deg,
			var(--panel) 0%,
			color-mix(in srgb, var(--accent) 14%, transparent) 50%,
			var(--panel) 100%
		);
		background-size: 220% 100%;
		animation: shimmer 1.4s ease-in-out infinite;
		margin-bottom: 4px;
	}

	.skeleton-row {
		height: 2rem;
		border-radius: 6px;
		background: linear-gradient(
			100deg,
			var(--panel) 0%,
			color-mix(in srgb, var(--accent) 12%, transparent) 50%,
			var(--panel) 100%
		);
		background-size: 220% 100%;
		animation: shimmer 1.4s ease-in-out infinite;
	}

	@keyframes shimmer {
		0%   { background-position-x: 100%; }
		100% { background-position-x: -120%; }
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(4px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	.input {
			max-width: 100%;
			flex: 1;
		}
	}
</style>
