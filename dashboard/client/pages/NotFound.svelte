<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let attemptedPath = '';

	if (typeof window !== 'undefined') {
		attemptedPath = `${window.location.pathname}${window.location.search}`;
	}

	function goHome() {
		dispatch('navigate', 'home');
	}
</script>

<section class="not-found">
	<div class="card">
		<span class="code">404</span>
		<h2>Page not found</h2>
		<p class="lead">
			We could not find <code>{attemptedPath}</code>.
			It may have been moved, renamed, or never existed.
		</p>
		<button class="home-btn" type="button" on:click={goHome}>
			Back to dashboard
		</button>
	</div>
</section>

<style>
	.not-found {
		display: grid;
		place-items: center;
		min-height: 60vh;
		padding: var(--space-5) var(--space-3);
	}

	.card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		text-align: center;
		max-width: 480px;
		padding: var(--space-5) var(--space-4);
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
	}

	.code {
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		font-size: 4.4rem;
		font-weight: 700;
		line-height: 1;
		color: var(--accent);
		letter-spacing: -0.04em;
		text-shadow: 0 0 28px color-mix(in srgb, var(--accent) 32%, transparent);
	}

	h2 {
		margin: 0;
		font-size: var(--fs-xl);
		letter-spacing: -0.01em;
	}

	.lead {
		margin: 0;
		color: var(--muted);
		font-size: var(--fs-sm);
		line-height: 1.55;
	}

	.lead code {
		padding: 0.1rem 0.35rem;
		font-size: 0.82em;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--text);
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		word-break: break-all;
	}

	.home-btn {
		margin-top: var(--space-2);
		background: var(--accent);
		border: 1px solid transparent;
		color: var(--bg);
		padding: 0.55rem 1.2rem;
		border-radius: var(--radius-pill);
		font-size: var(--fs-sm);
		font-weight: 600;
		cursor: pointer;
		transition: filter var(--tx-base);
	}

	.home-btn:hover {
		filter: brightness(1.1);
	}
</style>
