<script>
	import { writable } from 'svelte/store';
	import { get, post } from '../lib/api.js';
	import { showConfirm } from '../lib/confirm.js';
	import { showSuccess, showError } from '../lib/toast.js';
	import FileTree from '../components/editor/FileTree.svelte';
	import EditorPane from '../components/editor/EditorPane.svelte';

	const STORAGE_KEY = 'aestherix.dashboard.editor.lastPath';
	const openFolders = writable(new Set());

	export let active = true;
	let wasActive = false;

	let root = null;
	let activePath = '';
	let content = '';
	let dirty = false;
	let saving = false;
	let formatting = false;
	let search = '';
	let editor;

	$: if (active && !wasActive) {
		wasActive = true;
		void loadTree();
	}

	$: if (!active && wasActive) {
		wasActive = false;
	}

	async function loadTree() {
		try {
			const data = await get('/editor/tree');

			root = data.root || null;

			if (root?.path !== undefined) {
				openFolders.update((set) => {
					set.add(root.path);
					return set;
				});
			}

			const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;

			if (saved) {
				void openFile(saved);
			}
		} catch (error) {
			showError(error?.message || 'Failed to load file tree.');
			root = null;
		}
	}

	function toggleFolder(detail) {
		openFolders.update((set) => {
			const next = new Set(set);

			if (next.has(detail.path)) {
				next.delete(detail.path);
			} else {
				next.add(detail.path);
			}

			return next;
		});
	}

	async function openFile(path) {
		if (!path) {
			return;
		}

		try {
			const data = await get(`/editor/file?path=${encodeURIComponent(path)}`);

			activePath = data.path || path;
			content = data.content || '';
			dirty = false;
			localStorage.setItem(STORAGE_KEY, activePath);
			editor?.focus?.();
		} catch (error) {
			showError(error?.message || 'Failed to open file.');
		}
	}

	async function handleSelect(detail) {
		if (dirty) {
			const ok = await showConfirm({
				title: 'Discard changes',
				message: 'You have unsaved changes. Discard them and open a different file?',
				confirmLabel: 'Discard',
				danger: true
			});

			if (!ok) {
				return;
			}
		}

		void openFile(detail.path);
	}

	function handleInput(detail) {
		content = detail.content;
		dirty = true;
	}

	async function saveFile() {
		if (!activePath || !dirty) {
			return;
		}

		saving = true;

		try {
			await post('/editor/file', { path: activePath, content });
			dirty = false;
			showSuccess('Saved.');
		} catch (error) {
			showError(error?.message || 'Failed to save file.');
		}

		saving = false;
	}

	async function formatFile() {
		if (!activePath) {
			return;
		}

		formatting = true;

		try {
			const data = await post('/editor/format', { path: activePath, content });

			if (data?.content !== undefined && data.content !== content) {
				content = data.content;
				dirty = true;
			}

			showSuccess('Formatted.');
		} catch (error) {
			showError(error?.message || 'Failed to format file.');
		}

		formatting = false;
	}
</script>

<div class="editor-page">
	<header class="page-head">
		<h2>File Editor</h2>
		<p class="page-sub">Edit command files with CodeMirror. Ctrl+S to save · Format runs Prettier.</p>
	</header>

	<div class="editor-layout">
		<FileTree
			bind:search
			{root}
			openFolders={$openFolders}
			{activePath}
			on:select={(event) => handleSelect(event.detail)}
			on:toggle={(event) => toggleFolder(event.detail)}
		/>
		<EditorPane
			bind:this={editor}
			{activePath}
			{content}
			{dirty}
			{saving}
			{formatting}
			on:input={(event) => handleInput(event.detail)}
			on:save={saveFile}
			on:format={formatFile}
		/>
	</div>
</div>

<style>
	.editor-page {
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

	.editor-layout {
		display: grid;
		grid-template-columns: 260px 1fr;
		gap: var(--space-3);
		min-height: calc(100vh - 200px);
	}

	@media (max-width: 768px) {
		.editor-layout {
			grid-template-columns: 1fr;
		}
	}
</style>
