<script>
	import { createEventDispatcher } from 'svelte';

	export let title = '';
	export let icon = '';
	export let logo = '';
	export let hideHeader = false;

	const dispatch = createEventDispatcher();
</script>

<div class="tool-panel">
	{#if !hideHeader}
	<header class="tool-header">
		<button class="back-btn" type="button" on:click={() => dispatch('close')} aria-label="Back to tools">
			<i class="nf nf-fa-chevron_left"></i> Back
		</button>
		<span class="tool-icon">
			{#if logo}
				<span class="tool-logo" style="mask-image: url({logo}); -webkit-mask-image: url({logo})"></span>
			{:else}
				<i class="nf {icon}"></i>
			{/if}
		</span>
		<h3 class="tool-title">{title}</h3>
	</header>
	{/if}
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
		padding: 0.5rem 1rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		background: var(--bg);
		color: var(--muted);
		font-size: var(--fs-sm);
		font-weight: 600;
		cursor: pointer;
		transition: border-color var(--tx-base), color var(--tx-base);
		min-height: 40px;
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
		display: flex;
		align-items: center;
	}

	.tool-logo {
		width: 2.2rem;
		height: 2.2rem;
		background: currentColor;
		mask-size: contain;
		mask-repeat: no-repeat;
		mask-position: center;
		-webkit-mask-size: contain;
		-webkit-mask-repeat: no-repeat;
		-webkit-mask-position: center;
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

	@media (max-width: 640px) {
		.tool-header {
			gap: var(--space-2);
		}

		.back-btn {
			padding: 0.4rem 0.75rem;
			font-size: var(--fs-xs);
		}

		.tool-icon {
			font-size: 1rem;
		}

		.tool-logo {
			width: 1.8rem;
			height: 1.8rem;
		}

		.tool-title {
			font-size: var(--fs-md);
		}
	}
</style>
