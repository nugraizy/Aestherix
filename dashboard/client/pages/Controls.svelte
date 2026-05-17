<script>
	import CommandList from '../components/CommandList.svelte';
	import FlagToggle from '../components/FlagToggle.svelte';

	export let isViewer = false;
</script>

<div class="controls">
	<header class="page-head">
		<h2>Controls</h2>
		<p class="page-sub">Toggle commands and runtime flags.</p>
	</header>

	<div class="grid">
		<CommandList {isViewer} />
		<FlagToggle {isViewer} />
	</div>
</div>

<style>
	.controls {
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

	.grid {
		display: grid;
		grid-template-columns: 1.4fr 1fr;
		gap: var(--space-4);
		align-items: stretch;
		height: clamp(420px, 72vh, 760px);
	}

	.grid > :global(*) {
		min-height: 0;
		height: 100%;
	}

	@media (max-width: 900px) {
		.grid {
			grid-template-columns: 1fr;
			height: auto;
		}

		.grid > :global(*) {
			height: clamp(360px, 60vh, 560px);
		}
	}
</style>
