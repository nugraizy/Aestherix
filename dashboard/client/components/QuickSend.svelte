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

	let jidError = '';

	function validateRecipient() {
		const raw = recipient.trim();

		if (!raw) {
			return 'Phone number is required.';
		}

		const digits = raw.replace(/\D/g, '');

		if (digits.length < 10) {
			return 'Enter a valid number with country code (min 10 digits).';
		}

		return '';
	}

	async function handleSend() {
		if (sending || isViewer) {
			return;
		}

		const error = validateRecipient();

		if (error) {
			jidError = error;
			setTimeout(() => { jidError = ''; }, 3000);
			return;
		}

		if (!message.trim()) {
			return;
		}

		jidError = '';
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
						class:qs-error={jidError}
						type="text"
						{placeholder}
						bind:value={recipient}
						aria-label="Recipient JID"
					/>
					<span class="qs-suffix">{suffix}</span>
				</div>
			</div>
			{#if jidError}
				<p class="qs-error-msg">{jidError}</p>
			{/if}
			<div class="qs-row">
				<textarea
					class="input qs-msg"
					placeholder="Message... (Shift+Enter for new line)"
					bind:value={message}
					on:keydown={handleKey}
					aria-label="Message text"
					rows="1"
				></textarea>
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

	.qs-error {
		border-color: #ff8e74 !important;
		animation: shake 0.4s ease;
	}

	.qs-error-msg {
		margin: 0;
		font-size: var(--fs-xs);
		color: #ff8e74;
	}

	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		20% { transform: translateX(-4px); }
		40% { transform: translateX(4px); }
		60% { transform: translateX(-3px); }
		80% { transform: translateX(2px); }
	}

	.qs-msg {
		flex: 1;
		max-width: none;
		resize: none;
		min-height: 2.2rem;
		max-height: 8rem;
		overflow-y: auto;
		field-sizing: content;
	}
</style>
