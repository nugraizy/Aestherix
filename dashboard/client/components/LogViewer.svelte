<script>
	import { logs } from '../lib/stores.js';
	import { clearLogs } from '../lib/socket.js';
	import { afterUpdate } from 'svelte';
	import { stripAnsi, ansiToHtml } from '../lib/format.js';
	import Tooltip from './ui/Tooltip.svelte';

	let container;
	let autoScroll = true;

	function formatTime(entry) {
		if (entry.time) {
			return entry.time;
		}

		if (entry.timestamp) {
			const d = new Date(entry.timestamp);

			return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
		}

		return '';
	}

	function handleScroll() {
		if (!container) {
			return;
		}

		const { scrollTop, scrollHeight, clientHeight } = container;

		autoScroll = scrollHeight - scrollTop - clientHeight < 50;
	}

	function handleClear() {
		clearLogs();
	}

	afterUpdate(() => {
		if (autoScroll && container) {
			container.scrollTop = container.scrollHeight;
		}
	});
</script>

<section class="section log-viewer">
	<header class="section-head">
		<h3 class="section-title">
			Logs
			<span class="section-count">{$logs.length}</span>
			{#if autoScroll}
				<span class="tail" title="Auto-scrolling to latest">live</span>
			{:else}
				<span class="tail paused" title="Scroll to bottom to resume tailing">paused</span>
			{/if}
		</h3>
		<Tooltip text="Clear the local log buffer. Server logs continue to stream." placement="bottom">
			<button class="clear-btn" type="button" on:click={handleClear} disabled={!$logs.length}>
				Clear
			</button>
		</Tooltip>
	</header>
	<div class="log-container" bind:this={container} on:scroll={handleScroll}>
		{#each $logs as entry (entry._id)}
			<div class="log-entry">
				<span class="log-time">{stripAnsi(formatTime(entry))}</span>
				<span class="log-msg">{@html ansiToHtml(entry.message || entry.text || '')}</span>
			</div>
		{/each}
		{#if !$logs.length}
			<p class="empty">No logs yet.</p>
		{/if}
	</div>
</section>

<style>
	.log-viewer {
		max-height: 460px;
	}

	.tail {
		font-size: var(--fs-xs);
		font-weight: 500;
		padding: 2px 8px;
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, #87f0c1 22%, transparent);
		color: #87f0c1;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.tail.paused {
		background: color-mix(in srgb, #f0c887 18%, transparent);
		color: #f0c887;
	}

	.clear-btn {
		background: transparent;
		border: 1px solid var(--border);
		color: var(--muted);
		padding: 0.32rem 0.7rem;
		border-radius: var(--radius-sm);
		font-size: var(--fs-xs);
		font-weight: 600;
		cursor: pointer;
		transition: border-color var(--tx-base), color var(--tx-base);
	}

	.clear-btn:hover:not(:disabled) {
		border-color: #ff8e74;
		color: #ff8e74;
	}

	.clear-btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.log-container {
		overflow-y: auto;
		padding: var(--space-2) var(--space-4);
		flex: 1;
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		font-size: var(--fs-xs);
	}

	.log-entry {
		padding: 0.18rem 0;
		display: flex;
		gap: var(--space-2);
	}

	.log-time {
		color: color-mix(in srgb, var(--muted) 75%, transparent);
		flex-shrink: 0;
	}

	.log-msg {
		color: var(--text);
		word-break: break-word;
	}
</style>
