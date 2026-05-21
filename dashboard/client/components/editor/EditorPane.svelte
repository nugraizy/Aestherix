<script>
	import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte';
	import ButtonPill from '../ui/ButtonPill.svelte';

	export let activePath = '';
	export let content = '';
	export let originalContent = '';
	export let dirty = false;
	export let saving = false;
	export let formatting = false;

	const dispatch = createEventDispatcher();
	let mountEl;
	let editor = null;
	let detectLanguage = () => null;
	let lastSyncedPath = '';
	let loading = true;
	let showDiff = true;

	$: diffHtml = dirty ? computeDiff(originalContent, content) : '';

	function computeDiff(oldText, newText) {
		const oldLines = oldText.replace(/\r\n?/g, '\n').split('\n');
		const newLines = newText.replace(/\r\n?/g, '\n').split('\n');
		const ops = myers(oldLines, newLines);
		const lines = [];
		let oldLn = 0;
		let newLn = 0;

		for (const op of ops) {
			const val = op.value ?? '';

			if (op.type === 'equal') {
				oldLn++;
				newLn++;
				const ln = `<span class="diff-ln">${String(newLn).padStart(3)}</span> `;

				lines.push(`<span class="diff-ctx">${ln} ${highlight(esc(val))}</span>`);
			} else if (op.type === 'delete') {
				oldLn++;
				const ln = `<span class="diff-ln">${String(oldLn).padStart(3)}</span> `;

				lines.push(`<span class="diff-del">${ln}-${highlight(esc(val))}</span>`);
			} else {
				newLn++;
				const ln = `<span class="diff-ln">${String(newLn).padStart(3)}</span> `;

				lines.push(`<span class="diff-add">${ln}+${highlight(esc(val))}</span>`);
			}
		}

		return lines.join('\n');
	}

	function myers(oldArr, newArr) {
		const N = oldArr.length;
		const M = newArr.length;

		if (N === 0) {
			return newArr.map((line) => ({ type: 'insert', value: line }));
		}

		if (M === 0) {
			return oldArr.map((line) => ({ type: 'delete', value: line }));
		}

		const dp = Array.from({ length: N + 1 }, () => new Uint16Array(M + 1));

		for (let i = 1; i <= N; i++) {
			for (let j = 1; j <= M; j++) {
				if (oldArr[i - 1] === newArr[j - 1]) {
					dp[i][j] = dp[i - 1][j - 1] + 1;
				} else {
					dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
				}
			}
		}

		const ops = [];
		let i = N;
		let j = M;

		while (i > 0 && j > 0) {
			if (oldArr[i - 1] === newArr[j - 1]) {
				ops.push({ type: 'equal', value: oldArr[i - 1] });
				i--;
				j--;
			} else if (dp[i - 1][j] >= dp[i][j - 1]) {
				ops.push({ type: 'delete', value: oldArr[i - 1] });
				i--;
			} else {
				ops.push({ type: 'insert', value: newArr[j - 1] });
				j--;
			}
		}

		while (i > 0) {
			ops.push({ type: 'delete', value: oldArr[--i] });
		}

		while (j > 0) {
			ops.push({ type: 'insert', value: newArr[--j] });
		}

		return ops.reverse();
	}

	function esc(str) {
		return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}

	function highlight(escaped) {
		const tokens = [];
		const PH_START = '\u2060\u200B';
		const PH_END = '\u200B\u2060';

		const tokenize = (cls, match) => {
			const idx = tokens.length;

			tokens.push(`<span class="${cls}">${match}</span>`);

			return `${PH_START}T${idx}T${PH_END}`;
		};

		let result = escaped
			.replace(/(\/\/.*$)/gm, (m) => tokenize('hl-comment', m))
			.replace(/('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)/g, (m) => tokenize('hl-string', m))
			.replace(/\b(\d+\.?\d*)\b/g, (m) => tokenize('hl-number', m))
			.replace(/\b(true|false|null|undefined|NaN|Infinity)\b/g, (m) => tokenize('hl-atom', m))
			.replace(/\b(await)\b/g, (m) => tokenize('hl-operator', m))
			.replace(/\b(const|let|var|function|return|if|else|for|while|import|export|from|async|class|new|this|throw|try|catch|default|switch|case|break|continue|typeof|instanceof|of|in)\b/g, (m) => tokenize('hl-keyword', m))
			.replace(/(\w+)(?=\s*\()/g, (m) => tokenize('hl-function', m))
			.replace(/(\w+)(?=\s*:)/g, (m) => tokenize('hl-property', m))
			.replace(/\.(\w+)/g, (_, prop) => `.${tokenize('hl-property', prop)}`)
			.replace(/(=&gt;|[+\-*/%=!<>&|?]+|\.{3})/g, (m) => tokenize('hl-operator', m))
			.replace(/([(){}[\]:;,])/g, (m) => tokenize('hl-punctuation', m));

		result = result.replace(/\u2060\u200BT(\d+)T\u200B\u2060/g, (_, idx) => tokens[Number(idx)]);

		return result;
	}

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
			<ButtonPill>
				<button
					type="button"
					class:active={showDiff}
					on:click={() => showDiff = !showDiff}
				>
					Diff
				</button>
				<button
					type="button"
					on:click={() => dispatch('format')}
					disabled={formatting || saving || !content}
				>
					{formatting ? 'Formatting...' : 'Format'}
				</button>
				<button
					type="button"
					class="primary"
					on:click={() => dispatch('save')}
					disabled={saving || !dirty}
				>
					{saving ? 'Saving...' : 'Save'}
				</button>
			</ButtonPill>
		</header>
	{:else}
		<header class="editor-header empty">
			<span class="file-path">No file selected</span>
		</header>
	{/if}
	<div class="editor-body">
		<div class="editor-host" bind:this={mountEl}></div>
		<div class="diff-panel" class:visible={dirty && showDiff}>
			<pre class="diff-content">{@html diffHtml}</pre>
		</div>
	</div>
	{#if !activePath && !loading}
		<div class="empty-overlay">
			<p>Select a file from the tree to begin editing.</p>
		</div>
	{:else if loading}
		<div class="empty-overlay">
			<div class="skeleton-lines">
				{#each Array(12) as _}
					<div class="skeleton-line"></div>
				{/each}
			</div>
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

	.editor-body {
		flex: 1;
		display: flex;
		min-height: 320px;
		overflow: hidden;
	}

	.editor-host {
		flex: 1;
		display: flex;
		overflow: hidden;
		min-width: 0;
	}

	.editor-host :global(.cm-editor) {
		flex: 1;
		outline: none;
	}

	.editor-host :global(.cm-editor.cm-focused) {
		outline: none;
	}

	.diff-panel {
		flex: 0;
		min-width: 0;
		max-width: 0;
		border-left: 1px solid var(--border);
		overflow: hidden;
		opacity: 0;
		transition: flex 0.3s ease, max-width 0.3s ease, opacity 0.25s ease;
	}

	.diff-panel.visible {
		flex: 1;
		max-width: 50%;
		opacity: 1;
	}

	.editor-header :global(.pill button.active) {
		background: color-mix(in srgb, var(--accent) 18%, transparent);
		color: var(--accent);
	}

	.diff-content {
		margin: 0;
		padding: 12px 0.75rem;
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		font-size: 0.85rem;
		line-height: 1.55;
		white-space: pre;
		color: var(--text);
	}

	.diff-content :global(.diff-add) {
		background: rgba(135, 240, 193, 0.15);
		color: var(--text);
	}

	.diff-content :global(.diff-del) {
		background: rgba(255, 142, 116, 0.15);
		color: var(--text);
	}

	.diff-content :global(.diff-ctx) {
		color: var(--text);
	}

	.diff-content :global(.diff-ln) {
		color: color-mix(in srgb, var(--muted) 60%, transparent);
		user-select: none;
	}

	.diff-content :global(.hl-keyword) {
		color: var(--code-keyword, #c4b5fd);
		font-weight: 600;
	}

	.diff-content :global(.hl-string) {
		color: var(--code-string, #87f0c1);
	}

	.diff-content :global(.hl-number) {
		color: var(--code-number, #f0c887);
	}

	.diff-content :global(.hl-comment) {
		color: var(--code-comment, #6c7086);
		font-style: italic;
	}

	.diff-content :global(.hl-function) {
		color: var(--code-function, #8ef0ff);
	}

	.diff-content :global(.hl-property) {
		color: var(--code-property, #c4b5fd);
	}

	.diff-content :global(.hl-operator) {
		color: var(--code-operator, #8ef0ff);
	}

	.diff-content :global(.hl-atom) {
		color: var(--code-atom, #f0c887);
	}

	.diff-content :global(.hl-punctuation) {
		color: var(--muted);
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

	.skeleton-lines {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		width: 80%;
		max-width: 500px;
	}

	.skeleton-line {
		height: 0.85rem;
		border-radius: 4px;
		background: linear-gradient(90deg, color-mix(in srgb, var(--border) 60%, transparent) 25%, color-mix(in srgb, var(--border) 30%, transparent) 50%, color-mix(in srgb, var(--border) 60%, transparent) 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	.skeleton-line:nth-child(odd) {
		width: 90%;
	}

	.skeleton-line:nth-child(even) {
		width: 65%;
	}

	.skeleton-line:nth-child(3n) {
		width: 78%;
	}

	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}
</style>
