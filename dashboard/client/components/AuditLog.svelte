<script>
	import { onMount } from 'svelte';
	import { get } from '../lib/api.js';

	let entries = [];
	let loading = true;

	onMount(async () => {
		try {
			const data = await get('/audit?limit=100');

			entries = data.logs || data || [];
		} catch {
			entries = [];
		}

		loading = false;
	});

	function formatTime(value) {
		if (!value) {
			return '';
		}

		const ts = Number(value) || Date.parse(value);

		if (!Number.isFinite(ts)) {
			return String(value);
		}

		const d = new Date(ts);

		return d.toLocaleTimeString();
	}
</script>

<section class="section audit-log">
	<header class="section-head">
		<h3 class="section-title">Audit Log</h3>
		<span class="section-count">{entries.length}</span>
	</header>
	<div class="list">
		{#if loading}
			<p class="empty">Loading...</p>
		{:else if !entries.length}
			<p class="empty">No audit entries.</p>
		{:else}
			{#each entries as entry}
				<div class="entry" class:failed={entry.status === 'failed'}>
					<span class="time">{formatTime(entry.time || entry.timestamp)}</span>
					<span class="action">{entry.action || ''}</span>
					<span class="detail">{entry.detail || entry.message || entry.target || ''}</span>
					<span class="role">{entry.role || entry.actorRole || ''}</span>
				</div>
			{/each}
		{/if}
	</div>
</section>

<style>
	.audit-log {
		max-height: 460px;
	}

	.list {
		overflow-y: auto;
		padding: var(--space-2) var(--space-4);
		flex: 1;
	}

	.entry {
		display: grid;
		grid-template-columns: auto 7rem 1fr auto;
		gap: var(--space-2);
		padding: 0.32rem 0;
		font-size: var(--fs-xs);
		align-items: center;
		border-bottom: 1px dashed color-mix(in srgb, var(--border) 70%, transparent);
	}

	.entry:last-child {
		border-bottom: none;
	}

	.entry.failed .action {
		color: #ff8e74;
	}

	.time {
		color: color-mix(in srgb, var(--muted) 75%, transparent);
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
	}

	.action {
		color: #f0c887;
		font-weight: 600;
	}

	.detail {
		color: var(--text);
		word-break: break-word;
	}

	.role {
		color: var(--muted);
		text-transform: uppercase;
		font-size: 0.66rem;
		letter-spacing: 0.06em;
	}
</style>
