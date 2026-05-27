<script>
	import { onDestroy, onMount, tick } from 'svelte';
	import AlbumsGrid from '../components/albums/AlbumsGrid.svelte';
	import Lightbox from '../components/albums/Lightbox.svelte';
	import ColorFilterInput from '../components/ColorFilterInput.svelte';
	import Tooltip from '../components/ui/Tooltip.svelte';
	import { get } from '../lib/api.js';
	import { showConfirm } from '../lib/confirm.js';
	import { socket } from '../lib/socket.js';
	import { albums } from '../lib/stores.js';
	import { showError, showSuccess, showUndoToast } from '../lib/toast.js';

	const STALE_MS = 60_000;
	const PAGE_SIZE = 50;

	let lightboxIndex = -1;
	let canDelete = true;
	let page = 0;
	let urlReady = false;
	let pendingImageTs = '';

	export let isViewer = false;

	$: lightboxOpen = lightboxIndex >= 0 && lightboxIndex < pagedPictures.length;
	$: pictures = $albums.pictures;
	$: loading = $albums.loading;
	$: colorFilter = $albums.colorFilter;
	$: totalPages = Math.max(1, Math.ceil(pictures.length / PAGE_SIZE));
	$: if (pictures.length > 0 && page > totalPages - 1) {
		page = Math.max(0, totalPages - 1);
	}
	$: pageStart = page * PAGE_SIZE;
	$: pageEnd = Math.min(pictures.length, pageStart + PAGE_SIZE);
	$: pagedPictures = pictures.slice(pageStart, pageEnd);
	$: if (lightboxIndex >= pagedPictures.length) {
		lightboxIndex = pagedPictures.length ? pagedPictures.length - 1 : -1;
	}
	$: canDelete = !isViewer;

	function readUrlState() {
		if (typeof window === 'undefined') {
			return { page: 0, color: '', img: '' };
		}

		const url = new URL(window.location.href);
		const p = Math.max(0, Number(url.searchParams.get('p') || 0) - 1);
		const color = url.searchParams.get('color') || '';
		const img = url.searchParams.get('img') || '';

		return { page: Number.isFinite(p) ? p : 0, color, img };
	}

	function writeUrlState({ page: nextPage = page, color, img = '' } = {}) {
		if (typeof window === 'undefined') {
			return;
		}

		const filter = color === undefined ? $albums.colorFilter || '' : color;
		const url = new URL(window.location.href);

		if (nextPage > 0) {
			url.searchParams.set('p', String(nextPage + 1));
		} else {
			url.searchParams.delete('p');
		}

		if (filter) {
			url.searchParams.set('color', filter);
		} else {
			url.searchParams.delete('color');
		}

		if (img) {
			url.searchParams.set('img', img);
		} else {
			url.searchParams.delete('img');
		}

		const next = `${url.pathname}${url.search}${url.hash}`;

		if (next === `${window.location.pathname}${window.location.search}${window.location.hash}`) {
			return;
		}

		history.replaceState(history.state, '', next);
	}

	async function load({ force = false } = {}) {
		const state = $albums;
		const filter = state.colorFilter;

		if (!force && state.loaded && state.pictures.length && Date.now() - state.lastFetchedAt < STALE_MS) {
			return;
		}

		albums.update((current) => ({ ...current, loading: true }));

		try {
			const params = new URLSearchParams();

			if (filter) {
				params.set('color', filter);
			}

			const suffix = params.toString();
			const data = await get(`/profile-pictures${suffix ? `?${suffix}` : ''}`);

			albums.set({
				pictures: data.pictures || [],
				colorFilter: filter,
				loading: false,
				loaded: true,
				lastFetchedAt: Date.now()
			});
		} catch (error) {
			albums.update((current) => ({ ...current, loading: false }));
			showError(error?.message || 'Failed to load pictures.');
		}
	}

	function handleColorChange(value) {
		albums.update((current) => ({ ...current, colorFilter: value }));
		page = 0;
		writeUrlState({ page: 0, color: value, img: '' });
		void load({ force: true });
	}

	function openAt(detail) {
		lightboxIndex = detail.index;
	}

	function closeLightbox() {
		lightboxIndex = -1;
	}

	async function downloadPicture(detail) {
		const picture = detail.picture;

		if (!picture?.url) {
			return;
		}

		const params = new URLSearchParams({
			url: picture.url,
			timestamp: picture.timestamp || ''
		});
		const href = `/api/dashboard/profile-pictures/download?${params.toString()}`;

		try {
			const response = await fetch(href, { credentials: 'include' });

			if (!response.ok) {
				const body = await response.json().catch(() => null);

				throw new Error(body?.message || `${response.status} ${response.statusText}`);
			}

			const blob = await response.blob();
			const link = document.createElement('a');
			const objectUrl = URL.createObjectURL(blob);

			link.href = objectUrl;
			link.download = response.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] || 'profile-picture';
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(objectUrl);
			showSuccess('Download started.');
		} catch (error) {
			showError(error?.message || 'Download failed.');
		}
	}

	async function deletePicture(detail) {
		const picture = detail.picture;

		if (!picture?.url) {
			return;
		}

		if (!confirm('Delete this profile picture from history?')) {
			return;
		}

		try {
			const response = await fetch('/api/dashboard/profile-pictures', {
				method: 'DELETE',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ timestamp: picture.timestamp || '', url: picture.url })
			});

			if (!response.ok) {
				const payload = await response.json().catch(() => ({}));

				throw new Error(payload?.message || `${response.status} ${response.statusText}`);
			}

			const data = await response.json();
			const removedAt = lightboxIndex;

			albums.update((current) => {
				const next = current.pictures.filter((p) => !(p.url === picture.url && p.timestamp === picture.timestamp));

				return { ...current, pictures: next, lastFetchedAt: Date.now() };
			});

			const nextPageStart = page * PAGE_SIZE;
			const nextPageEnd = Math.min($albums.pictures.length, nextPageStart + PAGE_SIZE);
			const nextPageSize = Math.max(0, nextPageEnd - nextPageStart);

			if (removedAt >= nextPageSize) {
				lightboxIndex = nextPageSize ? nextPageSize - 1 : -1;
			}

			if (data?.undo?.token) {
				showUndoToast({
					message: 'Profile picture deleted.',
					undo: data.undo,
					onAfterUndo: () => load({ force: true })
				});
			} else {
				showSuccess('Profile picture deleted.');
			}
		} catch (error) {
			showError(error?.message || 'Delete failed.');
		}
	}

	function handleSocketUpdate(payload) {
		if (!payload) {
			return;
		}

		albums.update((current) => {
			let next = current.pictures;
			let changed = false;
			const incoming = payload.picture;
			const deleted = payload.deleted;

			if (deleted && deleted.url) {
				const filtered = next.filter(
					(p) => !(p.url === deleted.url && p.timestamp === deleted.timestamp)
				);

				if (filtered.length !== next.length) {
					next = filtered;
					changed = true;
				}
			}

			if (incoming && incoming.url && !current.colorFilter) {
				const exists = next.some(
					(p) => p.url === incoming.url || p.timestamp === incoming.timestamp
				);

				if (!exists) {
					next = [incoming, ...next];
					changed = true;
				}
			}

			if (!changed) {
				return current;
			}

			return { ...current, pictures: next, lastFetchedAt: Date.now() };
		});
	}

	function nextPage() {
		const target = Math.min(totalPages - 1, page + 1);

		if (target !== page) {
			page = target;
			writeUrlState({ page: target, img: '' });
		}
	}

	function prevPage() {
		const target = Math.max(0, page - 1);

		if (target !== page) {
			page = target;
			writeUrlState({ page: target, img: '' });
		}
	}

	onMount(async () => {
		const url = readUrlState();
		const startColor = url.color || $albums.colorFilter || '';

		page = url.page;
		pendingImageTs = url.img;

		if (startColor !== $albums.colorFilter) {
			albums.update((current) => ({ ...current, colorFilter: startColor, loaded: false }));
		}

		urlReady = true;

		socket.on('dashboard:profile-pictures', handleSocketUpdate);
		await load({ force: !$albums.loaded || startColor !== $albums.colorFilter });

		if (pendingImageTs && pagedPictures.length) {
			const idx = pagedPictures.findIndex(
				(p) => String(p.timestamp) === pendingImageTs || String(p.url) === pendingImageTs
			);

			if (idx >= 0) {
				lightboxIndex = idx;
			}

			pendingImageTs = '';
		}

		await tick();
	});

	onDestroy(() => {
		socket.off('dashboard:profile-pictures', handleSocketUpdate);
	});

	$: if (urlReady && lightboxIndex >= 0 && pagedPictures[lightboxIndex]) {
		const ts = pagedPictures[lightboxIndex].timestamp || pagedPictures[lightboxIndex].url || '';

		writeUrlState({ img: String(ts) });
	}

	$: if (urlReady && lightboxIndex < 0) {
		writeUrlState({ img: '' });
	}
