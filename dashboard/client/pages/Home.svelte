<script>
	import AuditLog from '../components/AuditLog.svelte';
	import LogViewer from '../components/LogViewer.svelte';
	import QuickSend from '../components/QuickSend.svelte';
	import StatusPanel from '../components/StatusPanel.svelte';

	export let isViewer = false;
	export let onLogout = null;
</script>

<div class="home">
	<header class="page-head">
		<h2>Overview</h2>
		<p class="page-sub">Real-time bot status, log stream, and audit trail.</p>
	</header>

	<StatusPanel {isViewer} {onLogout} />

	{#if !isViewer}
		<div class="grid">
			<LogViewer />
			<AuditLog />
		</div>
	{/if}

	<QuickSend {isViewer} />
</div>

<style>
	.home {
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
		grid-template-columns: 1fr 1fr;
		gap: var(--space-4);
	}

	@media (max-width: 900px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
