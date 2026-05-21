<div class="pill">
	<slot />
</div>

<style>
	.pill {
		display: inline-flex;
		align-items: stretch;
		border: 1px solid var(--border);
		border-radius: var(--radius-pill, 0.45rem);
		overflow: hidden;
		background: color-mix(in srgb, var(--panel) 70%, transparent);
	}

	.pill :global(.tooltip-host) {
		display: inline-flex;
	}

	.pill :global(.tooltip-host + .tooltip-host) {
		border-left: 1px solid var(--border);
	}

	.pill :global(button) {
		background: transparent;
		border: none;
		border-right: 1px solid var(--border);
		color: var(--text);
		font-size: 0.76rem;
		font-weight: 600;
		padding: 0.35rem 0.8rem;
		cursor: pointer;
		line-height: 1;
		transition: background 0.15s ease, color 0.15s ease, filter 0.15s ease;
	}

	.pill :global(button:last-child) {
		border-right: none;
	}

	.pill :global(.tooltip-host button) {
		border-right: none;
	}

	.pill :global(button:hover:not(:disabled)) {
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		color: var(--accent);
	}

	.pill :global(button:disabled) {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.pill :global(button.primary) {
		background: var(--accent);
		color: var(--bg);
	}

	.pill :global(button.primary:hover:not(:disabled)) {
		filter: brightness(1.08);
		background: var(--accent);
		color: var(--bg);
	}

	.pill :global(button.danger) {
		color: #ff8e74;
	}

	.pill :global(button.danger:hover:not(:disabled)) {
		background: rgba(255, 142, 116, 0.16);
		color: #ff8e74;
	}
</style>