</script>

<div class="albums">
	<header class="page-head">
		<div class="title-block">
			<h2>Albums</h2>
			<p class="page-sub">Preservation of the profile pictures. Click image to fullscreen.</p>
		</div>
		<div class="filter-block">
			<ColorFilterInput value={colorFilter} onChange={handleColorChange} />
		</div>
	</header>

	<div class="pager">
		<div class="pager-info">
			Showing {pictures.length ? pageStart + 1 : 0}-{pageEnd} of {pictures.length}
		</div>
		<div class="pager-actions">
			<button class="pager-btn" type="button" on:click={prevPage} disabled={page === 0}>Prev</button>
			<span class="pager-count">{page + 1} / {totalPages}</span>
			<button class="pager-btn" type="button" on:click={nextPage} disabled={page >= totalPages - 1}>Next</button>
		</div>
	</div>

	<AlbumsGrid pictures={pagedPictures} {loading} on:open={(event) => openAt(event.detail)} />
</div>

{#if lightboxOpen}
	<Lightbox
		pictures={pagedPictures}
		bind:activeIndex={lightboxIndex}
		{canDelete}
		on:close={closeLightbox}
		on:download={(event) => downloadPicture(event.detail)}
		on:delete={(event) => deletePicture(event.detail)}
	/>
{/if}

<style>
	.albums {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.page-head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: var(--space-3);
	}

	.title-block {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.title-block h2 {
		margin: 0;
		font-size: var(--fs-xl);
		letter-spacing: -0.01em;
	}

	.page-sub {
		margin: 0;
		color: var(--muted);
		font-size: var(--fs-sm);
	}

	.filter-block {
		display: inline-flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.pager {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		flex-wrap: wrap;
		padding: 0.2rem 0 0.4rem;
	}

	.pager-info {
		font-size: var(--fs-xs);
		color: var(--muted);
	}

	.pager-actions {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.pager-btn {
		background: transparent;
		border: 1px solid var(--border);
		color: var(--muted);
		padding: 0.32rem 0.7rem;
		border-radius: var(--radius-sm);
		font-size: var(--fs-xs);
		font-weight: 600;
		cursor: pointer;
		transition: border-color var(--tx-base), color var(--tx-base);
	}

	.pager-btn:hover:not(:disabled) {
		border-color: var(--accent);
		color: var(--accent);
	}

	.pager-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.pager-count {
		font-size: var(--fs-xs);
		color: var(--text);
		font-variant-numeric: tabular-nums;
	}
</style>