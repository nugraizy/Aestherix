<script>
	import { get } from '../../lib/api.js';
	import { showError } from '../../lib/toast.js';
	import Toggle from '../ui/Toggle.svelte';

	const HISTORY_KEY = 'aestherix.tools.genshin.history';
	const MAX_HISTORY = 20;

	let uid = '';
	let loading = false;
	let generating = false;
	let user = null;
	let characters = [];
	let selectedChar = null;
	let svgContent = null;
	let useRadar = false;
	let downloading = false;

	const cardCache = new Map();

	let history = loadHistory();

	function loadHistory() {
		try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
	}

	function saveHistory(entry) {
		const key = `${entry.uid}-${entry.charName}-${entry.radar ? 'radar' : 'list'}`;
		history = [entry, ...history.filter(h => `${h.uid}-${h.charName}-${h.radar ? 'radar' : 'list'}` !== key)].slice(0, MAX_HISTORY);
		localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
	}

	function clearHistory() {
		history = [];
		localStorage.removeItem(HISTORY_KEY);
	}

	async function useHistory(entry) {
		uid = entry.uid;
		useRadar = entry.radar;
		await fetchCharacters();

		const match = characters.find(c => c.name === entry.charName);
		if (match) {
			generateCard(match, useRadar);
		}
	}

	function getCacheKey(char, radar) {
		return `${uid}-${char.name}-${radar ? 'radar' : 'list'}`;
	}

	async function fetchCharacters() {
		if (!/^\d{9,10}$/.test(uid)) {
			showError('Invalid UID format. Must be 9-10 digits.');
			return;
		}

		loading = true;
		user = null;
		characters = [];
		selectedChar = null;
		svgContent = null;
		cardCache.clear();

		try {
			const data = await get(`/tools/genshin/characters?uid=${encodeURIComponent(uid)}`);

			user = data?.user || null;
			characters = data?.characters || [];
		} catch (error) {
			showError(error?.message || 'Failed to fetch data.');
		} finally {
			loading = false;
		}
	}

	async function generateCard(char, radar) {
		const cacheKey = getCacheKey(char, radar);

		if (cardCache.has(cacheKey)) {
			selectedChar = char;
			svgContent = cardCache.get(cacheKey);
			return;
		}

		selectedChar = char;
		generating = true;
		svgContent = null;

		try {
			const radarParam = radar ? '&radar=1' : '';
			const url = `/api/dashboard/tools/genshin/card?uid=${encodeURIComponent(uid)}&char=${encodeURIComponent(char.name)}${radarParam}`;

			const response = await fetch(url, { credentials: 'include' });

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));

				throw new Error(data?.message || 'Failed to generate card.');
			}

			const svg = await response.text();

			cardCache.set(cacheKey, svg);
			svgContent = svg;
			saveHistory({ uid, charName: char.name, charIcon: char.assets?.icon || null, radar, stars: char.stars, time: Date.now() });
		} catch (error) {
			showError(error?.message || 'Failed to generate card.');
		} finally {
			generating = false;
		}
	}

	function handleRadarToggle(e) {
		useRadar = e.detail;

		if (selectedChar) {
			generateCard(selectedChar, useRadar);
		}
	}

	async function downloadPng() {
		if (!selectedChar || downloading) return;

		downloading = true;

		try {
			const radarParam = useRadar ? '&radar=1' : '';
			const url = `/api/dashboard/tools/genshin/card/png?uid=${encodeURIComponent(uid)}&char=${encodeURIComponent(selectedChar.name)}${radarParam}`;

			const response = await fetch(url, { credentials: 'include' });

			if (!response.ok) {
				throw new Error('Failed to download.');
			}

			const blob = await response.blob();
			const blobUrl = URL.createObjectURL(blob);
			const a = document.createElement('a');

			a.href = blobUrl;
			a.download = `genshin-${uid}-${selectedChar.name}.png`;
			a.click();
			URL.revokeObjectURL(blobUrl);
		} catch (error) {
			showError(error?.message || 'Failed to download PNG.');
		} finally {
			downloading = false;
		}
	}

	function downloadSvg() {
		if (!svgContent) return;

		const blob = new Blob([svgContent], { type: 'image/svg+xml' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');

		a.href = url;
		a.download = `genshin-${uid}-${selectedChar?.name || 'card'}.svg`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function handleKey(e) {
		if (e.key === 'Enter') fetchCharacters();
	}

	function getRarityStars(stars) {
		return '★'.repeat(stars || 0);
	}
</script>

<div class="genshin-tool">
	<div class="input-row">
		<input
			class="input uid-input"
			type="text"
			placeholder="Enter Genshin UID (e.g. 800000000)"
			bind:value={uid}
			on:keydown={handleKey}
			disabled={loading}
		/>
		<button class="btn primary" type="button" on:click={fetchCharacters} disabled={loading || !uid.trim()}>
			{loading ? 'Loading...' : 'Fetch'}
		</button>
	</div>

	{#if user}
		<div class="user-info">
			<span class="user-name">{user.nickname || 'Unknown'}</span>
			<span class="user-level">AR {user.level}</span>
		</div>
	{/if}

	{#if characters.length}
		<div class="char-header">
			<h4>Showcase Characters</h4>
			<label class="radar-toggle">
				<Toggle checked={useRadar} size="sm" on:change={handleRadarToggle} />
				<span>Radar Chart</span>
			</label>
		</div>
		<div class="char-grid">
			{#each characters as char}
				<button
					class="char-card"
					class:active={selectedChar?.name === char.name}
					type="button"
					on:click={() => generateCard(char, useRadar)}
					disabled={generating}
				>
					{#if char.assets?.icon}
						<img class="char-icon" src={char.assets.icon} alt={char.name} loading="lazy" />
					{/if}
					<div class="char-info">
						<span class="char-name">{char.name}</span>
						<span class="char-level">Lv.{char.level}</span>
						<span class="char-stars">{getRarityStars(char.stars)}</span>
					</div>
				</button>
			{/each}
		</div>
	{/if}

	{#if generating}
		<div class="generating">Generating card...</div>
	{/if}

	{#if svgContent}
		<div class="card-preview">
			<div class="card-svg">
				{@html svgContent}
			</div>
			<div class="card-actions">
				<button class="btn primary" type="button" on:click={downloadPng} disabled={downloading}>
					{downloading ? 'Downloading...' : 'Download PNG'}
				</button>
				<button class="btn" type="button" on:click={downloadSvg}>Download SVG</button>
			</div>
		</div>
	{/if}

	{#if history.length}
		<div class="history">
			<div class="history-head">
				<span class="history-label">History</span>
				<button class="history-clear" type="button" on:click={clearHistory}>Clear</button>
			</div>
			{#each history as h (h.uid + h.charName + (h.radar ? 'r' : 'l') + h.time)}
				<button class="history-item" type="button" on:click={() => useHistory(h)}>
					{#if h.charIcon}
						<img class="history-icon" src={h.charIcon} alt="" />
					{/if}
					<span class="history-char">{h.charName}</span>
					<span class="history-uid">UID {h.uid}</span>
					{#if h.radar}
						<span class="history-radar">Radar</span>
					{/if}
					<span class="history-stars">{'★'.repeat(h.stars || 0)}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.genshin-tool {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.input-row {
		display: flex;
		gap: var(--space-2);
	}

	.uid-input {
		flex: 1;
		max-width: none;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-2) var(--space-3);
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
	}

	.user-name {
		font-weight: 600;
		font-size: var(--fs-md);
	}

	.user-level {
		color: var(--muted);
		font-size: var(--fs-sm);
	}

	.char-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.char-header h4 {
		margin: 0;
		font-size: var(--fs-sm);
		font-weight: 600;
	}

	.radar-toggle {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: var(--fs-xs);
		color: var(--muted);
		cursor: pointer;
	}

	.char-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: var(--space-3);
	}

	.char-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: var(--space-2);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: transform 0.1s;
	}

	.char-card:hover:not(:disabled) {
		transform: translateY(-2px);
	}

	.char-card.active .char-icon {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 30%, transparent);
	}

	.char-card:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.char-icon {
		width: 72px;
		height: 72px;
		border-radius: 50%;
		object-fit: cover;
		background: var(--bg);
		border: 2px solid var(--border);
		transition: border-color var(--tx-base), box-shadow var(--tx-base);
	}

	.char-card:hover:not(:disabled) .char-icon {
		border-color: var(--accent);
	}

	.char-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 0.1rem;
	}

	.char-name {
		font-size: var(--fs-xs);
		font-weight: 600;
		line-height: 1.2;
		max-width: 80px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.char-level {
		font-size: 0.65rem;
		color: var(--muted);
	}

	.char-stars {
		font-size: 0.6rem;
		color: #ffd700;
		-webkit-text-fill-color: #ffd700;
	}

	.generating {
		text-align: center;
		color: var(--muted);
		font-size: var(--fs-sm);
		padding: var(--space-3);
	}

	.card-preview {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3);
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
	}

	.card-svg {
		max-width: 100%;
		overflow: auto;
	}

	.card-svg :global(svg) {
		max-width: 100%;
		height: auto;
	}

	.card-actions {
		display: flex;
		gap: var(--space-2);
	}

	.history {
		margin-top: var(--space-2);
		padding-top: var(--space-3);
		border-top: 1px solid var(--border);
	}

	.history-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.4rem;
	}

	.history-label {
		font-size: var(--fs-xs);
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 600;
	}

	.history-clear {
		background: none;
		border: none;
		color: var(--muted);
		font-size: var(--fs-xs);
		cursor: pointer;
		padding: 0;
	}

	.history-clear:hover {
		color: #ff8e74;
	}

	.history-item {
		display: flex;
		gap: var(--space-2);
		align-items: center;
		width: 100%;
		padding: 0.3rem 0.5rem;
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		color: var(--text);
		font-size: var(--fs-sm);
		text-align: left;
		cursor: pointer;
		transition: background var(--tx-base);
	}

	.history-item:hover {
		background: color-mix(in srgb, var(--accent) 8%, transparent);
	}

	.history-icon {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
		background: var(--bg);
	}

	.history-char {
		font-weight: 600;
		font-size: var(--fs-xs);
	}

	.history-uid {
		font-size: var(--fs-xs);
		color: var(--muted);
	}

	.history-radar {
		font-size: 0.6rem;
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 14%, transparent);
		padding: 0.1rem 0.35rem;
		border-radius: var(--radius-pill);
		font-weight: 600;
	}

	.history-stars {
		font-size: 0.6rem;
		color: #ffd700;
		-webkit-text-fill-color: #ffd700;
		margin-left: auto;
	}

	@media (max-width: 640px) {
		.input-row {
			flex-direction: column;
		}

		.uid-input {
			max-width: 100%;
		}

		.input-row .btn {
			width: 100%;
		}

		.user-info {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--space-1);
		}

		.char-grid {
			grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
			gap: var(--space-2);
		}

		.char-icon {
			width: 56px;
			height: 56px;
		}

		.char-name {
			font-size: 0.65rem;
			max-width: 65px;
		}

		.card-actions {
			flex-direction: column;
			width: 100%;
		}

		.card-actions .btn {
			width: 100%;
			justify-content: center;
		}

		.history-item {
			flex-wrap: wrap;
		}

		.history-icon {
			width: 24px;
			height: 24px;
		}
	}
</style>
