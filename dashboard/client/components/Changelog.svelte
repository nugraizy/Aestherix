<script>
	import { renderMarkdown } from '../lib/markdown.js';
	import { changelogOpen } from '../lib/stores.js';

	const commitHashShort = '625cacb';
	const commitHashFull = '625cacba3ffa956e2d0c3a455532fc1fdc7a38bb';
	const commitUrl = `https://github.com/nugraizy/aestherix/commit/${commitHashFull}`;

	let html = '';
	let loading = false;
	let error = '';
	let dialogEl;

	$: if ($changelogOpen) {
		void load();
	}

	async function load() {
		if (html) {
			return;
		}

		loading = true;
		error = '';

		try {
			const response = await fetch('/api/dashboard/changelog', { credentials: 'include' });

			if (!response.ok) {
				const body = await response.json().catch(() => null);

				throw new Error(body?.message || `${response.status} ${response.statusText}`);
			}

			const text = await response.text();

			html = await renderMarkdown(text);
		} catch (err) {
			error = err?.message || 'Failed to load changelog.';
		}

		loading = false;
	}

	function close() {
		changelogOpen.set(false);
	}

	function handleBackdrop(event) {
		if (event.target === dialogEl) {
			close();
		}
	}

	function handleKey(event) {
		if (event.key === 'Escape') {
			close();
		}
	}
</script>

<svelte:window on:keydown={handleKey} />

