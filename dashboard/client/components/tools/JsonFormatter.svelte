<script>
	import Dropdown from '../ui/Dropdown.svelte';
	import { highlightCode } from '../../lib/code-highlight.js';
	import { copyText } from '../../lib/clipboard.js';

	let input = '';
	let output = '';
	let highlighted = '';
	let error = '';
	let copied = false;
	let lang = 'json';

	const LANGS = [
		{ value: 'json', label: 'JSON' },
		{ value: 'js', label: 'JavaScript' },
		{ value: 'html', label: 'HTML' },
		{ value: 'css', label: 'CSS' }
	];

	function format() {
		error = '';
		output = '';
		highlighted = '';
		if (!input.trim()) return;

		try {
			if (lang === 'json') {
				const parsed = JSON.parse(input);
				output = JSON.stringify(parsed, null, 2);
			} else {
				output = input;
			}

			highlighted = highlightCode(output, lang);
		} catch (e) {
			error = e.message;
		}
	}

	function minify() {
		error = '';
		output = '';
		highlighted = '';
		if (!input.trim()) return;

		try {
			if (lang === 'json') {
				const parsed = JSON.parse(input);
				output = JSON.stringify(parsed);
			} else {
				output = input.replace(/\s+/g, ' ').trim();
			}

			highlighted = highlightCode(output, lang);
		} catch (e) {
			error = e.message;
		}
	}

	function copyOutput() {
		if (!output) return;
		copyText(output);
		copied = true;
		setTimeout(() => { copied = false; }, 1500);
	}
</script>

<div class="fmt-tool">
	<div class="fmt-controls">
		<Dropdown
			value={lang}
			options={LANGS}
			size="sm"
			on:change={(e) => (lang = e.detail)}
		/>
		<button class="btn primary" type="button" on:click={format}>Format</button>
		<button class="btn" type="button" on:click={minify}>Minify</button>
	</div>
	<textarea class="input fmt-input" rows="8" placeholder="Paste code here..." bind:value={input}></textarea>
	{#if error}
		<p class="fmt-error">{error}</p>
	{/if}
	{#if highlighted}
		<div class="fmt-output-wrap">
			<button class="fmt-copy" type="button" on:click={copyOutput} aria-label="Copy">
				{copied ? '✓' : '⧉'}
			</button>
			<pre class="fmt-output">{@html highlighted}</pre>
		</div>
	{/if}
</div>

<style>
	.fmt-tool { display: flex; flex-direction: column; gap: var(--space-3); }
	.fmt-controls { display: flex; gap: var(--space-2); align-items: center; flex-wrap: wrap; }
	.fmt-input { max-width: none; font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace; font-size: var(--fs-sm); resize: vertical; }
	.fmt-error { margin: 0; color: #ff8e74; font-size: var(--fs-sm); font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace; }
	.fmt-output-wrap { position: relative; }
	.fmt-copy {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--muted);
		width: 28px;
		height: 28px;
		display: inline-grid;
		place-items: center;
		cursor: pointer;
		font-size: 0.85rem;
		transition: border-color var(--tx-base), color var(--tx-base);
		z-index: 1;
	}
	.fmt-copy:hover { border-color: var(--accent); color: var(--accent); }
	.fmt-output {
		margin: 0;
		padding: var(--space-3);
		padding-right: 2.5rem;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		font-size: var(--fs-sm);
		color: var(--text);
		overflow-x: auto;
		white-space: pre;
		max-height: 400px;
		overflow-y: auto;
		line-height: 1.5;
	}
	.fmt-output :global(.hl-keyword) { color: var(--code-keyword, #c4b5fd); font-weight: 600; }
	.fmt-output :global(.hl-string) { color: var(--code-string, #87f0c1); }
	.fmt-output :global(.hl-number) { color: var(--code-number, #f0c887); }
	.fmt-output :global(.hl-atom) { color: var(--code-atom, #f0c887); }
	.fmt-output :global(.hl-comment) { color: var(--code-comment, #6c7086); font-style: italic; }

	@media (max-width: 640px) {
		.fmt-output {
			font-size: var(--fs-xs);
			padding: var(--space-2);
			padding-right: 2rem;
			max-height: 300px;
		}

		.fmt-copy {
			top: 0.35rem;
			right: 0.35rem;
			width: 26px;
			height: 26px;
		}
	}
</style>
