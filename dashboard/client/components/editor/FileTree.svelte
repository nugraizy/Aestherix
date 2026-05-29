<script>
	import { createEventDispatcher } from 'svelte';
	import TreeNode from './TreeNode.svelte';

	export let root = null;
	export let openFolders;
	export let activePath = '';
	export let search = '';

	const dispatch = createEventDispatcher();

	function handleSelect(detail) {
		dispatch('select', detail);
	}

	function toggleFolder(detail) {
		dispatch('toggle', detail);
	}
</script>

<aside class="file-tree">
	<header>
		<h3>Files</h3>
		<input
			type="text"
			class="search"
			placeholder="Search files..."
			bind:value={search}
		/>
	</header>
	<div class="tree-list">
		{#if root}
			{#each (root.children || []) as child (child.path || child.name)}
				<TreeNode
					node={child}
					{openFolders}
					{activePath}
					{search}
					depth={0}
					on:select={(event) => handleSelect(event.detail)}
					on:toggle={(event) => toggleFolder(event.detail)}
				/>
			{/each}
		{:else}
			<p class="empty">No files.</p>
		{/if}
	</div>
</aside>

<style>
	.file-tree {
		background: var(--panel);
		border-radius: 0.75rem;
		border: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		min-width: 0;
	}

	header {
		padding: 0.75rem 1rem 0.5rem;
		border-bottom: 1px solid var(--border);
		display: grid;
		gap: 6px;
		min-width: 0;
	}

	h3 {
		margin: 0;
		font-size: 0.85rem;
		color: var(--accent);
	}

	.search {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 0.4rem;
		padding: 0.3rem 0.55rem;
		color: var(--text);
		font-size: 0.78rem;
		outline: none;
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
	}

	.search:focus {
		border-color: var(--accent);
	}

	.tree-list {
		overflow-y: auto;
		padding: 0.5rem 0.5rem 0.75rem;
		flex: 1;
	}

	.empty {
		text-align: center;
		color: var(--muted);
		font-size: 0.78rem;
		padding: 1rem;
	}
</style>