{#if $changelogOpen}
	<div
		class="changelog-backdrop"
		bind:this={dialogEl}
		on:click={handleBackdrop}
		role="presentation"
	>
		<div
			class="changelog-modal"
			role="dialog"
			aria-modal="true"
			aria-labelledby="changelog-title"
			tabindex="-1"
		>
			<header class="modal-head">
				<h2 id="changelog-title">
					Changelog
					<a
						id="project-commit-value"
						class="commit-link"
						href={commitUrl}
						target="_blank"
						rel="noopener noreferrer"
					>
						({commitHashShort})
					</a>
				</h2>
				<button class="close-btn" type="button" on:click={close} aria-label="Close changelog">×</button>
			</header>
			<div class="modal-body">
				{#if loading}
					<p class="state">Loading...</p>
				{:else if error}
					<p class="state error">{error}</p>
				{:else if html}
					<article class="markdown">
						{@html html}
					</article>
				{:else}
					<p class="state">No changelog available.</p>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.changelog-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(2, 8, 11, 0.6);
		display: grid;
		place-items: center;
		padding: 2rem 1rem;
		z-index: 80;
		backdrop-filter: blur(8px);
	}

	.changelog-modal {
		width: min(820px, 100%);
		max-height: 86vh;
		display: flex;
		flex-direction: column;
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		overflow: hidden;
	}

	.modal-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-3) var(--space-4);
		border-bottom: 1px solid var(--border);
		background: color-mix(in srgb, var(--panel) 80%, transparent);
	}

	.modal-head h2 {
		margin: 0;
		font-size: var(--fs-md);
		color: var(--accent);
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}

	.commit-link {
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		font-size: var(--fs-xs);
		color: var(--muted);
		text-decoration: none;
	}

	.commit-link:hover {
		color: var(--accent);
	}

	.close-btn {
		background: transparent;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--muted);
		cursor: pointer;
		font-size: 1.2rem;
		line-height: 1;
		padding: 0.18rem 0.55rem;
		transition: color var(--tx-base), border-color var(--tx-base);
	}

	.close-btn:hover {
		color: var(--text);
		border-color: var(--accent);
	}

	.modal-body {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-4) var(--space-5);
	}

	.state {
		text-align: center;
		color: var(--muted);
		font-size: var(--fs-sm);
		padding: var(--space-5) 0;
		margin: 0;
	}

	.state.error {
		color: #ff8e74;
	}

	.markdown {
		font-size: var(--fs-md);
		line-height: 1.65;
		color: var(--text);
	}

	.markdown :global(h1),
	.markdown :global(h2),
	.markdown :global(h3),
	.markdown :global(h4),
	.markdown :global(h5),
	.markdown :global(h6) {
		margin: 1.5em 0 0.5em;
		font-weight: 700;
		letter-spacing: -0.01em;
		color: var(--text);
	}

	.markdown :global(h1) {
		font-size: 1.55em;
		padding-bottom: 0.3em;
		border-bottom: 1px solid var(--border);
	}

	.markdown :global(h2) {
		font-size: 1.3em;
		padding-bottom: 0.25em;
		border-bottom: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
	}

	.markdown :global(h3) {
		font-size: 1.12em;
		color: var(--accent);
	}

	.markdown :global(h4) {
		font-size: 1em;
		color: var(--accent);
	}

	.markdown :global(p) {
		margin: 0.6em 0;
	}

	.markdown :global(a) {
		color: var(--accent);
		text-decoration: underline;
		text-decoration-color: color-mix(in srgb, var(--accent) 50%, transparent);
		text-underline-offset: 3px;
		transition: color var(--tx-base), text-decoration-color var(--tx-base);
	}

	.markdown :global(a:hover) {
		text-decoration-color: var(--accent);
	}

	.markdown :global(strong) {
		color: var(--text);
		font-weight: 700;
	}

	.markdown :global(em) {
		color: color-mix(in srgb, var(--text) 92%, transparent);
		font-style: italic;
	}

	.markdown :global(code) {
		background: color-mix(in srgb, var(--accent) 14%, transparent);
		color: var(--accent);
		padding: 0.12em 0.4em;
		border-radius: var(--radius-sm);
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		font-size: 0.88em;
	}

	.markdown :global(pre) {
		position: relative;
		background: color-mix(in srgb, var(--bg) 80%, var(--panel));
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 0.9em 1em;
		overflow-x: auto;
		margin: 0.8em 0;
	}

	.markdown :global(pre code) {
		background: transparent;
		color: var(--text);
		padding: 0;
		border-radius: 0;
		font-size: 0.86em;
		line-height: 1.55;
	}

	.markdown :global(.md-code-lang) {
		position: absolute;
		top: 0.4em;
		right: 0.6em;
		font-size: 0.7em;
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
		padding: 0.1em 0.45em;
		border: 1px solid var(--border);
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, var(--panel) 85%, transparent);
	}

	.markdown :global(blockquote) {
		margin: 0.8em 0;
		padding: 0.4em 0.95em;
		border-left: 3px solid var(--accent);
		background: color-mix(in srgb, var(--accent) 10%, transparent);
		color: color-mix(in srgb, var(--text) 88%, transparent);
		border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
	}

	.markdown :global(blockquote p) {
		margin: 0;
	}

	.markdown :global(ul),
	.markdown :global(ol) {
		margin: 0.6em 0;
		padding-left: 1.6em;
	}

	.markdown :global(li) {
		margin: 0.25em 0;
	}

	.markdown :global(li::marker) {
		color: var(--accent);
	}

	.markdown :global(hr) {
		border: none;
		border-top: 1px solid var(--border);
		margin: 1.6em 0;
	}

	.markdown :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin: 0.8em 0;
		font-size: 0.95em;
	}

	.markdown :global(th),
	.markdown :global(td) {
		text-align: left;
		padding: 0.45em 0.7em;
		border: 1px solid var(--border);
	}

	.markdown :global(th) {
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		color: var(--accent);
		font-weight: 600;
	}

	.markdown :global(img) {
		max-width: 100%;
		border-radius: var(--radius-sm);
		margin: 0.4em 0;
	}

	@media (max-width: 640px) {
		.modal-body {
			padding: var(--space-3) var(--space-4);
		}

		.markdown {
			font-size: var(--fs-sm);
		}
	}
</style>
