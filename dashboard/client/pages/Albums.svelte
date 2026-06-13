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
	import { createQueryState } from '../lib/urlState.js';

	const PAGE_SIZE = 50;
	const albumQuery = createQueryState('', {
		p:     { type: 'number', default: 0, validate: v => Math.max(0, v) },
		color: { type: 'string', default: '' },
		img:   { type: 'string', default: '' }
	});

	let lightboxIndex = -1;
	let canDelete = true;
	let page = 0;
	let urlReady = false;

	export let isViewer = false;
	export let active = false;

	$: pagedPictures = $albums.pictures;
	$: loading = $albums.loading;
	$: colorFilter = $albums.colorFilter;
	$: total = $albums.total;
	$: totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
	$: lightboxOpen = lightboxIndex >= 0 && lightboxIndex < pagedPictures.length;
	$: if (lightboxIndex >= pagedPictures.length) {
		lightboxIndex = pagedPictures.length ? pagedPictures.length - 1 : -1;
	}
	$: canDelete = !isViewer;

	function readUrlState() {
		const raw = albumQuery.read();
		return { page: Math.max(0, raw.p), color: raw.color, img: raw.img };
	}

	function writeUrlState({ page: nextPage = page, color, img = '' } = {}) {
		const filter = color === undefined ? $albums.colorFilter || '' : color;
		albumQuery.write({
			p: nextPage > 0 ? String(nextPage + 1) : '',
			color: filter,
			img
		});
	}

	async function load({ page: reqPage = page, img = '' } = {}) {
		const filter = $albums.colorFilter;

		albums.update((current) => ({ ...current, loading: true }));

		try {
			const params = new URLSearchParams({ page: String(reqPage), pageSize: String(PAGE_SIZE) });

			if (filter) params.set('color', filter);
			if (img) params.set('img', img);

			const data = await get(`/profile-pictures?${params.toString()}`);

			page = Number(data.page) || 0;
			albums.set({
				pictures: data.pictures || [],
				total: Number(data.total) || 0,
				colorFilter: filter,
				loading: false
			});

			return Number(data.imgIndex ?? -1);
		} catch (error) {
			albums.update((current) => ({ ...current, loading: false }));
			showError(error?.message || 'Failed to load pictures.');
			return -1;
		}
	}

	function handleColorChange(value) {
		albums.update((current) => ({ ...current, colorFilter: value }));
		page = 0;
		lightboxIndex = -1;
		writeUrlState({ page: 0, color: value, img: '' });
		void load({ page: 0 });
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

		const ok = await showConfirm({
			title: 'Delete profile picture',
			message: 'Delete this profile picture from history?',
			confirmLabel: 'Delete',
			danger: true
		});

		if (!ok) {
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

			await load({ page });

			if (data?.undo?.token) {
				showUndoToast({
					message: 'Profile picture deleted.',
					undo: data.undo,
					onAfterUndo: () => load({ page })
				});
			} else {
				showSuccess('Profile picture deleted.');
			}
		} catch (error) {
			showError(error?.message || 'Delete failed.');
		}
	}

	function handleSocketUpdate(payload) {
		if (!payload) return;

		const incoming = payload.picture;
		const deleted = payload.deleted;

		albums.update((current) => {
			let next = current.pictures;
			let total = current.total;
			let changed = false;

			if (deleted?.url) {
				const filtered = next.filter((p) => !(p.url === deleted.url && p.timestamp === deleted.timestamp));

				if (filtered.length !== next.length) {
					next = filtered;
					total = Math.max(0, total - 1);
					changed = true;
				}
			}

			if (incoming?.url && page === 0 && !current.colorFilter) {
				const exists = next.some((p) => p.url === incoming.url || p.timestamp === incoming.timestamp);

				if (!exists) {
					next = [incoming, ...next].slice(0, PAGE_SIZE);
					total = total + 1;
					changed = true;
				}
			}

			return changed ? { ...current, pictures: next, total } : current;
		});
	}

	function nextPage() {
		const target = Math.min(totalPages - 1, page + 1);

		if (target !== page) {
			page = target;
			lightboxIndex = -1;
			writeUrlState({ page: target, img: '' });
			void load({ page: target });
		}
	}

	function prevPage() {
		const target = Math.max(0, page - 1);

		if (target !== page) {
			page = target;
			lightboxIndex = -1;
			writeUrlState({ page: target, img: '' });
			void load({ page: target });
		}
	}

	onMount(async () => {
		const u = readUrlState();

		albums.update((current) => ({ ...current, colorFilter: u.color }));
		socket.on('dashboard:profile-pictures', handleSocketUpdate);

		const imgIndex = await load({ page: u.page, img: u.img });

		if (imgIndex >= 0) {
			lightboxIndex = imgIndex;
		}

		urlReady = true;
		await tick();
	});

	onDestroy(() => {
		socket.off('dashboard:profile-pictures', handleSocketUpdate);
		albumQuery.strip();
	});

	$: if (active && urlReady && lightboxIndex >= 0 && pagedPictures[lightboxIndex]) {
		const ts = pagedPictures[lightboxIndex].timestamp || pagedPictures[lightboxIndex].url || '';

		writeUrlState({ img: String(ts) });
	}

	$: if (active && urlReady && lightboxIndex < 0) {
		writeUrlState({ img: '' });
	}
</script>

<div class="albums">
	<header class="page-head">
		<div class="title-block">
			<h2><i class="nf nf-fa-images"></i> Albums</h2>
			<p class="page-sub">Preservation of the profile pictures. Click image to fullscreen.</p>
		</div>
		<div class="filter-block">
			<ColorFilterInput value={colorFilter} onChange={handleColorChange} />
		</div>
	</header>

	<div class="pager">
		<div class="pager-info">
			Showing {total ? page * PAGE_SIZE + 1 : 0}-{page * PAGE_SIZE + pagedPictures.length} of {total}
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