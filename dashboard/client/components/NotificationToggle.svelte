<script>
	import { onDestroy } from 'svelte';
	import { status } from '../lib/stores.js';

	let permission = typeof Notification !== 'undefined' ? Notification.permission : 'denied';
	let enabled = permission === 'granted';
	let wasOnline = true;

	async function requestPermission() {
		if (typeof Notification === 'undefined') {
			return;
		}

		const result = await Notification.requestPermission();

		permission = result;
		enabled = result === 'granted';
	}

	function notify(title, body) {
		if (!enabled || typeof Notification === 'undefined') {
			return;
		}

		try {
			new Notification(title, { body, icon: '/dashboard/favicon.png' });
		} catch {
			// notification blocked or not supported
		}
	}

	const unsubscribe = status.subscribe((s) => {
		if (!enabled) {
			return;
		}

		if (wasOnline && !s.botOnline && s.connected) {
			notify('Bot Offline', 'The WhatsApp bot has disconnected.');
		}

		if (!wasOnline && s.botOnline && s.connected) {
			notify('Bot Online', 'The WhatsApp bot is back online.');
		}

		wasOnline = s.botOnline;
	});

	onDestroy(unsubscribe);
</script>

{#if permission !== 'granted'}
	<button class="notif-btn" type="button" on:click={requestPermission}>
		🔔 Enable notifications
	</button>
{:else}
	<span class="notif-status">🔔 Notifications on</span>
{/if}

<style>
	.notif-btn {
		background: transparent;
		border: 1px solid var(--border);
		color: var(--muted);
		font-size: var(--fs-xs);
		padding: 0.3rem 0.7rem;
		border-radius: var(--radius-pill);
		cursor: pointer;
		transition: border-color var(--tx-base), color var(--tx-base);
	}

	.notif-btn:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.notif-status {
		font-size: var(--fs-xs);
		color: var(--muted);
	}
</style>
