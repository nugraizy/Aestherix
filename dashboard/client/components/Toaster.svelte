<script>
	import { toasts, dismissToast } from '../lib/toast.js';
	import { onDestroy } from 'svelte';

	let now = Date.now();
	const tickHandle = setInterval(() => { now = Date.now(); }, 250);

	onDestroy(() => clearInterval(tickHandle));

	function remainingLabel(toast) {
		if (!toast.actionExpiresAt) {
			return toast.actionLabel;
		}

		const remaining = Math.max(0, toast.actionExpiresAt - now);
		const seconds = Math.ceil(remaining / 1000);

		return `${toast.actionLabel} (${seconds}s)`;
	}

	async function runAction(toast) {
		if (!toast.onAction) {
			return;
		}

		try {
			await toast.onAction();
		} catch (error) {
			console.error('Toast action failed:', error);
		}

		dismissToast(toast.id);
	}
</script>

<div class="toast-host" role="status" aria-live="polite">
	{#each $toasts as toast (toast.id)}
		<div class="toast toast-{toast.type}">
			<span class="toast-text">{toast.message}</span>
			{#if toast.actionLabel && toast.onAction}
				<button
					type="button"
					class="toast-action"
					on:click={() => runAction(toast)}
					disabled={toast.actionExpiresAt > 0 && now >= toast.actionExpiresAt}
				>
					{remainingLabel(toast)}
				</button>
			{/if}
			<button class="toast-close" type="button" aria-label="Dismiss" on:click={() => dismissToast(toast.id)}>×</button>
		</div>
	{/each}
</div>

<style>
	.toast-host {
		position: fixed;
		right: 16px;
		bottom: 16px;
		display: grid;
		gap: 8px;
		z-index: 1200;
		pointer-events: none;
	}

	.toast {
		min-width: 220px;
		max-width: min(360px, calc(100vw - 32px));
		padding: 10px 12px;
		border-radius: 10px;
		border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
		background: color-mix(in srgb, var(--panel) 92%, transparent);
		color: var(--text);
		font-size: 0.84rem;
		display: flex;
		align-items: center;
		gap: 10px;
		pointer-events: auto;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
		animation: toast-in 0.18s ease-out;
	}

	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.toast-text {
		flex: 1;
		min-width: 0;
		word-break: break-word;
	}

	.toast-action {
		padding: 5px 10px;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
		background: color-mix(in srgb, var(--accent) 14%, transparent);
		color: var(--text);
		font-size: 0.74rem;
		line-height: 1;
		white-space: nowrap;
		cursor: pointer;
	}

	.toast-action:hover:not(:disabled) {
		border-color: color-mix(in srgb, var(--accent) 70%, transparent);
		background: color-mix(in srgb, var(--accent) 22%, transparent);
	}

	.toast-action:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.toast-close {
		background: none;
		border: none;
		color: var(--muted);
		font-size: 1.1rem;
		line-height: 1;
		cursor: pointer;
		padding: 0 2px;
	}

	.toast-close:hover {
		color: var(--text);
	}

	.toast-success {
		border-color: rgba(135, 240, 193, 0.45);
	}

	.toast-warning {
		border-color: rgba(255, 209, 102, 0.55);
		background: linear-gradient(160deg, rgba(255, 209, 102, 0.12), color-mix(in srgb, var(--panel) 92%, transparent) 35%);
	}

	.toast-danger,
	.toast-error {
		border-color: rgba(255, 142, 116, 0.6);
		background: linear-gradient(160deg, rgba(255, 142, 116, 0.16), color-mix(in srgb, var(--panel) 92%, transparent) 35%);
	}

	.toast-danger .toast-action,
	.toast-error .toast-action {
		border-color: rgba(255, 142, 116, 0.6);
		background: rgba(255, 142, 116, 0.18);
	}

	.toast-warning .toast-action {
		border-color: rgba(255, 209, 102, 0.6);
		background: rgba(255, 209, 102, 0.18);
	}
</style>
