<script>
	import { onMount, onDestroy } from 'svelte';
	import { get } from '../lib/api.js';
	import { socket } from '../lib/socket.js';
	import Tooltip from './ui/Tooltip.svelte';
	import { formatLogTime } from '../lib/format.js';

	let entries = [];
	let loading = true;
	let socketBound = false;

	async function load() {
		try {
			const data = await get('/audit?limit=100');

			entries = (data.logs || data || []).reverse();
		} catch {
			entries = [];
		}

		loading = false;
	}

	function handleAuditUpdate(payload) {
		if (!payload?.logs?.length) {
			return;
		}

		const newEntries = (payload.logs || []).reverse();

		for (const entry of newEntries) {
			const id = entry.id ?? entry.time ?? entry.timestamp;
			const exists = entries.some((existing) => (existing.id ?? existing.time ?? existing.timestamp) === id);

			if (!exists) {
				entries = [entry, ...entries];
			}
		}

		if (entries.length > 200) {
			entries = entries.slice(0, 200);
		}
	}

	onMount(() => {
		void load();

		if (!socketBound) {
			socket.on('dashboard:audit', handleAuditUpdate);
			socketBound = true;
		}
	});

	onDestroy(() => {
		socket.off('dashboard:audit', handleAuditUpdate);
	});

	function buildDetail(entry) {
		return entry.detail || entry.message || entry.target || '';
	}

	function buildTooltip(entry) {
		const parts = [];

		if (entry.target) {
			parts.push(`Target: ${entry.target}`);
		}

		if (entry.after && typeof entry.after === 'object') {
			const changes = Object.entries(entry.after)
				.map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
				.join(', ');

			if (changes) {
				parts.push(`Changed: ${changes}`);
			}
		} else if (entry.after) {
			parts.push(`After: ${JSON.stringify(entry.after)}`);
		}

		if (entry.before && typeof entry.before === 'object') {
			const prev = Object.entries(entry.before)
				.map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
				.join(', ');

			if (prev) {
				parts.push(`Before: ${prev}`);
			}
		}

		if (entry.message) {
			parts.push(entry.message);
		}

		return parts.join('\n') || '';
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
				<Tooltip text={buildTooltip(entry)} placement="left">
					<div class="entry" class:failed={entry.status === 'failed'}>
						<span class="time">{formatLogTime(entry.time || entry.timestamp)}</span>
						<span class="action">{entry.action || ''}</span>
						<span class="detail">{buildDetail(entry)}</span>
						<span class="role">{entry.role || entry.actorRole || ''}</span>
					</div>
				</Tooltip>
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

	.list > :global(.tooltip-host) {
		display: block;
		width: 100%;
	}

	.entry {
		display: grid;
		grid-template-columns: auto minmax(0, max-content) minmax(0, 1fr) auto;
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
		white-space: nowrap;
	}

	.action {
		color: #f0c887;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.detail {
		color: var(--text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 0;
	}

	.role {
		color: var(--muted);
		text-transform: uppercase;
		font-size: 0.66rem;
		letter-spacing: 0.06em;
		white-space: nowrap;
	}

	@media (max-width: 720px) {
		.entry {
			grid-template-columns: auto 1fr;
			grid-template-areas:
				"time role"
				"action action"
				"detail detail";
			gap: 0.25rem 0.5rem;
			padding: 0.5rem 0.4rem;
		}

		.time {
			grid-area: time;
		}

		.role {
			grid-area: role;
			justify-self: end;
		}

		.action {
			grid-area: action;
		}

		.detail {
			grid-area: detail;
			white-space: normal;
			text-overflow: clip;
		}
	}
</style>
