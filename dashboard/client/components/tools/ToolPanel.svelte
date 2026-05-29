<script>
	import { createEventDispatcher } from 'svelte';

	export let title = '';
	export let icon = '';

	const dispatch = createEventDispatcher();
</script>

<div class="tool-panel">
	<header class="tool-header">
		<button class="back-btn" type="button" on:click={() => dispatch('close')} aria-label="Back to tools">
			<i class="nf nf-fa-chevron_left"></i> Back
		</button>
		<span class="tool-icon"><i class="nf {icon}"></i></span>
		<h3 class="tool-title">{title}</h3>
	</header>
	<div class="tool-body">
		<slot />
	</div>
</div>

<style>
	.tool-panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		animation: tool-enter 0.2s ease-out;
	}

	@keyframes tool-enter {
		from { opacity: 0; transform: translateY(8px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.tool-header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.back-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		padding: 0.4rem 0.85rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		background: var(--bg);
		color: var(--muted);
		font-size: var(--fs-sm);
		font-weight: 600;
		cursor: pointer;
		transition: border-color var(--tx-base), color var(--tx-base);
	}

	.back-btn :global(.nf) {
		font-size: 0.7em;
	}

	.back-btn:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.tool-icon {
		font-size: 1.2rem;
		color: var(--accent);
	}

	.tool-title {
		margin: 0;
		font-size: var(--fs-lg);
		font-weight: 600;
	}

	.tool-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
</style>
