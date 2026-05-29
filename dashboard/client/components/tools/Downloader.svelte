<script>
	let url = '';
	let detected = null;

	const SERVICES = [
		{ id: 'youtube', pattern: /(?:youtube\.com|youtu\.be)/, label: 'YouTube', color: '#ff0000' },
		{ id: 'tiktok', pattern: /(?:tiktok\.com|vm\.tiktok\.com)/, label: 'TikTok', color: '#000000' },
		{ id: 'instagram', pattern: /instagram\.com/, label: 'Instagram', color: '#e1306c' },
		{ id: 'twitter', pattern: /(?:twitter\.com|x\.com)/, label: 'Twitter / X', color: '#1da1f2' },
		{ id: 'facebook', pattern: /(?:facebook\.com|fb\.watch)/, label: 'Facebook', color: '#1877f2' },
		{ id: 'pinterest', pattern: /pinterest\.com/, label: 'Pinterest', color: '#e60023' },
		{ id: 'bilibili', pattern: /(?:bilibili\.com|bilibili\.tv|b23\.tv)/, label: 'Bilibili', color: '#00a1d6' },
		{ id: 'bluesky', pattern: /bsky\.app/, label: 'Bluesky', color: '#0085ff' },
		{ id: 'bandcamp', pattern: /bandcamp\.com/, label: 'Bandcamp', color: '#629aa9' },
		{ id: 'spotify', pattern: /open\.spotify\.com/, label: 'Spotify', color: '#1db954' },
		{ id: 'flickr', pattern: /flickr\.com/, label: 'Flickr', color: '#0063dc' },
		{ id: 'deviantart', pattern: /deviantart\.com/, label: 'DeviantArt', color: '#05cc47' },
		{ id: 'mediafire', pattern: /mediafire\.com/, label: 'MediaFire', color: '#4285f4' },
		{ id: 'douyin', pattern: /douyin\.com/, label: 'Douyin', color: '#161823' },
		{ id: 'soundcloud', pattern: /soundcloud\.com/, label: 'SoundCloud', color: '#ff5500' }
	];

	$: detected = detectService(url);
	$: if (url.trim() !== lastFetchedUrl) { result = null; error = ''; }
	$: if (detected && url.trim().startsWith('http') && !loading && !result) {
		download();
	}

	function detectService(input) {
		const trimmed = input.trim().toLowerCase();
		if (!trimmed || !trimmed.startsWith('http')) return null;
		return SERVICES.find((s) => s.pattern.test(trimmed)) || { id: 'generic', label: 'Generic URL', color: '#888' };
	}

	function handleKey(e) {
		if (e.key === 'Enter') download();
	}

	let loading = false;
	let result = null;
	let error = '';
	let lastFetchedUrl = '';
	let zipping = false;
	let zipProgress = '';
	let merging = false;
	let slowWarning = false;
	let slowTimer = null;

	function startSlowTimer() {
		slowWarning = false;
		if (slowTimer) clearTimeout(slowTimer);
		slowTimer = setTimeout(() => { slowWarning = true; }, 3000);
	}

	function clearSlowTimer() {
		if (slowTimer) { clearTimeout(slowTimer); slowTimer = null; }
	}

	$: if (result?.formats?.length) { startSlowTimer(); } else { clearSlowTimer(); slowWarning = false; }

	async function downloadMerged() {
		if (!result?.merge) return;
		merging = true;
		error = '';

		try {
			const res = await fetch('/api/dashboard/tools/merge', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ video: result.merge.video, audio: result.merge.audio, title: result.title })
			});

			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(body?.message || `Merge failed (${res.status})`);
			}

			const blob = await res.blob();
			const a = document.createElement('a');
			a.href = URL.createObjectURL(blob);
			a.download = `${(result.title || 'video').replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(a.href);
		} catch (e) {
			error = e.message;
		}

		merging = false;
	}

	const HISTORY_KEY = 'aestherix.tools.downloader.history';
	const MAX_HISTORY = 20;

	let history = loadHistory();

	function loadHistory() {
		try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
	}

	function saveHistory(entry) {
		history = [entry, ...history.filter(h => h.url !== entry.url)].slice(0, MAX_HISTORY);
		localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
	}

	function clearHistory() {
		history = [];
		localStorage.removeItem(HISTORY_KEY);
	}

	function useHistory(entry) {
		url = entry.url;
	}

	async function download() {
		if (!url.trim() || !detected) return;
		if (url.trim() === lastFetchedUrl) return;
		loading = true;
		error = '';
		result = null;
		lastFetchedUrl = url.trim();

		try {
			const res = await fetch('/api/dashboard/tools/download', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ url: url.trim() })
			});

			const data = await res.json();

			if (!res.ok || !data.ok) {
				throw new Error(data.message || 'Download failed');
			}

			result = data;
			const firstMedia = data.formats?.find(f => f.url);
			const isSingleton = (data.formats?.filter(f => f.url)?.length || 0) === 1;
			saveHistory({ url: url.trim(), service: data.service, title: data.title?.slice(0, 60) || data.service, time: Date.now(), thumbnail: data.thumbnail || null, mediaUrl: data.thumbnail || (isSingleton && !firstMedia?.label?.includes('audio') ? firstMedia?.url : null), mediaType: isSingleton ? (firstMedia?.label || '') : null });
		} catch (e) {
			error = e.message || 'Failed to fetch media';
		}

		loading = false;
	}
	function proxyUrl(url) {
		return `/api/dashboard/tools/proxy?url=${encodeURIComponent(url)}`;
	}

	async function downloadAll() {
		const urls = result?.formats?.filter(f => f.url) || [];
		for (const fmt of urls) {
			const a = document.createElement('a');
			a.href = proxyUrl(fmt.url);
			a.download = '';
			a.target = '_blank';
			document.body.appendChild(a);
			a.click();
			a.remove();
			await new Promise(r => setTimeout(r, 300));
		}
	}

	async function downloadZip() {
		const urls = result?.formats?.filter(f => f.url).map(f => f.url) || [];
		if (!urls.length) return;

		const BATCH_SIZE = 20;
		zipping = true;
		zipProgress = '';

		try {
			const batches = [];
			for (let i = 0; i < urls.length; i += BATCH_SIZE) {
				batches.push(urls.slice(i, i + BATCH_SIZE));
			}

			for (let i = 0; i < batches.length; i++) {
				zipProgress = `${i + 1}/${batches.length}`;
				const res = await fetch('/api/dashboard/tools/download-zip', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({ urls: batches[i] })
				});

				if (!res.ok) {
					const body = await res.json().catch(() => null);
					throw new Error(body?.message || `Server error ${res.status}: ${res.statusText}`);
				}

				const blob = await res.blob();
				const a = document.createElement('a');
				a.href = URL.createObjectURL(blob);
				a.download = `${result?.service || 'download'}-${result?.title?.match(/@(\w+)/)?.[1] || 'media'}-${Date.now()}-${result?.title?.includes('Stories') ? 'story' : result?.title?.includes('Highlights') ? 'highlight' : 'media'}-part-${i + 1}.zip`;
				document.body.appendChild(a);
				a.click();
				a.remove();
				URL.revokeObjectURL(a.href);
			}
		} catch (e) {
			error = e.message;
		}
		zipping = false;
	}

</script>

<div class="dl-tool">
	<div class="dl-input-row">
		<input
			class="input dl-url"
			type="text"
			placeholder="Paste a URL"
			bind:value={url}
			on:keydown={handleKey}
		/>
		<button class="btn primary" type="button" disabled={!detected || loading} on:click={download}>
			{loading ? '...' : 'Download'}
		</button>
	</div>

	{#if detected}
		<div class="dl-detected">
			<span class="dl-dot" style:background={detected.color}></span>
			<span class="dl-service">{detected.label}</span>
		</div>
	{/if}

	{#if error}
		<p class="dl-error">{error}</p>
	{/if}

	{#if loading}
		<div class="dl-loading">
			<div class="dl-spinner"></div>
			<span>Fetching media...</span>
		</div>
	{/if}

	{#if result}
		<div class="dl-result">
			{#if slowWarning}
				<div class="dl-slow-banner">⏳ Media is loading slowly — the CDN may be throttled. Preview might take a moment.</div>
			{/if}
			{#if result.thumbnail && !result.formats?.filter(f => f.url).length}
				<img class="dl-thumb" src={proxyUrl(result.thumbnail)} alt="" />
			{/if}
			<div class="dl-meta">
				{#if result.title}
					<span class="dl-title">{result.title}</span>
				{/if}

				{#if result.merge}
					<div class="dl-merge-section">
						<button class="btn primary" type="button" disabled={merging} on:click={downloadMerged}>
							{merging ? 'Merging video + audio...' : '↓ Download (merged video + audio)'}
						</button>
					</div>
				{/if}
				{#if result.formats?.filter(f => f.url).length}
					<div class="dl-bulk-actions">
						<button class="btn" type="button" on:click={downloadAll}>↓ Download All</button>
						<button class="btn" type="button" on:click={downloadZip} disabled={zipping}>
							{zipping ? `Zipping ${zipProgress}...` : '📦 Download as ZIP'}
						</button>
					</div>
					<div class="dl-media-list">
						{#each result.formats.filter(f => f.url) as fmt, i (fmt.url)}
							<div class="dl-media-item">
								{#if fmt.label?.toLowerCase().includes('audio')}
								<audio class="dl-audio" src={proxyUrl(fmt.url)} controls preload="metadata" on:loadeddata={clearSlowTimer}></audio>
							{:else if fmt.url.match(/\.(jpg|jpeg|png|gif|webp)/i) || fmt.label?.toLowerCase().includes('image')}
								<img class="dl-media" src={proxyUrl(fmt.url)} alt="Media {i + 1}" on:load={clearSlowTimer} />
							{:else}
								<!-- svelte-ignore a11y-media-has-caption -->
								<video class="dl-media" src={proxyUrl(fmt.url)} controls preload="metadata" on:loadeddata={clearSlowTimer}></video>
							{/if}
								<a class="btn dl-fmt-btn" href={proxyUrl(fmt.url)} target="_blank" rel="noopener noreferrer" download="media-{i + 1}{fmt.label?.toLowerCase().includes('audio') ? '.mp3' : fmt.label?.toLowerCase().includes('image') ? '.jpg' : '.mp4'}">
									↓ {fmt.label || `Download ${i + 1}`}
								</a>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{:else if !error && !loading && detected}
		<p class="dl-hint">Press Download or Enter to fetch media info.</p>
	{/if}

	{#if history.length}
		<div class="dl-history">
			<div class="dl-history-head">
				<span class="dl-history-label">History</span>
				<button class="dl-history-clear" type="button" on:click={clearHistory}>Clear</button>
			</div>
			{#each history as h (h.url + h.time)}
				<button class="dl-history-item" type="button" on:click={() => useHistory(h)}>
					{#if h.mediaUrl && !h.mediaType?.includes('video') && !h.mediaType?.includes('audio')}
						<img class="dl-history-thumb" src={proxyUrl(h.mediaUrl)} alt="" />
					{:else if h.thumbnail}
						<img class="dl-history-thumb" src={proxyUrl(h.thumbnail)} alt="" />
					{/if}
					<span class="dl-history-service">{h.service}</span>
					<span class="dl-history-title">{h.title}</span>
				</button>
			{/each}
		</div>
	{/if}

	<div class="dl-supported">
		<span class="dl-supported-label">Supported</span>
		<div class="dl-supported-list">
			{#each SERVICES.filter(s => !['youtube', 'flickr', 'spotify'].includes(s.id)) as s (s.id)}
				<span class="dl-supported-item"><span class="dl-supported-dot" style:background={s.color}></span>{s.label}</span>
			{/each}
		</div>
		<span class="dl-supported-label dl-meta-label">Only Metadata</span>
		<div class="dl-supported-list">
			{#each SERVICES.filter(s => ['youtube', 'flickr', 'spotify'].includes(s.id)) as s (s.id)}
				<span class="dl-supported-item"><span class="dl-supported-dot" style:background={s.color}></span>{s.label}</span>
			{/each}
		</div>
	</div>
</div>

<style>
	.dl-tool { display: flex; flex-direction: column; gap: var(--space-3); }
	.dl-input-row { display: flex; gap: var(--space-2); }
	.dl-url { flex: 1; max-width: none; font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace; font-size: var(--fs-sm); }
	.dl-detected { display: flex; align-items: center; gap: 0.5rem; font-size: var(--fs-sm); color: var(--text); }
	.dl-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
	.dl-service { font-weight: 600; }
	.dl-error { margin: 0; color: #ff8e74; font-size: var(--fs-sm); }
	.dl-hint { margin: 0; color: var(--muted); font-size: var(--fs-sm); }
	.dl-loading { display: flex; align-items: center; gap: var(--space-2); color: var(--muted); font-size: var(--fs-sm); }
	.dl-spinner { width: 18px; height: 18px; border-radius: 50%; border: 2px solid color-mix(in srgb, var(--accent) 24%, transparent); border-top-color: var(--accent); animation: dl-spin 0.8s linear infinite; }
	@keyframes dl-spin { to { transform: rotate(360deg); } }
	.dl-result { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-3); background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); }
	.dl-slow-banner { font-size: var(--fs-xs); color: #f0c887; background: rgba(240, 200, 135, 0.1); border: 1px solid rgba(240, 200, 135, 0.3); border-radius: var(--radius-sm); padding: 0.4rem 0.7rem; }
	.dl-thumb { width: 100%; max-width: 480px; border-radius: var(--radius-sm); }
	.dl-meta { display: flex; flex-direction: column; gap: 0.5rem; min-width: 0; }
	.dl-title { font-size: var(--fs-sm); font-weight: 600; color: var(--text); }
	.dl-bulk-actions { display: flex; gap: var(--space-2); flex-wrap: wrap; }
	.dl-media-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-3); }
	.dl-media-item { display: flex; flex-direction: column; gap: 0.4rem; padding: var(--space-2); background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius-sm); }
	.dl-media { width: 100%; border-radius: var(--radius-sm); max-height: 360px; object-fit: contain; background: #000; }
	.dl-audio { width: 100%; border-radius: var(--radius-sm); }
	.dl-fmt-btn { font-size: var(--fs-xs); padding: 0.3rem 0.6rem; text-decoration: none; text-align: center; width: 100%; }
	.dl-supported { margin-top: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--border); text-align: center; font-size: var(--fs-xs); color: var(--muted); line-height: 1.6; }
	.dl-history { margin-top: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--border); }
	.dl-history-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem; }
	.dl-history-label { font-size: var(--fs-xs); color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
	.dl-history-clear { background: none; border: none; color: var(--muted); font-size: var(--fs-xs); cursor: pointer; padding: 0; }
	.dl-history-clear:hover { color: #ff8e74; }
	.dl-history-item { display: flex; gap: var(--space-2); align-items: center; width: 100%; padding: 0.3rem 0.5rem; background: none; border: none; border-radius: var(--radius-sm); color: var(--text); font-size: var(--fs-sm); text-align: left; cursor: pointer; transition: background var(--tx-base); }
	.dl-history-item:hover { background: color-mix(in srgb, var(--accent) 8%, transparent); }
	.dl-history-thumb { width: 36px; height: 36px; border-radius: 4px; object-fit: cover; flex-shrink: 0; }
	.dl-history-service { font-size: var(--fs-xs); color: var(--accent); font-weight: 600; text-transform: capitalize; min-width: 60px; }
	.dl-history-title { color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.dl-supported-label { text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; display: block; margin-bottom: 0.4rem; }
	.dl-meta-label { margin-top: 0.6rem; }
	.dl-supported-list { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.3rem; max-width: 360px; margin: 0 auto; }
	.dl-supported-item { white-space: nowrap; padding: 0.1rem 0.45rem; border-radius: var(--radius-pill); background: var(--bg); border: 1px solid var(--border); display: inline-flex; align-items: center; gap: 0.3rem; }
	.dl-supported-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
</style>
