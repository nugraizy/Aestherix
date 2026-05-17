<script>
	import { createEventDispatcher } from 'svelte';
	import Self from './TreeNode.svelte';

	export let node;
	export let openFolders;
	export let activePath = '';
	export let depth = 0;
	export let search = '';

	const dispatch = createEventDispatcher();

	$: isFolder = node?.type === 'folder';
	$: isOpen = isFolder && (openFolders.has(node.path) || Boolean(search));
	$: isActive = !isFolder && node?.path === activePath;
	$: matches = !search || nodeMatches(node, search.toLowerCase());

	function nodeMatches(target, term) {
		if (!target || !term) {
			return true;
		}

		if (target.name.toLowerCase().includes(term)) {
			return true;
		}

		if (target.children) {
			return target.children.some((child) => nodeMatches(child, term));
		}

		return false;
	}

	function toggle() {
		if (!isFolder) {
			dispatch('select', { path: node.path });
			return;
		}

		dispatch('toggle', { path: node.path });
	}
</script>

{#if matches}
	<div class="node" style:padding-left="{depth * 12}px">
		<button
			type="button"
			class="row"
			class:folder={isFolder}
			class:file={!isFolder}
			class:active={isActive}
			on:click={toggle}
		>
			{#if isFolder}
				<span class="chevron" class:open={isOpen}>
					<i class="nf nf-fa-chevron_right"></i>
				</span>
				<span class="icon">📁</span>
			{:else}
				<span class="icon">📄</span>
			{/if}
			<span class="name">{node.name}</span>
		</button>
		{#if isFolder && isOpen && node.children?.length}
			<div class="children">
				{#each node.children as child (child.path || child.name)}
					<svelte:self
						node={child}
						{openFolders}
						{activePath}
						{search}
						depth={depth + 1}
						on:select={(event) => dispatch('select', event.detail)}
						on:toggle={(event) => dispatch('toggle', event.detail)}
					/>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.node {
		display: block;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 6px;
		width: 100%;
		background: none;
		border: none;
		color: var(--text);
		font-size: 0.78rem;
		text-align: left;
		padding: 4px 8px;
		border-radius: 5px;
		cursor: pointer;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.row:hover {
		background: color-mix(in srgb, var(--accent) 12%, transparent);
	}

	.row.active {
		background: color-mix(in srgb, var(--accent) 22%, transparent);
		color: var(--accent);
	}

	.chevron {
		display: inline-block;
		transition: transform 0.18s ease;
		color: var(--muted);
		width: 12px;
		text-align: center;
	}

	.chevron.open {
		transform: rotate(90deg);
	}

	.icon {
		flex-shrink: 0;
	}

	.name {
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
