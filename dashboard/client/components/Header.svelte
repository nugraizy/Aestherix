<script>
	import { createEventDispatcher } from 'svelte';

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
		<label class="theme-switch">
			<input
				class="theme-switch__input"
				type="checkbox"
				role="switch"
				checked={mode === 'dark'}
				on:change={() => dispatch('mode')}
				aria-label="Toggle light or dark mode"
			/>
			<span class="theme-switch__icon" class:dark={mode === 'dark'} aria-hidden="true">
				<span class="theme-switch__part theme-switch__part--1"></span>
				<span class="theme-switch__part theme-switch__part--2"></span>
				<span class="theme-switch__part theme-switch__part--3"></span>
				<span class="theme-switch__part theme-switch__part--4"></span>
				<span class="theme-switch__part theme-switch__part--5"></span>
				<span class="theme-switch__part theme-switch__part--6"></span>
				<span class="theme-switch__part theme-switch__part--7"></span>
				<span class="theme-switch__part theme-switch__part--8"></span>
				<span class="theme-switch__part theme-switch__part--9"></span>
				<span class="theme-switch__part theme-switch__part--10"></span>
				<span class="theme-switch__part theme-switch__part--11"></span>
			</span>
		</label>
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

	.theme-switch {
		position: relative;
		display: inline-block;
		-webkit-tap-highlight-color: transparent;
		font-size: 14px;
		width: 2.6em;
		height: 1.3em;
	}

	.theme-switch__input {
		background-color: color-mix(in srgb, var(--muted) 40%, transparent);
		border-radius: 0.75em;
		cursor: pointer;
		display: block;
		width: 100%;
		height: 100%;
		border: none;
		margin: 0;
		padding: 0;
		transition: background-color 0.4s cubic-bezier(0.65, 0, 0.35, 1);
		-webkit-appearance: none;
		appearance: none;
	}

	.theme-switch__input:checked {
		background-color: color-mix(in srgb, var(--accent) 35%, transparent);
	}

	.theme-switch__input:focus-visible {
		box-shadow: var(--ring);
	}

	.theme-switch__icon {
		position: absolute;
		top: 0.1em;
		left: 0.1em;
		width: 1.1em;
		height: 1.1em;
		border-radius: 50%;
		background-color: var(--bg);
		overflow: hidden;
		pointer-events: none;
		transition: transform 0.4s cubic-bezier(0.65, 0, 0.35, 1);
	}

	.theme-switch__icon.dark {
		transform: translateX(1.3em);
	}

	.theme-switch__part {
		display: block;
		position: absolute;
		top: 0;
		left: 0;
		transition: box-shadow 0.4s cubic-bezier(0.65, 0, 0.35, 1), transform 0.4s cubic-bezier(0.65, 0, 0.35, 1);
	}

	.theme-switch__part--1,
	.theme-switch__part--2,
	.theme-switch__part--3 {
		border-radius: 50%;
	}

	.theme-switch__part--1 {
		background-color: var(--bg);
		top: calc(50% - 0.33em);
		left: calc(50% - 0.33em);
		width: 0.66em;
		height: 0.66em;
	}

	.theme-switch__part--2 {
		background-color: var(--text);
		top: calc(50% - 0.38em);
		left: calc(50% - 0.05em);
		width: 0.44em;
		height: 0.44em;
		transform: translate(-0.16em, 0.16em) scale(0.2);
	}

	.theme-switch__part--3 {
		box-shadow: 0 0 0 0.55em var(--text) inset;
		width: 1.1em;
		height: 1.1em;
		transform: scale(0.25);
	}

	.theme-switch__part--3 ~ .theme-switch__part {
		background-color: var(--text);
		border-radius: 0.05em;
		top: 50%;
		left: 50%;
		width: 0.11em;
		height: 0.16em;
		transform-origin: 50% 0;
	}

	.theme-switch__part--4 { transform: translateX(-50%) rotate(0deg) translateY(0.22em); }
	.theme-switch__part--5 { transform: translateX(-50%) rotate(45deg) translateY(0.22em); }
	.theme-switch__part--6 { transform: translateX(-50%) rotate(90deg) translateY(0.22em); }
	.theme-switch__part--7 { transform: translateX(-50%) rotate(135deg) translateY(0.22em); }
	.theme-switch__part--8 { transform: translateX(-50%) rotate(180deg) translateY(0.22em); }
	.theme-switch__part--9 { transform: translateX(-50%) rotate(225deg) translateY(0.22em); }
	.theme-switch__part--10 { transform: translateX(-50%) rotate(270deg) translateY(0.22em); }
	.theme-switch__part--11 { transform: translateX(-50%) rotate(315deg) translateY(0.22em); }

	.theme-switch__icon.dark .theme-switch__part--2 {
		transform: translate(0, 0) scale(1);
	}

	.theme-switch__icon.dark .theme-switch__part--3 {
		box-shadow: 0 0 0 0.22em var(--text) inset;
		transform: scale(1);
	}

	.theme-switch__icon.dark .theme-switch__part--4 { transform: translateX(-50%) rotate(0deg) translateY(0.55em) scale(0); }
	.theme-switch__icon.dark .theme-switch__part--5 { transform: translateX(-50%) rotate(45deg) translateY(0.55em) scale(0); }
	.theme-switch__icon.dark .theme-switch__part--6 { transform: translateX(-50%) rotate(90deg) translateY(0.55em) scale(0); }
	.theme-switch__icon.dark .theme-switch__part--7 { transform: translateX(-50%) rotate(135deg) translateY(0.55em) scale(0); }
	.theme-switch__icon.dark .theme-switch__part--8 { transform: translateX(-50%) rotate(180deg) translateY(0.55em) scale(0); }
	.theme-switch__icon.dark .theme-switch__part--9 { transform: translateX(-50%) rotate(225deg) translateY(0.55em) scale(0); }
	.theme-switch__icon.dark .theme-switch__part--10 { transform: translateX(-50%) rotate(270deg) translateY(0.55em) scale(0); }
	.theme-switch__icon.dark .theme-switch__part--11 { transform: translateX(-50%) rotate(315deg) translateY(0.55em) scale(0); }

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
