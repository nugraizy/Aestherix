<script>
	import { onDestroy } from 'svelte';
	import { getMessageLogs } from '../lib/api.js';
	import { messageLogs } from '../lib/stores.js';
	import { showError } from '../lib/toast.js';
	import { createQueryState } from '../lib/urlState.js';
	import Tooltip from '../components/ui/Tooltip.svelte';
	import { escapeHtml, highlight } from '../lib/highlight.js';

	const STALE_MS = 30_000;
	const DEFAULT_LIMIT = 300;
	const logsQuery = createQueryState('', {
		q:   { type: 'string', default: '' },
		jid: { type: 'string', default: '' }
	});

	export let active = true;
	let searchTimeout;
	let wasActive = false;

	$: if (active && !wasActive) {
		wasActive = true;
		const urlState = logsQuery.read();
		if (urlState.q) messageLogs.update((c) => ({ ...c, search: urlState.q }));
		if (urlState.jid) messageLogs.update((c) => ({ ...c, jidFilter: urlState.jid }));
		void load({ force: false });
	}

	onDestroy(() => logsQuery.strip());

	$: if (!active && wasActive) {
		wasActive = false;
	}

	async function load({ force = false } = {}) {
		const state = $messageLogs;
		const isFirstLoad = !state.loaded || !state.messages.length;

		if (!force && state.loaded && state.messages.length && Date.now() - state.lastFetchedAt < STALE_MS) {
			return;
		}

		if (!isFirstLoad) {
			messageLogs.update((current) => ({ ...current, loading: true }));
		}

		try {
			const data = await getMessageLogs({
				q: state.search || undefined,
				jid: state.jidFilter || undefined,
				limit: DEFAULT_LIMIT
			});

			messageLogs.update((current) => ({
				...current,
				messages: data?.messages || [],
				loading: false,
				loaded: true,
				lastFetchedAt: Date.now()
			}));
		} catch (error) {
			messageLogs.update((current) => ({ ...current, loading: false }));

			if (isFirstLoad) {
				showError(error?.message || 'Failed to load messages.');
			}
		}
	}

	function handleSearch() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			const state = $messageLogs;
			logsQuery.write({ q: state.search || '', jid: state.jidFilter || '' });
			messageLogs.update((current) => ({ ...current, search: current.search, jidFilter: current.jidFilter }));
			void load({ force: true });
		}, 400);
	}

	function formatTime(ts) {
		if (!ts) {
			return '';
		}

		return new Date(ts * 1000).toLocaleString();
	}

	function truncate(text, max = 80) {
		if (!text) {
			return '(no text)';
		}

		return text.length > max ? text.slice(0, max) + '...' : text;
	}

	function searchHighlight(text, term) {
		return highlight(truncate(text), term, 'hl');
	}

	$: messages = $messageLogs.messages;
	$: loading = $messageLogs.loading;
	$: search = $messageLogs.search;
	$: jidFilter = $messageLogs.jidFilter;
</script>

