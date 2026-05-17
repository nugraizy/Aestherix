<script>
	import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte';

	export let activePath = '';
	export let content = '';
	export let dirty = false;
	export let saving = false;
	export let formatting = false;

	const dispatch = createEventDispatcher();
	let mountEl;
	let editor = null;
	let detectLanguage = () => null;
	let lastSyncedPath = '';
	let loading = true;

	function syncFromProp(value) {
		if (!editor) {
			return;
		}

		if (editor.getContent() === value) {
			return;
		}

		editor.setContent(value);
	}

	$: if (editor && activePath !== lastSyncedPath) {
		lastSyncedPath = activePath;
		editor.setLanguage(detectLanguage(activePath));
		syncFromProp(content);
	}

	$: if (editor && activePath === lastSyncedPath) {
		syncFromProp(content);
	}

	onMount(async () => {
		const module = await import('../../lib/editor.js');

		detectLanguage = module.detectLanguage;
		editor = module.buildEditor({
			parent: mountEl,
			content,
			language: detectLanguage(activePath),
			onChange: (next) => dispatch('input', { content: next }),
			onSave: () => dispatch('save')
		});
		lastSyncedPath = activePath;
		loading = false;
	});

	onDestroy(() => {
		editor?.destroy();
		editor = null;
	});

	export async function focus() {
		await tick();
		editor?.focus();
	}
</script>

<div class="editor-pane">
	{#if activePath}
		<header class="editor-header">
			<span class="file-path">
				{#if dirty}
					<span class="dot" aria-label="Unsaved changes">●</span>
				{/if}
				{activePath}
			</span>
			<div class="actions">
				<button
					type="button"
					class="action format"
					on:click={() => dispatch('format')}
					disabled={formatting || saving || !content}
				>
					{formatting ? 'Formatting...' : 'Format'}
				</button>
				<button
					type="button"
					class="action save"
					on:click={() => dispatch('save')}
					disabled={saving || !dirty}
				>
					{saving ? 'Saving...' : 'Save'}
				</button>
			</div>
		</header>
	{:else}
		<header class="editor-header empty">
			<span class="file-path">No file selected</span>
		</header>
	{/if}
	<div class="editor-host" bind:this={mountEl}></div>
	{#if !activePath && !loading}
		<div class="empty-overlay">
			<p>Select a file from the tree to begin editing.</p>
		</div>
	{:else if loading}
		<div class="empty-overlay">
			<div class="spinner" aria-hidden="true"></div>
			<p>Loading editor...</p>
		</div>
	{/if}
</div>

<style>
	.editor-pane {
		display: flex;
		flex-direction: column;
		background: var(--panel);
		border-radius: 0.85rem;
		border: 1px solid var(--border);
		overflow: hidden;
		min-height: 0;
		position: relative;
	}

	.editor-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.55rem 0.95rem;
		border-bottom: 1px solid var(--border);
		gap: 0.75rem;
		background: color-mix(in srgb, var(--panel) 80%, transparent);
	}

	.editor-header.empty {
		justify-content: flex-start;
	}

	.file-path {
		color: var(--muted);
		font-size: 0.78rem;
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.dot {
		color: var(--accent);
		font-size: 0.55rem;
		line-height: 1;
	}

	.actions {
		display: inline-flex;
		gap: 6px;
	}

	.action {
		padding: 0.32rem 0.75rem;
		border-radius: 0.45rem;
		border: 1px solid var(--border);
		background: var(--bg);
		color: var(--text);
		font-size: 0.76rem;
		font-weight: 600;
		cursor: pointer;
		transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease, filter 0.15s ease;
	}

	.action:not(.save):hover:not(:disabled) {
		border-color: var(--accent);
		color: var(--accent);
	}

	.action.save {
		background: var(--accent);
		color: var(--bg);
		border-color: transparent;
	}

	.action.save:hover:not(:disabled) {
		filter: brightness(1.08);
		color: var(--bg);
		border-color: transparent;
	}

	.action:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.editor-host {
		flex: 1;
		min-height: 320px;
		display: flex;
		overflow: hidden;
	}

	.editor-host :global(.cm-editor) {
		flex: 1;
		outline: none;
	}

	.editor-host :global(.cm-editor.cm-focused) {
		outline: none;
	}

	.empty-overlay {
		position: absolute;
		inset: 0;
		top: 38px;
		display: grid;
		place-items: center;
		gap: 0.5rem;
		color: var(--muted);
		pointer-events: none;
	}

	.empty-overlay p {
		margin: 0;
		font-size: 0.85rem;
	}

	.spinner {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		border: 3px solid color-mix(in srgb, var(--accent) 24%, transparent);
		border-top-color: var(--accent);
		animation: spin 0.9s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
