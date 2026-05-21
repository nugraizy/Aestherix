<script>
	import { createEventDispatcher } from 'svelte';
	import Tooltip from './ui/Tooltip.svelte';

	export let page = 'home';
	export let mode = 'dark';
	export let isViewer = false;

	const dispatch = createEventDispatcher();
	const navItems = [
		{ id: 'home', label: 'Home' },
		{ id: 'controls', label: 'Controls' },
		{ id: 'groups', label: 'Groups' },
		{ id: 'messages', label: 'Messages' },
		{ id: 'broadcast', label: 'Broadcast' },
		{ id: 'albums', label: 'Albums' },
		{ id: 'settings', label: 'Settings' },
		{ id: 'system', label: 'System' },
		{ id: 'editor', label: 'Editor' }
	];

	$: visibleNavItems = isViewer
		? navItems.filter((item) => item.id !== 'settings' && item.id !== 'editor' && item.id !== 'system' && item.id !== 'broadcast' && item.id !== 'messages')
		: navItems;
</script>

<header class="app-header">
	<div class="brand">
		<span class="logo" aria-hidden="true">✦</span>
		<span class="title">Aestherix</span>
	</div>

	<nav class="nav" aria-label="Primary">
		{#each visibleNavItems as item}
			<button
				type="button"
				class="nav-btn"
				class:active={page === item.id}
				on:click={() => dispatch('navigate', item.id)}
			>
				{item.label}
			</button>
		{/each}
	</nav>

	<div class="actions">
		<Tooltip text="Toggle light/dark mode" placement="bottom">
			<button
				class="icon-btn mode-toggle"
				type="button"
				on:click={() => dispatch('mode')}
				aria-pressed={mode === 'light'}
				aria-label="Toggle light or dark mode"
			>
				<span class="icon-stack" data-mode={mode}>
					<svg
						class="icon sun"
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						fill="currentColor"
						viewBox="0 0 16 16"
						aria-hidden="true"
					>
						<path d="M12 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708" />
					</svg>
					<svg
						class="icon moon"
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						fill="currentColor"
						viewBox="0 0 16 16"
						aria-hidden="true"
					>
						<path d="M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.792-.001 1.533-.16a.79.79 0 0 1 .81.316.73.73 0 0 1-.031.893A8.35 8.35 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.75.75 0 0 1 6 .278" />
						<path d="M10.794 3.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387a1.73 1.73 0 0 0-1.097 1.097l-.387 1.162a.217.217 0 0 1-.412 0l-.387-1.162A1.73 1.73 0 0 0 9.31 6.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387a1.73 1.73 0 0 0 1.097-1.097zM13.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.16 1.16 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.16 1.16 0 0 0-.732-.732l-.774-.258a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732z" />
					</svg>
				</span>
			</button>
		</Tooltip>
	</div>
</header>

<style>
	.app-header {
		position: sticky;
		top: 0;
		z-index: 30;
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-3) var(--space-5);
		border-bottom: 1px solid var(--border);
		background: color-mix(in srgb, var(--panel) 86%, transparent);
		backdrop-filter: blur(14px) saturate(1.1);
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
	}

	.logo {
		font-size: 1.2rem;
		color: var(--accent);
	}

	.title {
		font-weight: 600;
		font-size: var(--fs-md);
		letter-spacing: 0.02em;
	}

	.nav {
		display: flex;
		gap: 0.15rem;
		flex: 1;
		flex-wrap: wrap;
	}

	.nav-btn {
		background: transparent;
		border: none;
		color: var(--muted);
		font-size: var(--fs-sm);
		cursor: pointer;
		padding: 0.45rem 0.8rem;
		border-radius: var(--radius-sm);
		transition: background var(--tx-base), color var(--tx-base);
	}

	.nav-btn:hover {
		color: var(--text);
		background: color-mix(in srgb, var(--accent) 10%, transparent);
	}

	.nav-btn.active {
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 18%, transparent);
	}

	.actions {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.icon-btn {
		background: transparent;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 0.3rem 0.55rem;
		color: var(--muted);
		font-size: 0.95rem;
		cursor: pointer;
		transition: border-color var(--tx-base), color var(--tx-base);
	}

	.icon-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.mode-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		padding: 0;
		border-radius: 999px;
		font-size: 0.95rem;
		line-height: 1;
		font-family: 'JetBrainsMono Nerd Font', 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
	}

	.icon-stack {
		position: relative;
		display: inline-flex;
		width: 16px;
		height: 16px;
	}

	.icon-stack .icon {
		position: absolute;
		inset: 0;
		transition: opacity 0.32s ease, transform 0.32s ease;
	}

	.icon-stack[data-mode='light'] .sun {
		opacity: 1;
		transform: rotate(0deg) scale(1);
	}

	.icon-stack[data-mode='light'] .moon {
		opacity: 0;
		transform: rotate(90deg) scale(0.4);
	}

	.icon-stack[data-mode='dark'] .sun {
		opacity: 0;
		transform: rotate(-90deg) scale(0.4);
	}

	.icon-stack[data-mode='dark'] .moon {
		opacity: 1;
		transform: rotate(0deg) scale(1);
	}

	.icon-btn:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	@media (max-width: 768px) {
		.app-header {
			flex-wrap: wrap;
			padding: var(--space-2) var(--space-3);
			gap: var(--space-2);
			align-items: center;
		}

		.brand {
			flex: 0 0 auto;
		}

		.actions {
			margin-left: auto;
			flex-wrap: nowrap;
		}

		.nav {
			order: 3;
			flex: 0 0 100%;
			width: 100%;
			gap: 0.15rem;
			justify-content: flex-start;
			flex-wrap: nowrap;
			overflow-x: auto;
			scrollbar-width: none;
			-ms-overflow-style: none;
		}

		.nav::-webkit-scrollbar {
			display: none;
		}

		.nav-btn {
			padding: 0.4rem 0.7rem;
			font-size: var(--fs-xs);
			white-space: nowrap;
			flex-shrink: 0;
		}
	}

	@media (max-width: 540px) {
		.actions {
			margin-left: auto;
		}

		.actions :global(.dropdown .label) {
			display: none;
		}
	}
</style>
