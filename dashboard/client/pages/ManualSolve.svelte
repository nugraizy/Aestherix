<script>
	import { onMount } from 'svelte';
	import { get, post } from '../lib/api.js';
	import { socket, connect as connectSocket } from '../lib/socket.js';
	import { showError, showSuccess } from '../lib/toast.js';

	export let active = true;

	let challenges = [];
	let history = [];
	let activeId = null;
	let frameSrc = '';
	let frameMeta = null;
	let loading = false;
	let claiming = null;
	let markingSolved = null;
	let viewerEl = null;
	let viewerRoot = null;
	let lastMoveAt = 0;
	let mouseDown = false;
	let wasActive = false;

	$: viewport = frameMeta || null;

	$: if (active && !wasActive) {
		wasActive = true;
		if (activeId) {
			joinSession(activeId);
		}
	}

	$: if (!active && wasActive) {
		wasActive = false;
		if (activeId) {
			leaveSession(activeId);
		}
	}

	async function loadChallenges() {
		loading = true;
		try {
			const data = await get('/manual-solve/challenges');
			challenges = data?.challenges || [];
		} catch {
			// ignore
		} finally {
			loading = false;
		}
	}

	async function loadHistory() {
		try {
			const data = await get('/manual-solve/history');
			history = data?.history || [];
		} catch {
			// ignore
		}
	}

	function selectSession(id) {
		if (id === activeId) {
			return;
		}

		if (activeId) {
			leaveSession(activeId);
		}

		activeId = id;
		frameSrc = '';
		frameMeta = null;

		if (activeId && active) {
			joinSession(activeId);
		}
	}

	function joinSession(id) {
		if (!id) {
			return;
		}

		socket.emit('dashboard:manual-solve:join', { id });
	}

	function leaveSession(id) {
		if (!id) {
			return;
		}

		socket.emit('dashboard:manual-solve:leave', { id });
	}

	async function claimChallenge(id) {
		claiming = id;
		try {
			const result = await post(`/manual-solve/challenges/${encodeURIComponent(id)}/claim`, {});

			if (result.ok) {
				selectSession(id);
				showSuccess('Challenge claimed.');
			} else {
				showError(result.message || 'Failed to claim challenge.');
			}
		} catch (error) {
			showError(error?.message || 'Failed to claim challenge.');
		} finally {
			claiming = null;
		}
	}

	async function markAsSolved(id) {
		markingSolved = id;
		try {
			const result = await post(`/manual-solve/challenges/${encodeURIComponent(id)}/manual-solve`, {});

			if (result.ok) {
				showSuccess('Challenge marked as solved.');
			} else {
				showError(result.message || 'Failed to mark as solved.');
			}
		} catch (error) {
			showError(error?.message || 'Failed to mark as solved.');
		} finally {
			markingSolved = null;
		}
	}

	function modifiersFromEvent(event) {
		let modifiers = 0;

		if (event.altKey) modifiers |= 1;
		if (event.ctrlKey) modifiers |= 2;
		if (event.metaKey) modifiers |= 4;
		if (event.shiftKey) modifiers |= 8;

		return modifiers;
	}

	function toDeviceCoords(event) {
		if (!viewerEl || !viewport) {
			return null;
		}

		const rect = viewerEl.getBoundingClientRect();
		const scaleX = viewport.width / rect.width;
		const scaleY = viewport.height / rect.height;
		const x = Math.max(0, Math.min(viewport.width, (event.clientX - rect.left) * scaleX));
		const y = Math.max(0, Math.min(viewport.height, (event.clientY - rect.top) * scaleY));

		return { x: Math.round(x), y: Math.round(y) };
	}

	function sendMouse(eventType, event, extra = {}) {
		const coords = toDeviceCoords(event);

		if (!coords || !activeId) {
			return;
		}

		socket.emit('dashboard:manual-solve:input', {
			id: activeId,
			input: {
				type: 'mouse',
				event: eventType,
				x: coords.x,
				y: coords.y,
				button: extra.button || 'left',
				buttons: typeof extra.buttons === 'number' ? extra.buttons : mouseDown ? 1 : 0,
				clickCount: extra.clickCount || 1,
				modifiers: modifiersFromEvent(event)
			}
		});
	}

	function handlePointerMove(event) {
		if (!activeId) {
			return;
		}

		const now = Date.now();

		if (now - lastMoveAt < 16) {
			return;
		}

		lastMoveAt = now;
		sendMouse('mouseMoved', event, { button: mouseDown ? 'left' : 'none', buttons: mouseDown ? 1 : 0, clickCount: 0 });
	}

	function handlePointerDown(event) {
		mouseDown = true;
		viewerRoot?.focus();
		sendMouse('mousePressed', event, { button: 'left', buttons: 1, clickCount: 1 });
	}

	function handlePointerUp(event) {
		mouseDown = false;
		sendMouse('mouseReleased', event, { button: 'left', buttons: 0, clickCount: 1 });
	}

	function handleWheel(event) {
		const coords = toDeviceCoords(event);

		if (!coords || !activeId) {
			return;
		}

		socket.emit('dashboard:manual-solve:input', {
			id: activeId,
			input: {
				type: 'wheel',
				x: coords.x,
				y: coords.y,
				deltaX: event.deltaX,
				deltaY: event.deltaY,
				modifiers: modifiersFromEvent(event)
			}
		});
	}

	function handleKeyDown(event) {
		if (!activeId) {
			return;
		}

		const text = event.key && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey ? event.key : '';

		socket.emit('dashboard:manual-solve:input', {
			id: activeId,
			input: {
				type: 'key',
				event: 'keyDown',
				key: event.key,
				code: event.code,
				keyCode: event.keyCode || 0,
				modifiers: modifiersFromEvent(event),
				text
			}
		});

		if (text) {
			event.preventDefault();
		}
	}

	function handleKeyUp(event) {
		if (!activeId) {
			return;
		}

		socket.emit('dashboard:manual-solve:input', {
			id: activeId,
			input: {
				type: 'key',
				event: 'keyUp',
				key: event.key,
				code: event.code,
				keyCode: event.keyCode || 0,
				modifiers: modifiersFromEvent(event)
			}
		});
	}

	onMount(() => {
		if (!socket.connected) {
			connectSocket();
		}

		const params = new URLSearchParams(window.location.search);
		const challengeParam = params.get('challenge');

		const handleChallenges = (payload) => {
			challenges = payload?.challenges || [];

			if (activeId) {
				const match = challenges.find((c) => c.id === activeId);

				if (!match) {
					activeId = null;
					frameSrc = '';
					frameMeta = null;
				}
			}
		};

		const handleFrame = (payload) => {
			if (!payload || payload.id !== activeId) {
				return;
			}

			frameSrc = `data:image/jpeg;base64,${payload.data}`;
			frameMeta = payload.meta || frameMeta;
		};

		socket.on('solver:challenges', handleChallenges);
		socket.on('dashboard:manual-solve:frame', handleFrame);
		void loadChallenges();
		void loadHistory();

		if (challengeParam) {
			claimChallenge(challengeParam);
		}

		return () => {
			socket.off('solver:challenges', handleChallenges);
			socket.off('dashboard:manual-solve:frame', handleFrame);

			if (activeId) {
				leaveSession(activeId);
			}
		};
	});
