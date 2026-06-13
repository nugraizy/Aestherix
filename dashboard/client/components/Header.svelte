<script>
	import { createEventDispatcher, onMount, tick } from 'svelte';

	export let page = 'home';
	export let mode = 'dark';
	export let isViewer = false;

	const dispatch = createEventDispatcher();

	const navItems = [
		{ id: 'home', label: 'Home', icon: 'nf-fa-home' },
		{ id: 'controls', label: 'Controls', icon: 'nf-fa-sliders' },
		{ id: 'groups', label: 'Groups', icon: 'nf-fa-users' },
		{ id: 'subbots', label: 'Sub-Bots', icon: 'nf-md-robot' },
		{ id: 'messages', label: 'Messages', icon: 'nf-fa-comment' },
		{ id: 'broadcast', label: 'Broadcast', icon: 'nf-fa-bullhorn' },
		{ id: 'albums', label: 'Albums', icon: 'nf-fa-images' },
		{ id: 'tools', label: 'Tools', icon: 'nf-fa-wrench', badge: 'New!' },
		{ id: 'manual-solve', label: 'Solver', icon: 'nf-fa-shield' },
		{ id: 'settings', label: 'Settings', icon: 'nf-fa-gear' },
		{ id: 'system', label: 'System', icon: 'nf-fa-server' },
		{ id: 'editor', label: 'Editor', icon: 'nf-fa-code' }
	];

	const viewerHidden = new Set(['settings', 'editor', 'system', 'broadcast', 'messages']);

	let scrollEl;
	let canScrollLeft = false;
	let canScrollRight = false;

	$: visibleItems = isViewer
		? navItems.filter((item) => !viewerHidden.has(item.id))
		: navItems;

	function checkScroll() {
		if (!scrollEl) return;
		const { scrollLeft, scrollWidth, clientWidth } = scrollEl;
		canScrollLeft = scrollLeft > 2;
		canScrollRight = scrollLeft < scrollWidth - clientWidth - 2;
	}

	function scrollBy(direction) {
		if (!scrollEl) return;
		scrollEl.scrollBy({ left: direction * 200, behavior: 'smooth' });
	}

	function scrollToActive() {
		if (!scrollEl) return;
		const activeEl = scrollEl.querySelector('.pill.active');
		if (activeEl) {
			activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
		}
	}

	onMount(async () => {
		await tick();
		checkScroll();
		scrollToActive();
	});

	$: if (page && scrollEl) {
		tick().then(() => {
			checkScroll();
			scrollToActive();
		});
	}
</script>

<header class="app-header">
	<div class="header-row">
		<div class="brand">
			<span class="logo" aria-hidden="true">&#x2726;</span>
			<span class="title">Aestherix</span>
		</div>

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
	</div>

	<nav class="pill-nav" aria-label="Primary">
		{#if canScrollLeft}
			<button type="button" class="scroll-arrow left" on:click={() => scrollBy(-1)} aria-label="Scroll left">
				<i class="nf nf-fa-chevron_left"></i>
			</button>
		{/if}

		<div class="pill-track" bind:this={scrollEl} on:scroll={checkScroll}>
			{#each visibleItems as item (item.id)}
				<button
					type="button"
					class="pill"
					class:active={page === item.id}
					aria-current={page === item.id ? 'page' : undefined}
					on:click={() => dispatch('navigate', item.id)}
				>
					<i class="nf {item.icon} pill-icon"></i>
					<span class="pill-label">{item.label}</span>
					{#if item.badge}
						<span class="pill-badge">{item.badge}</span>
					{/if}
				</button>
			{/each}
		</div>

		{#if canScrollRight}
			<button type="button" class="scroll-arrow right" on:click={() => scrollBy(1)} aria-label="Scroll right">
				<i class="nf nf-fa-chevron_right"></i>
			</button>
		{/if}
	</nav>
</header>

<style>
	.app-header {
		position: sticky;
		top: 0;
		z-index: 30;
		display: flex;
		flex-direction: column;
		gap: 0;
		border-bottom: 1px solid var(--border);
		background: color-mix(in srgb, var(--panel) 86%, transparent);
		backdrop-filter: blur(14px) saturate(1.1);
	}

	.header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-3) var(--space-5) var(--space-2);
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

	.actions {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}

	/* ── Pill nav ── */
	.pill-nav {
		position: relative;
		display: flex;
		align-items: center;
		padding: 0 var(--space-5) var(--space-3);
	}

	.pill-track {
		display: flex;
		gap: 0.3rem;
		overflow-x: auto;
		scroll-behavior: smooth;
		scroll-snap-type: x proximity;
		-ms-overflow-style: none;
		scrollbar-width: none;
		padding: 2px 0;
		flex: 1;
	}

	.pill-track::-webkit-scrollbar {
		display: none;
	}

	.pill {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.75rem;
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--radius-pill);
		color: var(--muted);
		font-size: var(--fs-sm);
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		flex-shrink: 0;
		scroll-snap-align: center;
		transition:
			background var(--tx-base),
			color var(--tx-base),
			border-color var(--tx-base),
			box-shadow var(--tx-base);
	}

	.pill:hover {
		color: var(--text);
		background: color-mix(in srgb, var(--accent) 8%, transparent);
		border-color: color-mix(in srgb, var(--accent) 15%, transparent);
	}

	.pill.active {
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 14%, transparent);
		border-color: color-mix(in srgb, var(--accent) 30%, transparent);
		box-shadow: 0 0 8px color-mix(in srgb, var(--accent) 12%, transparent);
	}

	.pill-icon {
		font-size: 0.85em;
		flex-shrink: 0;
	}

	.pill-label {
		line-height: 1;
	}

	.pill-badge {
		font-size: 0.55rem;
		font-weight: 700;
		padding: 1px 5px;
		border-radius: var(--radius-pill);
		background: var(--accent);
		color: var(--bg);
		margin-left: 2px;
		line-height: 1.4;
	}

	/* ── Scroll arrows ── */
	.scroll-arrow {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: var(--panel);
		border: 1px solid var(--border);
		color: var(--muted);
		font-size: 0.65rem;
		cursor: pointer;
		flex-shrink: 0;
		transition: color var(--tx-base), border-color var(--tx-base);
		z-index: 2;
	}

	.scroll-arrow:hover {
		color: var(--text);
		border-color: color-mix(in srgb, var(--accent) 40%, var(--border));
	}

	.scroll-arrow.left {
		margin-right: var(--space-1);
	}

	.scroll-arrow.right {
		margin-left: var(--space-1);
	}

	/* ── Theme switch ── */
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
		.header-row {
			padding: var(--space-2) var(--space-3) var(--space-1);
		}

		.pill-nav {
			padding: 0 var(--space-3) var(--space-2);
		}

		.pill {
			padding: 0.35rem 0.6rem;
			font-size: var(--fs-xs);
			gap: 0.3rem;
		}

		.pill-icon {
			font-size: 0.8em;
		}

		.scroll-arrow {
			width: 22px;
			height: 22px;
			font-size: 0.55rem;
		}
	}
</style>
