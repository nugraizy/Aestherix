<script>
	import { showError } from '../../lib/toast.js';

	const CATEGORY_MAP = {
		jpg: 'image', jpeg: 'image', png: 'image', webp: 'image', gif: 'image', tiff: 'image', avif: 'image',
		mp3: 'audio', opus: 'audio', aac: 'audio', flac: 'audio', wav: 'audio', ogg: 'audio',
		mp4: 'video', webm: 'video', mkv: 'video', avi: 'video', mov: 'video'
	};

	const IMAGE_FORMATS = ['jpg', 'png', 'webp', 'gif', 'tiff', 'avif'];
	const AUDIO_FORMATS = ['mp3', 'opus', 'aac', 'flac', 'wav', 'ogg'];
	const VIDEO_FORMATS = ['mp4', 'webm', 'mkv', 'avi', 'mov', 'gif'];

	let file = null;
	let inputFormat = '';
	let outputFormat = '';
	let converting = false;
	let resultUrl = '';
	let resultName = '';
	let dragOver = false;

	$: category = CATEGORY_MAP[inputFormat] || '';
	$: outputOptions = category === 'image' ? IMAGE_FORMATS
		: category === 'audio' ? AUDIO_FORMATS
		: category === 'video' ? VIDEO_FORMATS
		: [];
	$: canConvert = file && outputFormat && !converting;

	function getExt(name) {
		return (name.split('.').pop() || '').toLowerCase();
	}

	function handleFile(f) {
		if (!f) return;
		const ext = getExt(f.name);

		if (!CATEGORY_MAP[ext]) {
			showError(`Unsupported format: .${ext}. Supported: image, audio, video.`);
			return;
		}

		cleanup();
		file = f;
		inputFormat = ext;
		outputFormat = '';
	}

	function handleInput(e) {
		handleFile(e.target.files?.[0]);
	}

	function handleDrop(e) {
		e.preventDefault();
		dragOver = false;
		handleFile(e.dataTransfer?.files?.[0]);
	}

	function handleDragOver(e) {
		e.preventDefault();
		dragOver = true;
	}

	function handleDragLeave() {
		dragOver = false;
	}

	function cleanup() {
		if (resultUrl) {
			URL.revokeObjectURL(resultUrl);
			resultUrl = '';
			resultName = '';
		}
	}

	async function convert() {
		if (!canConvert) return;

		converting = true;
		cleanup();

		try {
			const formData = new FormData();

			formData.append('file', file);
			formData.append('outputFormat', outputFormat);

			const response = await fetch('/api/dashboard/tools/convert', {
				method: 'POST',
				credentials: 'include',
				body: formData
			});

			if (!response.ok) {
				const body = await response.json().catch(() => ({}));

				throw new Error(body.message || `${response.status} ${response.statusText}`);
			}

			const blob = await response.blob();
			const baseName = file.name.replace(/\.[^.]+$/, '');

			resultUrl = URL.createObjectURL(blob);
			resultName = `${baseName}.${outputFormat}`;
		} catch (error) {
			showError(error?.message || 'Conversion failed.');
		}

		converting = false;
	}

	function download() {
		if (!resultUrl) return;
		const a = document.createElement('a');

		a.href = resultUrl;
		a.download = resultName;
		a.click();
	}

	function reset() {
		file = null;
		inputFormat = '';
		outputFormat = '';
		cleanup();
	}

	function formatSize(bytes) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<div class="converter">
	{#if !file}
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class="dropzone"
			class:drag-over={dragOver}
			on:drop={handleDrop}
			on:dragover={handleDragOver}
			on:dragleave={handleDragLeave}
		>
			<i class="nf nf-md-cloud_upload_outline dropzone-icon"></i>
			<p class="dropzone-text">Drop a file here or click to browse</p>
			<p class="dropzone-hint">Supports images, audio, and video (max 100 MB)</p>
			<input class="dropzone-input" type="file" accept="image/*,audio/*,video/*" on:change={handleInput} />
		</div>
	{:else}
		<div class="file-info">
			<div class="file-details">
				<i class="nf {category === 'image' ? 'nf-md-file_image' : category === 'audio' ? 'nf-md-file_music' : 'nf-md-file_video'} file-icon"></i>
				<div>
					<p class="file-name">{file.name}</p>
					<p class="file-meta">{formatSize(file.size)} &middot; .{inputFormat}</p>
				</div>
			</div>
			<button class="btn" type="button" on:click={reset}>Remove</button>
		</div>

		<div class="format-section">
			<span class="format-label">Convert to</span>
			<div class="format-chips">
				{#each outputOptions as fmt (fmt)}
					<button
						class="chip"
						class:active={outputFormat === fmt}
						type="button"
						on:click={() => (outputFormat = fmt)}
					>
						.{fmt}
					</button>
				{/each}
			</div>
		</div>

		{#if outputFormat}
			<div class="action-row">
				<button class="btn primary" type="button" disabled={!canConvert} on:click={convert}>
					{#if converting}
						<span class="spinner"></span> Converting...
					{:else}
						Convert to .{outputFormat}
					{/if}
				</button>
			</div>
		{/if}

		{#if resultUrl}
			<div class="result-card">
				<div class="result-info">
					<i class="nf nf-md-check_circle result-icon"></i>
					<div>
						<p class="result-label">Conversion complete</p>
						<p class="result-name">{resultName}</p>
					</div>
				</div>
				<button class="btn primary" type="button" on:click={download}>
					<i class="nf nf-md-download"></i> Download
				</button>
			</div>
		{/if}
	{/if}
</div>

<style>
	.converter {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.dropzone {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-6) var(--space-4);
		border: 2px dashed var(--border);
		border-radius: var(--radius-md);
		background: var(--bg);
		cursor: pointer;
		transition: border-color var(--tx-base), background var(--tx-base);
	}

	.dropzone:hover, .dropzone.drag-over {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 5%, var(--bg));
	}

	.dropzone-icon {
		font-size: 2.5rem;
		color: var(--muted);
	}

	.dropzone-text {
		margin: 0;
		font-size: var(--fs-md);
		font-weight: 600;
		color: var(--text);
	}

	.dropzone-hint {
		margin: 0;
		font-size: var(--fs-xs);
		color: var(--muted);
	}

	.dropzone-input {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
	}

	.file-info {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-3);
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
	}

	.file-details {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.file-icon {
		font-size: 1.4rem;
		color: var(--accent);
	}

	.file-name {
		margin: 0;
		font-size: var(--fs-sm);
		font-weight: 600;
		color: var(--text);
		word-break: break-all;
	}

	.file-meta {
		margin: 0;
		font-size: var(--fs-xs);
		color: var(--muted);
	}

	.format-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.format-label {
		font-size: var(--fs-xs);
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 600;
	}

	.format-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.chip {
		padding: 0.3rem 0.7rem;
		font-size: var(--fs-sm);
		font-weight: 600;
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-pill);
		color: var(--text);
		cursor: pointer;
		transition: all var(--tx-base);
	}

	.chip:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.chip.active {
		background: color-mix(in srgb, var(--accent) 20%, transparent);
		border-color: var(--accent);
		color: var(--accent);
	}

	.action-row {
		display: flex;
		gap: var(--space-2);
	}

	.spinner {
		display: inline-block;
		width: 1em;
		height: 1em;
		border: 2px solid transparent;
		border-top-color: currentColor;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.result-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-3);
		background: color-mix(in srgb, var(--accent) 8%, var(--panel));
		border: 1px solid color-mix(in srgb, var(--accent) 30%, var(--border));
		border-radius: var(--radius-sm);
	}

	.result-info {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.result-icon {
		font-size: 1.4rem;
		color: #87f0c1;
	}

	.result-label {
		margin: 0;
		font-size: var(--fs-xs);
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.result-name {
		margin: 0;
		font-size: var(--fs-sm);
		font-weight: 600;
		color: var(--text);
	}

	.btn {
		padding: 0.45rem 0.9rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--bg);
		color: var(--text);
		font-size: var(--fs-sm);
		font-weight: 600;
		cursor: pointer;
		transition: border-color var(--tx-base), background var(--tx-base);
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}

	.btn:hover {
		border-color: var(--accent);
	}

	.btn.primary {
		background: color-mix(in srgb, var(--accent) 18%, transparent);
		border-color: color-mix(in srgb, var(--accent) 40%, var(--border));
		color: var(--accent);
	}

	.btn.primary:hover:not(:disabled) {
		background: color-mix(in srgb, var(--accent) 28%, transparent);
		border-color: var(--accent);
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 640px) {
		.dropzone {
			padding: var(--space-4) var(--space-3);
		}

		.dropzone-icon {
			font-size: 2rem;
		}

		.dropzone-text {
			font-size: var(--fs-sm);
		}

		.file-info {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--space-2);
		}

		.format-chips {
			gap: 0.3rem;
		}

		.chip {
			padding: 0.25rem 0.6rem;
			font-size: var(--fs-xs);
		}

		.action-row {
			flex-direction: column;
		}

		.action-row .btn {
			width: 100%;
			justify-content: center;
		}

		.result-card {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--space-2);
		}
	}
</style>
