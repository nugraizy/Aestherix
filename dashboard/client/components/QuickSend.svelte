<script>
	import { quickSend } from '../lib/api.js';
	import { showError, showSuccess } from '../lib/toast.js';
	import Dropdown from './ui/Dropdown.svelte';

	export let isViewer = false;

	const TYPE_OPTIONS = [
		{ value: 'user', label: 'User' },
		{ value: 'group', label: 'Group' }
	];

	let type = 'user';
	let recipient = '';
	let message = '';
	let sending = false;

	$: suffix = type === 'group' ? '@g.us' : '@s.whatsapp.net';
	$: placeholder = type === 'group' ? 'Group ID (e.g. 120363...)' : 'Phone number (e.g. 628...)';

	function buildJid() {
		const raw = recipient.trim();

		if (raw.includes('@')) {
			return raw;
		}

		return `${raw}${suffix}`;
	}

	async function handleSend() {
		if (!recipient.trim() || !message.trim() || sending || isViewer) {
			return;
		}

		sending = true;

		try {
			await quickSend(buildJid(), message.trim());
			showSuccess(`Sent to ${buildJid()}`);
			message = '';
		} catch (error) {
			showError(error?.message || 'Failed to send.');
		}

		sending = false;
	}

	function handleKey(event) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSend();
		}
	}
</script>

{#if !isViewer}
	<section class="section quick-send">
		<header class="section-head">
			<h3 class="section-title">Quick Send</h3>
		</header>
		<div class="section-body qs-body">
			<div class="qs-jid-row">
				<Dropdown
					value={type}
					options={TYPE_OPTIONS}
					on:change={(e) => (type = e.detail)}
				/>
				<div class="qs-input-wrap">
					<input
						class="input qs-jid"
						type="text"
						{placeholder}
						bind:value={recipient}
					/>
					<span class="qs-suffix">{suffix}</span>
				</div>
			</div>
			<div class="qs-row">
				<input
					class="input qs-msg"
					type="text"
					placeholder="Message..."
					bind:value={message}
					on:keydown={handleKey}
				/>
				<button
					class="btn primary"
					type="button"
					disabled={sending || !recipient.trim() || !message.trim()}
					on:click={handleSend}
				>
					{sending ? '...' : 'Send'}
				</button>
			</div>
		</div>
	</section>
{/if}

<style>
	.quick-send {
		max-width: 600px;
	}

	.qs-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.qs-jid-row {
		display: flex;
		gap: var(--space-2);
		align-items: center;
	}

	.qs-input-wrap {
		flex: 1;
		position: relative;
		display: flex;
		align-items: center;
	}

	.qs-jid {
		max-width: none;
		width: 100%;
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		font-size: var(--fs-sm);
		padding-right: 8rem;
	}

	.qs-suffix {
		position: absolute;
		right: 0.6rem;
		font-size: var(--fs-xs);
		color: var(--muted);
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		pointer-events: none;
	}

	.qs-row {
		display: flex;
		gap: var(--space-2);
	}

	.qs-msg {
		flex: 1;
		max-width: none;
	}
</style>
