<script>
	import { tick } from 'svelte';
	import { fade, scale } from 'svelte/transition';

	import { activeConfirm } from '../lib/confirm.js';

	let dialogEl;
	let confirmBtn;
	let cancelBtn;
	let inputEl;
	let inputValue = '';

	$: current = $activeConfirm;
	$: void focusInitial(current);

	async function focusInitial(value) {
		if (!value) {
			return;
		}

		await tick();

		if (value.input) {
			inputValue = value.defaultValue || '';
			inputEl?.focus?.();
			inputEl?.select?.();
			return;
		}

		const target = value.danger ? cancelBtn : confirmBtn;

		target?.focus?.();
	}

	function handleConfirm() {
		if (current?.input) {
			current?.resolve?.(inputValue);
		} else {
			current?.resolve?.(true);
		}
	}

	function handleCancel() {
		if (current?.input) {
			current?.resolve?.(null);
		} else {
			current?.resolve?.(false);
		}
	}

	function handleKey(event) {
		if (!current) {
			return;
		}

		if (event.key === 'Escape') {
			event.preventDefault();
			handleCancel();
			return;
		}

		if (event.key === 'Enter' && !current.danger) {
			event.preventDefault();
			handleConfirm();
		}
	}

	function handleBackdrop(event) {
		if (event.target === event.currentTarget) {
			handleCancel();
		}
	}

	function trapTab(event) {
		if (event.key !== 'Tab' || !dialogEl) {
			return;
		}

		const focusables = dialogEl.querySelectorAll('button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])');

		if (!focusables.length) {
			return;
		}

		const first = focusables[0];
		const last = focusables[focusables.length - 1];

		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}
</script>

<svelte:window on:keydown={handleKey} />

{#if current}
	<div
		class="backdrop"
		role="presentation"
		on:click={handleBackdrop}
		on:keydown={trapTab}
		transition:fade={{ duration: 140 }}
	>
		<div
			bind:this={dialogEl}
			class="dialog"
			class:danger={current.danger}
			role="dialog"
			aria-modal="true"
			aria-labelledby="confirm-title"
			aria-describedby={current.message ? 'confirm-message' : undefined}
			transition:scale={{ duration: 160, start: 0.94 }}
		>
			<header class="head">
				<h3 id="confirm-title">{current.title}</h3>
			</header>
			{#if current.message}
				<p id="confirm-message" class="message">{current.message}</p>
			{/if}
			{#if current.input}
				<input
					bind:this={inputEl}
					class="input dialog-input"
					type="text"
					placeholder={current.placeholder || ''}
					bind:value={inputValue}
					on:keydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleConfirm(); } }}
				/>
			{/if}
			<div class="actions">
				<button
					bind:this={cancelBtn}
					class="btn cancel"
					type="button"
					on:click={handleCancel}
				>
					{current.cancelLabel}
				</button>
				<button
					bind:this={confirmBtn}
					class="btn confirm"
					class:danger={current.danger}
					type="button"
					on:click={handleConfirm}
				>
					{current.confirmLabel}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 1000;
		display: grid;
		place-items: center;
		padding: var(--space-4);
		background: rgba(0, 0, 0, 0.55);
		backdrop-filter: blur(4px) saturate(1.05);
	}

	.dialog {
		width: min(100%, 440px);
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		padding: var(--space-4) var(--space-4) var(--space-3);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.dialog.danger {
		border-color: color-mix(in srgb, #ff8e74 38%, var(--border));
	}

	.head h3 {
		margin: 0;
		font-size: var(--fs-lg);
		font-weight: 600;
		color: var(--text);
		letter-spacing: -0.01em;
	}

	.message {
		margin: 0;
		color: var(--muted);
		font-size: var(--fs-sm);
		line-height: 1.55;
		white-space: pre-line;
	}

	.dialog-input {
		width: 100%;
		padding: 0.5rem 0.7rem;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--text);
		font-size: var(--fs-sm);
		outline: none;
		transition: border-color var(--tx-base);
	}

	.dialog-input:focus {
		border-color: var(--accent);
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
		margin-top: var(--space-2);
	}

	.btn {
		min-width: 96px;
	}

	.btn.confirm {
		background: var(--accent);
		color: var(--bg);
		border-color: transparent;
	}

	.btn.confirm:hover:not(:disabled) {
		filter: brightness(1.06);
		color: var(--bg);
		border-color: transparent;
	}

	.btn.confirm.danger {
		background: #ff8e74;
		color: #1a0e0a;
	}

	.btn.confirm.danger:hover:not(:disabled) {
		filter: brightness(1.06);
		color: #1a0e0a;
	}

	@media (max-width: 540px) {
		.actions {
			flex-direction: column-reverse;
		}

		.btn {
			width: 100%;
		}
	}
</style>
