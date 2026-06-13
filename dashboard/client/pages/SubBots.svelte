<script>
	import { onMount, onDestroy } from 'svelte';
	import { getSubBots, startSubBot, stopSubBot, removeSubBot, getSubBotLogs } from '../lib/api.js';
	import { showConfirm } from '../lib/confirm.js';
	import { subBots } from '../lib/stores.js';
	import { showError, showSuccess } from '../lib/toast.js';
	import { connect } from '../lib/socket.js';
	import { ansiToHtml, stripAnsi } from '../lib/format.js';

	export let isViewer = false;

	let loading = true;
	let actionPending = {};
	let logPanel = null;
	let logEntries = [];
	let logLoading = false;
	let logLastId = 0;
	let logPoller = null;
	let logAutoScroll = true;
	let logContainer;

	$: bots = $subBots || [];

	$: if (logAutoScroll && logContainer) {
		logContainer.scrollTop = logContainer.scrollHeight;
	}

	onMount(async () => {
		try {
			const result = await getSubBots();

			if (result?.ok) {
				subBots.set(result.subBots || []);
			}
		} catch (e) {
			showError(e.message || 'Failed to load sub-bots.');
		} finally {
			loading = false;
		}
	});

	function formatFlags(flags) {
		if (!flags || typeof flags !== 'object') return '';

		return Object.entries(flags)
			.filter(([, v]) => v)
			.map(([k]) => `--${k}`)
			.join(' ') || 'none';
	}

	function relativeTime(date) {
		if (!date) return '';

		const diff = Date.now() - new Date(date).getTime();
		const mins = Math.floor(diff / 60000);

		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins}m ago`;

		const hours = Math.floor(mins / 60);

		if (hours < 24) return `${hours}h ago`;

		const days = Math.floor(hours / 24);

		return `${days}d ago`;
	}

	async function handleStart(name) {
		actionPending[name] = true;

		try {
			const result = await startSubBot(name);

			if (result?.ok) {
				showSuccess(`Sub-bot "${name}" started.`);
			} else {
				showError(result?.message || 'Failed to start sub-bot.');
			}
		} catch (e) {
			showError(e.message);
		} finally {
			actionPending[name] = false;
		}
	}

	async function handleStop(name) {
		const confirmed = await showConfirm(`Stop sub-bot "${name}"?`);

		if (!confirmed) return;

		actionPending[name] = true;

		try {
			const result = await stopSubBot(name);

			if (result?.ok) {
				showSuccess(`Sub-bot "${name}" stopped.`);
			} else {
				showError(result?.message || 'Failed to stop sub-bot.');
			}
		} catch (e) {
			showError(e.message);
		} finally {
			actionPending[name] = false;
		}
	}

	async function handleRemove(name) {
		const confirmed = await showConfirm(
			`Remove sub-bot "${name}"? This will deactivate it but keep session data.`
		);

		if (!confirmed) return;

		actionPending[name] = true;

		try {
			const result = await removeSubBot(name);

			if (result?.ok) {
				showSuccess(`Sub-bot "${name}" removed.`);
			} else {
				showError(result?.message || 'Failed to remove sub-bot.');
			}
		} catch (e) {
			showError(e.message);
		} finally {
			actionPending[name] = false;
		}
	}

	async function handlePurge(name) {
		const confirmed = await showConfirm(
			`Purge sub-bot "${name}"? This will permanently delete all session data.`
		);

		if (!confirmed) return;

		actionPending[name] = true;

		try {
			const result = await removeSubBot(name, true);

			if (result?.ok) {
				showSuccess(`Sub-bot "${name}" purged.`);
			} else {
				showError(result?.message || 'Failed to purge sub-bot.');
			}
		} catch (e) {
			showError(e.message);
		} finally {
			actionPending[name] = false;
		}
	}

	function formatLogTime(entry) {
		if (entry.time) return entry.time;

		if (entry.timestamp) {
			const d = new Date(entry.timestamp);

			return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
		}

		return '';
	}

	async function openLogs(name) {
		if (logPanel === name) {
			closeLogs();
			return;
		}

		logPanel = name;
		logEntries = [];
		logLastId = 0;
		logLoading = true;

		await fetchLogs();
		logLoading = false;

		logPoller = setInterval(fetchLogs, 3000);
	}

	function closeLogs() {
		logPanel = null;
		logEntries = [];
		logLastId = 0;

		if (logPoller) {
			clearInterval(logPoller);
			logPoller = null;
		}
	}

	async function fetchLogs() {
		if (!logPanel) return;

		try {
			const result = await getSubBotLogs(logPanel, { since: logLastId, limit: 250 });

			if (result?.ok && result.logs?.length) {
				logEntries = [...logEntries, ...result.logs].slice(-500);
				logLastId = result.lastId || logLastId;
			}
		} catch {
			// Silently ignore fetch errors during polling
		}
	}

	function handleLogScroll() {
		if (!logContainer) return;
		const { scrollTop, scrollHeight, clientHeight } = logContainer;

		logAutoScroll = scrollHeight - scrollTop - clientHeight < 50;
	}

	onDestroy(() => {
		if (logPoller) clearInterval(logPoller);
	});
</script>

<div class="subbots">
	<header class="page-head">
		<h2><i class="nf nf-md-robot"></i> Sub-Bots</h2>
		<p class="page-sub">Manage WhatsApp sub-bot instances.</p>
	</header>

	{#if loading}
		<div class="empty">Loading...</div>
	{:else if bots.length === 0}
		<div class="empty">
			<span class="empty-icon">+</span>
			<p>No sub-bots configured.</p>
			<p class="empty-hint">Use <code>.addbot</code> in WhatsApp to create one.</p>
		</div>
	{:else}
		<div class="bot-grid">
			{#each bots as bot (bot.sessionName)}
				<div class="bot-card" class:connected={bot.connected} class:inactive={!bot.isActive}>
					<div class="card-header">
						<div class="card-title">
							<span class="status-dot" class:online={bot.connected}></span>
							<span class="bot-name">{bot.sessionName}</span>
						</div>
						<span class="badge" class:badge-active={bot.connected} class:badge-inactive={!bot.isActive}>
							{bot.connected ? 'Connected' : bot.isActive ? 'Active' : 'Inactive'}
						</span>
					</div>

					<div class="card-body">
						<div class="info-row">
							<span class="info-label">Phone</span>
							<span class="info-value">{bot.pairNumber || bot.phone || '—'}</span>
						</div>
						<div class="info-row">
							<span class="info-label">Role</span>
							<span class="info-value">{bot.role}</span>
						</div>
						<div class="info-row">
							<span class="info-label">Flags</span>
							<span class="info-value flags">{formatFlags(bot.flags)}</span>
						</div>
						<div class="info-row">
							<span class="info-label">Created</span>
							<span class="info-value">{relativeTime(bot.createdAt)}</span>
						</div>
					</div>

					{#if !isViewer}
						<div class="card-actions">
							<button
								class="btn btn-logs"
								class:active={logPanel === bot.sessionName}
								on:click={() => openLogs(bot.sessionName)}
							>
								{logPanel === bot.sessionName ? 'Hide Logs' : 'Logs'}
							</button>

							{#if bot.connected}
								<button
									class="btn btn-stop"
									disabled={actionPending[bot.sessionName]}
									on:click={() => handleStop(bot.sessionName)}
								>
									Stop
								</button>
							{:else}
								<button
									class="btn btn-start"
									disabled={actionPending[bot.sessionName]}
									on:click={() => handleStart(bot.sessionName)}
								>
									Start
								</button>
							{/if}

							<button
								class="btn btn-remove"
								disabled={actionPending[bot.sessionName]}
								on:click={() => handleRemove(bot.sessionName)}
							>
								Remove
							</button>

							<button
								class="btn btn-purge"
								disabled={actionPending[bot.sessionName]}
								on:click={() => handlePurge(bot.sessionName)}
							>
								Purge
							</button>
						</div>
					{/if}

					{#if logPanel === bot.sessionName}
						<div class="log-panel">
							<div class="log-panel-header">
								<span class="log-panel-title">
									{#if logLoading}
										Loading logs...
									{:else}
										Logs <span class="log-count">{logEntries.length}</span>
										{#if logAutoScroll}
											<span class="tail">live</span>
										{:else}
											<span class="tail paused">paused</span>
										{/if}
									{/if}
								</span>
								<button class="log-close" on:click={closeLogs}>Close</button>
							</div>
							<div class="log-container" bind:this={logContainer} on:scroll={handleLogScroll}>
								{#each logEntries as entry (entry.id)}
									<div class="log-entry">
										<span class="log-time">{stripAnsi(formatLogTime(entry))}</span>
										<span class="log-msg">{@html ansiToHtml(entry.message || '')}</span>
									</div>
								{/each}
								{#if !logEntries.length && !logLoading}
									<p class="log-empty">No logs yet.</p>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.subbots {
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

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-8);
		color: var(--muted);
		text-align: center;
	}

	.empty-icon {
		font-size: 2.5rem;
		opacity: 0.3;
	}

	.empty-hint {
		font-size: var(--fs-sm);
	}

	.empty-hint code {
		background: var(--panel);
		padding: 0.15em 0.4em;
		border-radius: var(--radius-sm);
		font-size: 0.9em;
	}

	.bot-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: var(--space-4);
	}

	.bot-card {
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		transition: border-color 0.15s;
	}

	.bot-card.connected {
		border-color: color-mix(in srgb, var(--accent) 40%, transparent);
	}

	.bot-card.inactive {
		opacity: 0.7;
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
	}

	.card-title {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-width: 0;
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--muted);
		flex-shrink: 0;
	}

	.status-dot.online {
		background: #87f0c1;
		box-shadow: 0 0 6px #87f0c1;
	}

	.bot-name {
		font-weight: 600;
		font-size: var(--fs-base);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.badge {
		font-size: 0.7rem;
		padding: 0.15em 0.5em;
		border-radius: var(--radius-sm);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		flex-shrink: 0;
	}

	.badge-active {
		background: color-mix(in srgb, #87f0c1 15%, transparent);
		color: #87f0c1;
	}

	.badge-inactive {
		background: color-mix(in srgb, var(--muted) 15%, transparent);
		color: var(--muted);
	}

	.card-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--space-2);
		font-size: var(--fs-sm);
	}

	.info-label {
		color: var(--muted);
		flex-shrink: 0;
	}

	.info-value {
		text-align: right;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.info-value.flags {
		font-family: monospace;
		font-size: 0.8rem;
		color: var(--accent);
	}

	.card-actions {
		display: flex;
		gap: var(--space-2);
		padding-top: var(--space-2);
		border-top: 1px solid var(--border);
	}

	.btn {
		flex: 1;
		padding: 0.4em 0.6em;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text);
		font-size: var(--fs-sm);
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s;
	}

	.btn:hover:not(:disabled) {
		background: var(--bg);
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-start {
		border-color: color-mix(in srgb, #87f0c1 40%, transparent);
		color: #87f0c1;
	}

	.btn-start:hover:not(:disabled) {
		background: color-mix(in srgb, #87f0c1 10%, transparent);
	}

	.btn-stop {
		border-color: color-mix(in srgb, #ff8e74 40%, transparent);
		color: #ff8e74;
	}

	.btn-stop:hover:not(:disabled) {
		background: color-mix(in srgb, #ff8e74 10%, transparent);
	}

	.btn-remove {
		border-color: color-mix(in srgb, #e0a030 40%, transparent);
		color: #e0a030;
	}

	.btn-remove:hover:not(:disabled) {
		background: color-mix(in srgb, #e0a030 10%, transparent);
	}

	.btn-purge {
		border-color: color-mix(in srgb, #ff5555 40%, transparent);
		color: #ff5555;
	}

	.btn-purge:hover:not(:disabled) {
		background: color-mix(in srgb, #ff5555 10%, transparent);
	}

	.btn-logs {
		border-color: color-mix(in srgb, var(--accent) 40%, transparent);
		color: var(--accent);
	}

	.btn-logs:hover:not(:disabled),
	.btn-logs.active {
		background: color-mix(in srgb, var(--accent) 10%, transparent);
	}

	.log-panel {
		border-top: 1px solid var(--border);
		margin-top: var(--space-2);
		max-height: 300px;
		display: flex;
		flex-direction: column;
	}

	.log-panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-2) 0;
		gap: var(--space-2);
	}

	.log-panel-title {
		font-size: var(--fs-sm);
		color: var(--muted);
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.log-count {
		font-size: 0.7rem;
		padding: 1px 6px;
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--accent) 15%, transparent);
		color: var(--accent);
	}

	.tail {
		font-size: 0.6rem;
		font-weight: 600;
		padding: 1px 6px;
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

	.log-close {
		background: transparent;
		border: 1px solid var(--border);
		color: var(--muted);
		padding: 0.2rem 0.5rem;
		border-radius: var(--radius-sm);
		font-size: var(--fs-xs);
		cursor: pointer;
		transition: border-color var(--tx-base), color var(--tx-base);
	}

	.log-close:hover {
		border-color: #ff8e74;
		color: #ff8e74;
	}

	.log-container {
		overflow-y: auto;
		flex: 1;
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		font-size: var(--fs-xs);
		padding: var(--space-1) 0;
	}

	.log-entry {
		padding: 0.15rem 0;
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

	.log-empty {
		color: var(--muted);
		font-size: var(--fs-xs);
		text-align: center;
		padding: var(--space-4);
	}

	@media (max-width: 600px) {
		.bot-grid {
			grid-template-columns: 1fr;
		}

		.card-actions {
			flex-wrap: wrap;
		}

		.btn {
			flex: 1 1 40%;
		}
	}
</style>