<div class="messages-page">
	<header class="page-head">
		<h2><i class="nf nf-fa-comment"></i> Message Logs</h2>
		<p class="page-sub">Searchable message history from the bot's store.</p>
	</header>

	<section class="section">
		<header class="section-head">
			<h3 class="section-title">Messages <span class="section-count">{messages.length}{messages.length >= DEFAULT_LIMIT ? '+' : ''}</span></h3>
			<div class="filters">
				<input
					class="input"
					type="text"
					placeholder="Search content..."
					bind:value={$messageLogs.search}
					on:input={handleSearch}
				/>
				<input
					class="input jid-filter"
					type="text"
					placeholder="Filter by JID..."
					bind:value={$messageLogs.jidFilter}
					on:input={handleSearch}
				/>
			</div>
		</header>
		<div class="section-body msg-list">
			{#if loading && !messages.length}
				{#each Array(8) as _, i}
					<div class="msg-row msg-skeleton" aria-hidden="true">
						<span class="skel skel-time"></span>
						<span class="skel skel-jid"></span>
						<span class="skel skel-type"></span>
						<span class="skel skel-content"></span>
					</div>
				{/each}
			{:else if !messages.length}
				<p class="empty">No messages found.</p>
			{:else}
				{#each messages as msg (msg.id)}
					<div class="msg-row" class:from-me={msg.fromMe}>
						<span class="msg-time">{formatTime(msg.timestamp)}</span>
						<Tooltip text={msg.sender || msg.jid} placement="top">
							<span class="msg-jid">{msg.sender?.split('@')[0] || msg.jid?.split('@')[0]}</span>
						</Tooltip>
						<span class="msg-type">{msg.type}</span>
						<Tooltip html={searchHighlight(msg.content, search)} placement="top">
							<span class="msg-content">{@html searchHighlight(msg.content, search)}</span>
						</Tooltip>
					</div>
				{/each}
			{/if}
		</div>
	</section>
</div>

<style>
	.messages-page {
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

	.filters {
		display: inline-flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.jid-filter {
		max-width: 180px;
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		font-size: var(--fs-xs);
	}

	.msg-list {
		overflow-y: auto;
		max-height: clamp(400px, 65vh, 700px);
	}

	.msg-row {
		display: grid;
		grid-template-columns: auto minmax(80px, max-content) auto 1fr;
		gap: var(--space-2);
		padding: 0.35rem 0.4rem;
		font-size: var(--fs-xs);
		align-items: center;
		border-bottom: 1px dashed color-mix(in srgb, var(--border) 60%, transparent);
	}

	.msg-row:last-child {
		border-bottom: none;
	}

	.msg-row.from-me {
		background: color-mix(in srgb, var(--accent) 5%, transparent);
	}

	.msg-time {
		color: var(--muted);
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		white-space: nowrap;
	}

	.msg-jid {
		color: var(--accent);
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 120px;
	}

	.msg-type {
		color: var(--muted);
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: 0.1rem 0.4rem;
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, var(--muted) 14%, transparent);
		white-space: nowrap;
	}

	.msg-content {
		color: var(--text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 0;
	}

	.msg-content :global(mark.hl) {
		background: color-mix(in srgb, var(--accent) 32%, transparent);
		color: var(--accent);
		padding: 0 2px;
		border-radius: 3px;
		font-weight: 700;
	}

	/* Loading skeleton */
	.msg-skeleton {
		display: grid;
		grid-template-columns: auto minmax(80px, max-content) auto 1fr;
		gap: var(--space-2);
		align-items: center;
	}

	.skel {
		height: 10px;
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--muted) 12%, transparent);
		animation: pulse 1.4s ease-in-out infinite;
	}

	.skel-time {
		width: 110px;
	}

	.skel-jid {
		width: 65px;
	}

	.skel-type {
		width: 45px;
	}

	.skel-content {
		width: 100%;
		min-width: 60px;
	}

	@keyframes pulse {
		0%, 100% { opacity: 0.5; }
		50% { opacity: 1; }
	}

	@media (max-width: 720px) {
		.msg-row {
			grid-template-columns: 1fr;
			grid-auto-rows: auto;
			gap: 0.2rem;
			padding: 0.5rem 0.4rem;
		}

		.msg-time,
		.msg-jid,
		.msg-type {
			font-size: 0.65rem;
		}

		.msg-jid {
			max-width: none;
			justify-self: start;
		}

		.msg-type {
			justify-self: start;
		}

		.msg-content {
			white-space: normal;
			text-overflow: clip;
			overflow: hidden;
			display: -webkit-box;
			-webkit-line-clamp: 3;
			-webkit-box-orient: vertical;
		}

		.msg-skeleton {
			grid-template-columns: 1fr;
			gap: 0.25rem;
		}

		.skel-time,
		.skel-jid,
		.skel-type {
			width: 40%;
		}
	}
</style>