</script>

<div class="manual-solve">
	<header class="page-head">
		<h2>CF Solver</h2>
		<p class="page-sub">Solve Cloudflare challenges manually via live Puppeteer sessions.</p>
	</header>

	<div class="toolbar">
		<button class="btn" type="button" on:click={loadChallenges} disabled={loading}>
			{loading ? 'Refreshing...' : 'Refresh'}
		</button>
	</div>

	<div class="grid">
		<section class="section">
			<div class="section-head">
				<h3 class="section-title">Pending Challenges</h3>
				<span class="section-count">{challenges.length}</span>
			</div>
			<div class="section-body">
				{#if !challenges.length}
					<p class="empty">No pending challenges.</p>
				{:else}
					<ul class="session-list">
						{#each challenges as challenge (challenge.id)}
							<li class="session-item" class:active={challenge.id === activeId}>
								<div class="session-main">
									<div class="session-title">
										<span class="badge badge-{challenge.status}">{challenge.status}</span>
										{challenge.service}
									</div>
									<div class="session-url">{challenge.url}</div>
								</div>
								<div class="session-actions">
									{#if challenge.status === 'pending'}
										<button
											class="btn mini primary"
											type="button"
											disabled={claiming === challenge.id}
											on:click={() => claimChallenge(challenge.id)}
										>
											{claiming === challenge.id ? 'Claiming...' : 'Solve'}
										</button>
									{:else if challenge.status === 'solving'}
										<button class="btn mini" type="button" on:click={() => selectSession(challenge.id)}>
											{challenge.id === activeId ? 'Viewing' : 'Watch'}
										</button>
										<button
											class="btn mini primary"
											type="button"
											disabled={markingSolved === challenge.id}
											on:click={() => markAsSolved(challenge.id)}
										>
											{markingSolved === challenge.id ? 'Marking...' : 'Mark Solved'}
										</button>
									{:else if challenge.status === 'solved'}
										<span class="solved-label">Solved</span>
									{/if}
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			{#if history.length}
				<div class="section-head history-head">
					<h3 class="section-title">History</h3>
					<span class="section-count">{history.length}</span>
				</div>
				<div class="section-body">
					<ul class="session-list">
						{#each history as entry (entry.id)}
							<li class="session-item history-item">
								<div class="session-main">
									<div class="session-title">
										<span class="badge badge-{entry.status}">{entry.status}</span>
										{entry.service}
									</div>
									<div class="session-url">{entry.url}</div>
									<div class="history-meta">
										{new Date(entry.createdAt).toLocaleString()}
										{#if entry.failReason}
											&middot; {entry.failReason}
										{/if}
									</div>
								</div>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</section>

		<section class="section viewer-section">
			<div class="section-head">
				<h3 class="section-title">Live View</h3>
			</div>
			<div class="section-body viewer-body">
				{#if !activeId}
					<p class="empty">Select a challenge to start viewing.</p>
				{:else if !frameSrc}
					<div class="viewer-placeholder">Waiting for frames...</div>
				{:else}
					<div
						class="viewer"
						tabindex="0"
						bind:this={viewerRoot}
						on:keydown={handleKeyDown}
						on:keyup={handleKeyUp}
					>
						<img
							class="viewer-frame"
							src={frameSrc}
							alt="Manual solve frame"
							draggable="false"
							bind:this={viewerEl}
							on:pointermove={handlePointerMove}
							on:pointerdown={handlePointerDown}
							on:pointerup={handlePointerUp}
							on:pointerleave={() => (mouseDown = false)}
							on:dragstart|preventDefault
							on:wheel={handleWheel}
						/>
					</div>
				{/if}
			</div>
		</section>
	</div>
</div>

<style>
	.manual-solve {
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

	.toolbar {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.btn {
		border: 1px solid var(--border);
		background: var(--bg);
		color: var(--text);
		padding: 0.45rem 0.9rem;
		border-radius: var(--radius-sm);
		font-size: var(--fs-sm);
		cursor: pointer;
		transition: border-color var(--tx-base), color var(--tx-base), background var(--tx-base);
	}

	.btn:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.btn.primary {
		background: color-mix(in srgb, var(--accent) 20%, var(--bg));
		border-color: color-mix(in srgb, var(--accent) 60%, var(--border));
		color: var(--text);
		font-weight: 600;
	}

	.btn.mini {
		padding: 0.25rem 0.6rem;
		font-size: 0.75rem;
	}

	.btn.danger {
		border-color: color-mix(in srgb, #ff6b6b 50%, var(--border));
		color: #ffb3b3;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.grid {
		display: grid;
		grid-template-columns: 1.1fr 1.7fr;
		gap: var(--space-4);
		align-items: stretch;
		min-height: 60vh;
	}

	.session-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.session-item {
		display: flex;
		gap: var(--space-2);
		justify-content: space-between;
		align-items: center;
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--panel) 80%, transparent);
	}

	.session-item.active {
		border-color: var(--accent);
		box-shadow: var(--shadow-sm);
	}

	.session-main {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.session-title {
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.session-url {
		font-size: 0.75rem;
		color: var(--muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 220px;
	}

	.session-actions {
		display: inline-flex;
		gap: 0.4rem;
		flex-shrink: 0;
		align-items: center;
	}

	.viewer-section {
		display: flex;
		flex-direction: column;
	}

	.viewer-body {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
	}

	.viewer {
		width: 100%;
		height: 100%;
		min-height: 360px;
		background: #0f111a;
		display: flex;
		align-items: center;
		justify-content: center;
		outline: none;
	}

	.viewer-frame {
		max-width: 100%;
		max-height: 100%;
		display: block;
		object-fit: contain;
		cursor: crosshair;
		user-select: none;
	}

	.viewer-placeholder {
		color: var(--muted);
		font-size: var(--fs-sm);
	}

	.session-meta {
		font-size: 0.75rem;
		color: var(--muted);
	}

	.sessions-head {
		margin-top: var(--space-4);
		padding-top: var(--space-3);
		border-top: 1px solid var(--border);
	}

	.badge {
		display: inline-block;
		padding: 0.1rem 0.45rem;
		border-radius: 999px;
		font-size: 0.65rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.badge-pending {
		background: color-mix(in srgb, #f0ad4e 20%, transparent);
		color: #f0ad4e;
		border: 1px solid color-mix(in srgb, #f0ad4e 40%, transparent);
	}

	.badge-solving {
		background: color-mix(in srgb, #5bc0de 20%, transparent);
		color: #5bc0de;
		border: 1px solid color-mix(in srgb, #5bc0de 40%, transparent);
	}

	.badge-solved {
		background: color-mix(in srgb, #5cb85c 20%, transparent);
		color: #5cb85c;
		border: 1px solid color-mix(in srgb, #5cb85c 40%, transparent);
	}

	.solved-label {
		font-size: 0.75rem;
		color: #5cb85c;
		font-weight: 600;
	}

	.history-head {
		margin-top: var(--space-4);
		padding-top: var(--space-3);
		border-top: 1px solid var(--border);
	}

	.history-item {
		opacity: 0.7;
	}

	.history-meta {
		font-size: 0.65rem;
		color: var(--muted);
		margin-top: 0.15rem;
	}

	.badge-failed {
		background: color-mix(in srgb, #d9534f 20%, transparent);
		color: #d9534f;
		border: 1px solid color-mix(in srgb, #d9534f 40%, transparent);
	}

	@media (max-width: 980px) {
		.grid {
			grid-template-columns: 1fr;
		}

		.viewer {
			min-height: 320px;
		}

		.session-url {
			max-width: 100%;
		}
	}
</style>
