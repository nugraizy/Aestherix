<script>
	import { onMount } from 'svelte';
	import Changelog from './components/Changelog.svelte';
	import ConfirmDialog from './components/ConfirmDialog.svelte';
	import DebugPanel from './components/DebugPanel.svelte';
	import HardwareBanner from './components/HardwareBanner.svelte';
	import Header from './components/Header.svelte';
	import Login from './components/Login.svelte';
	import SpotifyWidget from './components/SpotifyWidget.svelte';
	import Toaster from './components/Toaster.svelte';
	import Footer from './components/ui/Footer.svelte';
	import { logout, restartBot, startBot, stopBot } from './lib/api.js';
	import { showConfirm } from './lib/confirm.js';
	import { connect, disconnect } from './lib/socket.js';
	import { logs, status } from './lib/stores.js';
	import { applyPalette, currentPalette, PALETTE_NAMES, setPalette, themeMode, toggleMode } from './lib/theme.js';
	import { showError, showSuccess, showUndoToast } from './lib/toast.js';
	import Controls from './pages/Controls.svelte';
	import Home from './pages/Home.svelte';
	import NotFound from './pages/NotFound.svelte';

	const lazyPages = {
		albums: () => import('./pages/Albums.svelte'),
		broadcast: () => import('./pages/Broadcast.svelte'),
		groups: () => import('./pages/Groups.svelte'),
		messages: () => import('./pages/MessageLogs.svelte'),
		settings: () => import('./pages/Settings.svelte'),
		system: () => import('./pages/System.svelte'),
		editor: () => import('./pages/FileEditor.svelte'),
		tools: () => import('./pages/Tools.svelte')
	};

	let loadedPages = {};

	let page = 'home';
	let authenticated = false;
	let checking = true;
	let debug = false;
	let renderCount = 0;
	let logCount = 0;
	let sessionRole = null;

	$: renderCount++;
	$: isViewer = sessionRole === 'viewer';
	$: if (isViewer && debug) debug = false;

	logs.subscribe((entries) => { logCount = entries.length; });

	const pages = {
		home: Home,
		controls: Controls,
		notfound: NotFound
	};

	const PAGE_NAMES = ['home', 'controls', 'settings', 'groups', 'broadcast', 'messages', 'system', 'albums', 'editor', 'tools', 'notfound'];
	const NAV_PAGES = PAGE_NAMES.filter((name) => name !== 'notfound');
	const PAGE_PATH_BASE = '/dashboard';

	function pageFromPath(path) {
		const trimmed = String(path || '').replace(/^\/+|\/+$/g, '').toLowerCase();

		if (!trimmed) {
			return 'home';
		}

		const parts = trimmed.split('/');
		const head = parts[0];
		const tail = parts[1];

		if (head === 'dashboard') {
			if (!tail) {
				return 'home';
			}

			return NAV_PAGES.includes(tail) ? tail : 'notfound';
		}

		if (head === 'albums') {
			return 'albums';
		}

		return NAV_PAGES.includes(head) ? head : 'notfound';
	}

	function pathForPage(name) {
		if (!name || name === 'home') {
			return `${PAGE_PATH_BASE}/`;
		}

		if (name === 'notfound') {
			return null;
		}

		return `${PAGE_PATH_BASE}/${name}`;
	}

	const VIEWER_BLOCKED_PAGES = new Set(['settings', 'editor', 'system', 'broadcast', 'messages']);

	const pageParams = {};

	function navigate(name, { replace = false } = {}) {
		const previous = page;
		const allowed = name === 'notfound' || NAV_PAGES.includes(name);
		let safe = allowed ? name : 'home';

		if (isViewer && VIEWER_BLOCKED_PAGES.has(safe)) {
			safe = 'notfound';
		}

		if (typeof window !== 'undefined' && previous !== safe) {
			pageParams[previous] = window.location.search;
		}

		page = safe;

		if (typeof window === 'undefined' || typeof history === 'undefined') {
			return;
		}

		const target = pathForPage(safe);

		if (!target || window.location.pathname === target) {
			return;
		}

		const restored = pageParams[safe] || '';

		if (replace) {
			history.replaceState({ page: safe }, '', target + restored);
		} else {
			history.pushState({ page: safe }, '', target + restored);
		}
	}

	function handlePopState(event) {
		const target = event?.state?.page || pageFromPath(window.location.pathname);
		const safe = PAGE_NAMES.includes(target) ? target : 'notfound';

		if (isViewer && VIEWER_BLOCKED_PAGES.has(safe)) {
			page = 'notfound';
			return;
		}

		page = safe;
	}

	if (typeof window !== 'undefined') {
		page = pageFromPath(window.location.pathname);
	}

	onMount(async () => {
		applyPalette($currentPalette);

		if (new URLSearchParams(window.location.search).get('uwu') === 'true') {
			const pet = document.createElement('img');

			pet.src = '/dashboard/shigure-ui-smol.gif';
			pet.className = 'uwu-cursor';
			document.body.appendChild(pet);
			document.addEventListener('mousemove', (e) => {
				pet.style.left = `${e.clientX + 12}px`;
				pet.style.top = `${e.clientY + 12}px`;
			});

			function hexToFilter(hex) {
				const r = parseInt(hex.slice(1, 3), 16);
				const g = parseInt(hex.slice(3, 5), 16);
				const b = parseInt(hex.slice(5, 7), 16);
				const max = Math.max(r, g, b) / 255;
				const min = Math.min(r, g, b) / 255;
				const l = (max + min) / 2;
				let h = 0;
				let s = 0;

				if (max !== min) {
					const d = max - min;

					s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

					const rf = r / 255, gf = g / 255, bf = b / 255;

					if (max === rf) h = ((gf - bf) / d + (gf < bf ? 6 : 0)) * 60;
					else if (max === gf) h = ((bf - rf) / d + 2) * 60;
					else h = ((rf - gf) / d + 4) * 60;
				}

				const sepiaHue = 50;
				const hueRotate = Math.round(h - sepiaHue);
				const saturate = Math.round(Math.min(s * 100, 100) * 10);
				const invert = Math.round(l * 100);

				return `brightness(0) saturate(100%) invert(${invert}%) sepia(100%) saturate(${saturate}%) hue-rotate(${hueRotate}deg)`;
			}

			function updatePetColor() {
				const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();

				if (accent && accent.startsWith('#')) {
					pet.style.filter = hexToFilter(accent);
				}
			}

			updatePetColor();
			const observer = new MutationObserver(updatePetColor);

			observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
		}

		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 3000);
			const response = await fetch('/api/dashboard/auth/session', {
				credentials: 'include',
				signal: controller.signal
			});

			clearTimeout(timeout);

			if (response.ok) {
				const data = await response.json();

				authenticated = Boolean(data?.authenticated);
				sessionRole = data?.role || null;
			}
		} catch {
			authenticated = false;
			sessionRole = null;
		}

		checking = false;

		if (authenticated) {
			connect();
			applyPalette($currentPalette);

			Object.entries(lazyPages).forEach(([name, loader]) => {
				if (sessionRole === 'viewer' && VIEWER_BLOCKED_PAGES.has(name)) {
					return;
				}
				loader().then((mod) => {
					loadedPages = { ...loadedPages, [name]: mod.default };
				});
			});

			if (sessionRole === 'viewer' && VIEWER_BLOCKED_PAGES.has(page)) {
				page = 'notfound';
			}

			navigate(page, { replace: true });

			window.addEventListener('popstate', handlePopState);
		}

		return () => {
			disconnect();
			window.removeEventListener('popstate', handlePopState);
		};
	});

	function handleLogin(detail = {}) {
		authenticated = true;
		if (detail?.role) {
			sessionRole = detail.role;
		}
		connect();
		applyPalette($currentPalette);
		Object.entries(lazyPages).forEach(([name, loader]) => {
			if (sessionRole === 'viewer' && VIEWER_BLOCKED_PAGES.has(name)) {
				return;
			}
			loader().then((mod) => {
				loadedPages = { ...loadedPages, [name]: mod.default };
			});
		});
		showSuccess('Logged in.');
	}

	async function handleLogout() {
		const ok = await showConfirm({
			title: 'Log out',
			message: 'Log out of the dashboard?',
			confirmLabel: 'Log out'
		});

		if (!ok) {
			return;
		}

		try {
			await logout();
			showSuccess('Logged out.');
		} catch (error) {
			showError(error?.message || 'Logout failed.');
		}

		authenticated = false;
		sessionRole = null;
		disconnect();
	}

	async function handleRestart() {
		const ok = await showConfirm({
			title: 'Restart bot',
			message: 'Restart the bot? This will reload the WhatsApp connection.',
			confirmLabel: 'Restart',
			danger: true
		});

		if (!ok) {
			return;
		}

		try {
			const response = await restartBot();

			if (response?.undo?.token) {
				showUndoToast({ message: 'Bot restart triggered.', undo: response.undo });
			} else {
				showSuccess('Bot restart triggered.');
			}
		} catch (error) {
			showError(error?.message || 'Restart failed.');
		}
	}

	async function handleStart() {
		const ok = await showConfirm({
			title: 'Start bot',
			message: 'Start the bot via PM2?',
			confirmLabel: 'Start'
		});

		if (!ok) {
			return;
		}

		try {
			await startBot();
			showSuccess('Bot start requested.');
		} catch (error) {
			showError(error?.message || 'Start failed.');
		}
	}

	async function handleStop() {
		const ok = await showConfirm({
			title: 'Stop bot',
			message: 'Stop the bot? The dashboard will stay online.',
			confirmLabel: 'Stop',
			danger: true
		});

		if (!ok) {
			return;
		}

		try {
			await stopBot();
			showSuccess('Bot stop requested.');
		} catch (error) {
			showError(error?.message || 'Stop failed.');
		}
	}
</script>

{#if checking}
	<div class="boot-loading">
		<div class="spinner" aria-hidden="true"></div>
		<p>Loading dashboard...</p>
	</div>
{:else if !authenticated}
	<Login onLogin={handleLogin} />
{:else}
	<div class="app">
		<a href="#main" class="skip-link">Skip to content</a>
		<Header
			page={page}
			mode={$themeMode}
			isViewer={isViewer}
			on:navigate={(event) => navigate(event.detail)}
			on:mode={() => toggleMode()}
		/>
		{#if debug}
			<DebugPanel renderCount={renderCount} />
		{/if}
		<HardwareBanner />
		<main id="main" class="page" class:wide={page === 'albums' || page === 'editor'}>
			<div class="page-cache" class:page-hidden={page !== 'home'}>
				<Home isViewer={isViewer} onLogout={handleLogout} />
			</div>
			<div class="page-cache" class:page-hidden={page !== 'controls'}>
				<Controls isViewer={isViewer} active={page === 'controls'} />
			</div>
			{#if page === 'notfound'}
				<NotFound on:navigate={(event) => navigate(event.detail)} />
			{/if}
			{#if loadedPages.groups}
				<div class="page-cache" class:page-hidden={page !== 'groups'}>
					<svelte:component this={loadedPages.groups} active={page === 'groups'} />
				</div>
			{/if}
			{#if loadedPages.broadcast}
				<div class="page-cache" class:page-hidden={page !== 'broadcast'}>
					<svelte:component this={loadedPages.broadcast} active={page === 'broadcast'} />
				</div>
			{/if}
			{#if loadedPages.settings}
				<div class="page-cache" class:page-hidden={page !== 'settings'}>
					<svelte:component this={loadedPages.settings} isSuperOwner={sessionRole === 'superOwner'} active={page === 'settings'} />
				</div>
			{/if}
			{#if loadedPages.system}
				<div class="page-cache" class:page-hidden={page !== 'system'}>
					<svelte:component this={loadedPages.system} isSuperOwner={sessionRole === 'superOwner'} active={page === 'system'} bind:debug
						onStart={handleStart} onStop={handleStop} onRestart={handleRestart} />
				</div>
			{/if}
			{#if loadedPages.albums}
				<div class="page-cache" class:page-hidden={page !== 'albums'}>
					<svelte:component this={loadedPages.albums} isViewer={isViewer} active={page === 'albums'} />
				</div>
			{/if}
			{#if loadedPages.messages}
				<div class="page-cache" class:page-hidden={page !== 'messages'}>
					<svelte:component this={loadedPages.messages} active={page === 'messages'} />
				</div>
			{/if}
			{#if loadedPages.editor}
				<div class="page-cache" class:page-hidden={page !== 'editor'}>
					<svelte:component this={loadedPages.editor} active={page === 'editor'} />
				</div>
			{/if}
			{#if loadedPages.tools}
				<div class="page-cache" class:page-hidden={page !== 'tools'}>
					<svelte:component this={loadedPages.tools} active={page === 'tools'} isSuperOwner={sessionRole === 'superOwner'} />
				</div>
			{/if}
		</main>
		<SpotifyWidget />
		<Footer
			palette={$currentPalette}
			paletteOptions={PALETTE_NAMES}
			on:palette={(event) => setPalette(event.detail)}
		/>
	</div>
{/if}

<Toaster />
<ConfirmDialog />
<Changelog />

<style>
	:global(:root) {
		--radius-sm: 0.5rem;
		--radius-md: 0.85rem;
		--radius-lg: 1.1rem;
		--radius-pill: 999px;

		--shadow-sm: 0 4px 14px rgba(0, 0, 0, 0.18);
		--shadow-md: 0 10px 30px rgba(0, 0, 0, 0.28);
		--shadow-lg: 0 24px 60px rgba(0, 0, 0, 0.36);

		--tx-fast: 0.12s ease;
		--tx-base: 0.18s ease;

		--fs-xs: 0.78rem;
		--fs-sm: 0.88rem;
		--fs-md: 1rem;
		--fs-lg: 1.15rem;
		--fs-xl: 1.55rem;

		--space-1: 0.4rem;
		--space-2: 0.65rem;
		--space-3: 0.95rem;
		--space-4: 1.2rem;
		--space-5: 1.65rem;
		--space-6: 2.2rem;

		--ring: 0 0 0 3px color-mix(in srgb, var(--accent) 24%, transparent);
	}

	:global(html, body) {
		margin: 0;
		min-height: 100vh;
		background: var(--bg, #1a1a2e);
		color: var(--text, #e0e0e0);
		font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
		font-size: 15.5px;
		-webkit-font-smoothing: antialiased;
		text-rendering: optimizeLegibility;
	}

	@media (min-width: 1400px) {
		:global(html) {
			font-size: 20px;
		}
	}

	:global(*) {
		box-sizing: border-box;
	}

	:global(button), :global(input), :global(select), :global(textarea) {
		font-family: inherit;
	}

	@media (pointer: coarse) {
		:global(input),
		:global(select),
		:global(textarea) {
			font-size: 16px;
		}

		:global(.cm-content),
		:global(.cm-editor .cm-scroller) {
			font-size: 16px;
		}
	}

	:global(button:focus-visible),
	:global(input:focus-visible),
	:global(select:focus-visible),
	:global(textarea:focus-visible),
	:global(a:focus-visible) {
		outline: none;
		box-shadow: var(--ring);
	}

	:global(::selection) {
		background: color-mix(in srgb, var(--accent) 32%, transparent);
		color: var(--text);
	}

	:global(::-webkit-scrollbar) {
		width: 10px;
		height: 10px;
	}

	:global(::-webkit-scrollbar-track) {
		background: transparent;
	}

	:global(::-webkit-scrollbar-thumb) {
		background: color-mix(in srgb, var(--accent) 70%, transparent);
		border-radius: var(--radius-pill);
		border: 2px solid transparent;
		background-clip: content-box;
	}

	:global(::-webkit-scrollbar-thumb:hover) {
		background: var(--accent);
		background-clip: content-box;
	}

	@supports (scrollbar-color: auto) {
		:global(*) {
			scrollbar-width: auto;
			scrollbar-color: color-mix(in srgb, var(--accent) 70%, transparent) transparent;
		}
	}

	:global(.section) {
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		display: flex;
		flex-direction: column;
		min-width: 0;
		overflow: hidden;
	}

	:global(.section-head) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		border-bottom: 1px solid var(--border);
		background: color-mix(in srgb, var(--panel) 80%, transparent);
		flex-wrap: wrap;
	}

	:global(.section-title) {
		margin: 0;
		font-size: var(--fs-sm);
		font-weight: 600;
		color: var(--accent);
		letter-spacing: 0.02em;
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}

	:global(.section-count) {
		font-size: var(--fs-xs);
		color: var(--muted);
		background: var(--bg);
		border-radius: var(--radius-pill);
		padding: 2px 8px;
		border: 1px solid var(--border);
	}

	:global(.section-body) {
		padding: var(--space-3) var(--space-4);
		flex: 1;
		overflow: auto;
		min-height: 0;
	}
 
	.page-cache {
		width: 100%;
	}

	.page-hidden {
		display: none;
	}

	:global(.empty) {
		color: var(--muted);
		text-align: center;
		padding: var(--space-5) 0;
		font-size: var(--fs-sm);
	}

	:global(.input) {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 0.4rem 0.7rem;
		color: var(--text);
		font-size: var(--fs-sm);
		outline: none;
		transition: border-color var(--tx-base);
		min-width: 0;
	}

	:global(.input:hover) {
		border-color: color-mix(in srgb, var(--accent) 50%, var(--border));
	}

	:global(.input:focus) {
		border-color: var(--accent);
	}

	:global(.btn) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		padding: 0.42rem 0.85rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		background: var(--bg);
		color: var(--text);
		font-size: var(--fs-sm);
		font-weight: 600;
		cursor: pointer;
		transition: border-color var(--tx-base), color var(--tx-base), background var(--tx-base), transform 0.05s ease;
	}

	:global(.btn:hover:not(:disabled)) {
		border-color: var(--accent);
		color: var(--accent);
	}

	:global(.btn:active:not(:disabled)) {
		transform: translateY(1px);
	}

	:global(.btn.primary) {
		background: var(--accent);
		color: var(--bg);
		border-color: transparent;
	}

	:global(.btn.primary:hover:not(:disabled)) {
		filter: brightness(1.06);
		color: var(--bg);
		border-color: transparent;
	}

	:global(.btn:disabled) {
		opacity: 0.55;
		cursor: not-allowed;
	}

	:global(.role-badge) {
		font-size: var(--fs-xs);
		padding: 0.12rem 0.5rem;
		border-radius: var(--radius-pill);
		background: var(--border);
		color: var(--muted);
	}

	:global(.role-badge.owner) {
		background: color-mix(in srgb, var(--accent) 28%, transparent);
		color: var(--accent);
	}

	:global(.role-badge.premium) {
		background: rgba(240, 200, 135, 0.22);
		color: #f0c887;
	}

	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		position: relative;
		isolation: isolate;
	}

	.app::before {
		content: '';
		position: fixed;
		inset: 0;
		background:
			radial-gradient(ellipse at 0% 0%, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 45%);
		pointer-events: none;
		z-index: -1;
		animation: glow-pulse 8s ease-in-out infinite alternate;
	}

	.app::after {
		content: '';
		position: fixed;
		top: -10%;
		left: -5%;
		width: 50%;
		height: 50%;
		background: radial-gradient(ellipse, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 70%);
		pointer-events: none;
		z-index: -1;
		animation: glow-pulse 12s ease-in-out infinite alternate-reverse;
	}

	@keyframes glow-pulse {
		from { opacity: 0.6; }
		to { opacity: 1; }
	}

	@media (prefers-reduced-motion: reduce) {
		.app::before,
		.app::after {
			animation: none;
			opacity: 0.8;
		}
	}

	.skip-link {
		position: absolute;
		left: -9999px;
		top: auto;
		z-index: 100;
		padding: 0.5rem 1rem;
		background: var(--accent);
		color: var(--bg);
		font-weight: 600;
		border-radius: var(--radius-sm);
		text-decoration: none;
	}

	.skip-link:focus {
		left: var(--space-3);
		top: var(--space-3);
	}

	.page {
		padding: var(--space-5);
		flex: 1;
		max-width: 1400px;
		width: 100%;
		margin: 0 auto;
	}

	.page.wide {
		max-width: 1900px;
	}

	@media (max-width: 768px) {
		.page {
			padding: var(--space-3);
		}
	}

	.boot-loading {
		min-height: 100vh;
		display: grid;
		place-items: center;
		gap: var(--space-3);
		color: var(--muted);
		font-size: var(--fs-sm);
	}

	.boot-loading p {
		margin: 0;
	}

	.spinner {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		border: 3px solid color-mix(in srgb, var(--accent) 24%, transparent);
		border-top-color: var(--accent);
		animation: spin 0.9s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	:global(.uwu-cursor) {
		position: fixed;
		width: 42px;
		height: auto;
		pointer-events: none;
		z-index: 99999;
		image-rendering: pixelated;
	}
</style>
