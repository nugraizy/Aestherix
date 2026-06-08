<script>
	import QRCodeStyling from 'qr-code-styling';
	import Dropdown from '../ui/Dropdown.svelte';
	import Slider from '../ui/Slider.svelte';

	let input = '';
	let containerEl;
	let qrCode = null;
	let generated = false;

	let size = 280;
	let exportSize = 1024;
	let margin = 10;
	let dotsType = 'rounded';
	let cornersSquareType = 'extra-rounded';
	let cornersDotType = 'dot';
	let fgColor = '#000000';
	let bgColor = '#ffffff';
	let logoUrl = '';
	let logoFile = null;
	let topText = '';
	let bottomText = '';

	const FG_COLORS = ['#000000', '#1a1a2e', '#6d28d9', '#1db954', '#e60023', '#1da1f2', '#ff5500', '#f59e0b'];
	const BG_COLORS = ['#ffffff', '#f6f7fb', '#1a1a2e', '#000000', '#fffbe6', '#e8f5e9', '#fce4ec', '#e3f2fd'];

	function handleLogoFile(e) {
		const file = e.target?.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => { logoUrl = reader.result; };
		reader.readAsDataURL(file);
	}

	function clearLogo() {
		logoUrl = '';
		logoFile = null;
	}

	const DOT_OPTIONS = [
		{ value: 'rounded', label: 'Rounded' },
		{ value: 'dots', label: 'Dots' },
		{ value: 'classy', label: 'Classy' },
		{ value: 'classy-rounded', label: 'Classy Rounded' },
		{ value: 'square', label: 'Square' },
		{ value: 'extra-rounded', label: 'Extra Rounded' }
	];

	const CORNER_SQUARE_OPTIONS = [
		{ value: 'dot', label: 'Dot' },
		{ value: 'square', label: 'Square' },
		{ value: 'extra-rounded', label: 'Extra Rounded' }
	];

	const CORNER_DOT_OPTIONS = [
		{ value: 'dot', label: 'Dot' },
		{ value: 'square', label: 'Square' }
	];

	function createQR() {
		if (!input.trim()) return;

		const opts = {
			data: input.trim(),
			width: size,
			height: size,
			margin,
			dotsOptions: { color: fgColor, type: dotsType },
			backgroundOptions: { color: bgColor },
			cornersSquareOptions: { type: cornersSquareType, color: fgColor },
			cornersDotOptions: { type: cornersDotType, color: fgColor },
			imageOptions: { crossOrigin: 'anonymous', margin: 6, imageSize: 0.35 },
			...(logoUrl ? { image: logoUrl } : {})
		};

		if (qrCode) {
			qrCode.update(opts);
		} else {
			qrCode = new QRCodeStyling(opts);
			containerEl.innerHTML = '';
			qrCode.append(containerEl);
		}

		generated = true;
	}

	async function download(ext) {
		if (!qrCode) return;

		if (ext === 'svg' || (!topText && !bottomText)) {
			const exportQR = new QRCodeStyling({
				data: input.trim(),
				width: exportSize,
				height: exportSize,
				margin,
				dotsOptions: { color: fgColor, type: dotsType },
				backgroundOptions: { color: bgColor },
				cornersSquareOptions: { type: cornersSquareType, color: fgColor },
				cornersDotOptions: { type: cornersDotType, color: fgColor },
				imageOptions: { crossOrigin: 'anonymous', margin: 6, imageSize: 0.35 },
				...(logoUrl ? { image: logoUrl } : {})
			});

			exportQR.download({ name: `qr-${Date.now()}`, extension: ext });
			return;
		}

		const exportQR = new QRCodeStyling({
			data: input.trim(),
			width: exportSize,
			height: exportSize,
			margin,
			dotsOptions: { color: fgColor, type: dotsType },
			backgroundOptions: { color: bgColor },
			cornersSquareOptions: { type: cornersSquareType, color: fgColor },
			cornersDotOptions: { type: cornersDotType, color: fgColor },
			imageOptions: { crossOrigin: 'anonymous', margin: 6, imageSize: 0.35 },
			...(logoUrl ? { image: logoUrl } : {})
		});

		const tmpDiv = document.createElement('div');
		exportQR.append(tmpDiv);

		await new Promise((r) => setTimeout(r, 100));

		const qrCanvas = tmpDiv.querySelector('canvas');
		if (!qrCanvas) return;

		const scale = exportSize / size;
		const padding = Math.round(20 * scale);
		const fontSize = Math.round(16 * scale);
		const textHeight = Math.round(24 * scale);
		const topH = topText ? textHeight + 8 : 0;
		const botH = bottomText ? textHeight + 8 : 0;
		const totalW = exportSize + padding * 2;
		const totalH = exportSize + padding * 2 + topH + botH;

		const canvas = document.createElement('canvas');
		canvas.width = totalW;
		canvas.height = totalH;
		const ctx = canvas.getContext('2d');

		ctx.fillStyle = bgColor;
		ctx.fillRect(0, 0, totalW, totalH);

		ctx.fillStyle = fgColor;
		ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
		ctx.textAlign = 'center';

		if (topText) {
			ctx.fillText(topText, totalW / 2, padding + fontSize);
		}

		ctx.drawImage(qrCanvas, padding, padding + topH);

		if (bottomText) {
			ctx.fillText(bottomText, totalW / 2, padding + topH + exportSize + fontSize + 4);
		}

		const a = document.createElement('a');
		a.href = canvas.toDataURL('image/png');
		a.download = `qr-${Date.now()}.png`;
		a.click();
		tmpDiv.remove();
	}

	function handleKey(e) {
		if (e.key === 'Enter') createQR();
	}

	$: if (input.trim() && (size || margin || dotsType || cornersSquareType || cornersDotType || fgColor || bgColor || logoUrl !== undefined)) createQR();
</script>

<div class="qr-tool">
	<div class="qr-layout">
		<div class="qr-controls">
			<div class="qr-section">
				<span class="qr-label">Content</span>
				<input
					class="input"
					type="text"
					placeholder="Enter text or URL..."
					bind:value={input}
					on:keydown={handleKey}
				/>
			</div>

			<div class="qr-section">
				<span class="qr-label">Dot Style</span>
				<div class="qr-row">
					<Dropdown value={dotsType} options={DOT_OPTIONS} on:change={(e) => (dotsType = e.detail)} />
				</div>
			</div>

			<div class="qr-section">
				<span class="qr-label">Corners</span>
				<div class="qr-row cols">
					<div class="qr-col">
						<span class="qr-sub">Square</span>
						<Dropdown value={cornersSquareType} options={CORNER_SQUARE_OPTIONS} size="sm" on:change={(e) => (cornersSquareType = e.detail)} />
					</div>
					<div class="qr-col">
						<span class="qr-sub">Dot</span>
						<Dropdown value={cornersDotType} options={CORNER_DOT_OPTIONS} size="sm" on:change={(e) => (cornersDotType = e.detail)} />
					</div>
				</div>
			</div>

			<div class="qr-section">
				<span class="qr-label">Colors</span>
				<div class="qr-row cols">
					<div class="qr-col">
						<span class="qr-sub">Foreground</span>
						<div class="qr-swatches">
							{#each FG_COLORS as c}
								<button
									class="qr-swatch"
									class:active={fgColor === c}
									style:background={c}
									type="button"
									on:click={() => (fgColor = c)}
									aria-label="Color {c}"
								></button>
							{/each}
						</div>
					</div>
					<div class="qr-col">
						<span class="qr-sub">Background</span>
						<div class="qr-swatches">
							{#each BG_COLORS as c}
								<button
									class="qr-swatch"
									class:active={bgColor === c}
									style:background={c}
									type="button"
									on:click={() => (bgColor = c)}
									aria-label="Color {c}"
								></button>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<div class="qr-section">
				<span class="qr-label">Size & Margin</span>
				<div class="qr-slider-group">
					<div class="qr-slider-row">
						<span class="qr-sub">Preview</span>
						<Slider min={128} max={512} step={16} bind:value={size} />
						<span class="qr-val">{size}px</span>
					</div>
					<div class="qr-slider-row">
						<span class="qr-sub">Export</span>
						<Slider min={256} max={2048} step={128} bind:value={exportSize} />
						<span class="qr-val">{exportSize}px</span>
					</div>
					<div class="qr-slider-row">
						<span class="qr-sub">Margin</span>
						<Slider min={0} max={40} step={5} bind:value={margin} />
						<span class="qr-val">{margin}</span>
					</div>
				</div>
			</div>

			<div class="qr-section">
				<span class="qr-label">Logo</span>
				<div class="qr-row">
					{#if logoUrl}
						<div class="qr-logo-preview">
							<img src={logoUrl} alt="Logo" />
							<button class="qr-logo-remove" type="button" aria-label="Remove logo" on:click={clearLogo}>
								<i class="nf nf-md-close"></i>
							</button>
						</div>
					{:else}
						<label class="qr-upload-btn">
							<i class="nf nf-md-cloud_upload_outline"></i>
							<span>Upload logo</span>
							<input type="file" accept="image/*" on:change={handleLogoFile} />
						</label>
					{/if}
				</div>
			</div>

			<div class="qr-section">
				<span class="qr-label">Text Overlay</span>
				<div class="qr-row cols">
					<div class="qr-col">
						<span class="qr-sub">Top</span>
						<input class="input" type="text" placeholder="Optional" bind:value={topText} />
					</div>
					<div class="qr-col">
						<span class="qr-sub">Bottom</span>
						<input class="input" type="text" placeholder="Optional" bind:value={bottomText} />
					</div>
				</div>
			</div>
		</div>

		<div class="qr-preview-col">
			<div class="qr-preview-card" class:empty={!generated} style:background={generated ? bgColor : undefined}>
				{#if topText && generated}
					<p class="qr-preview-label" style:color={fgColor}>{topText}</p>
				{/if}
				<div class="qr-canvas" bind:this={containerEl}></div>
				{#if bottomText && generated}
					<p class="qr-preview-label" style:color={fgColor}>{bottomText}</p>
				{/if}
				{#if !generated}
					<div class="qr-placeholder">
						<i class="nf nf-md-qrcode"></i>
						<p>Enter content to generate</p>
					</div>
				{/if}
			</div>

			{#if generated}
				<div class="qr-actions">
					<button class="qr-dl-btn" type="button" on:click={() => download('png')}>
						<i class="nf nf-md-download"></i>
						PNG
					</button>
					<button class="qr-dl-btn" type="button" on:click={() => download('svg')}>
						<i class="nf nf-md-download"></i>
						SVG
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.qr-tool {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.qr-layout {
		display: flex;
		gap: var(--space-4);
		align-items: flex-start;
	}

	.qr-controls {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.qr-section {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.qr-label {
		font-size: var(--fs-xs);
		font-weight: 700;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.qr-sub {
		font-size: var(--fs-xs);
		color: var(--muted);
	}

	.qr-row {
		display: flex;
		gap: var(--space-2);
		align-items: center;
	}

	.qr-row.cols {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-3);
		align-items: start;
	}

	.qr-col {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.qr-swatches {
		display: flex;
		gap: 0.3rem;
		flex-wrap: wrap;
	}

	.qr-swatch {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: 2px solid var(--border);
		cursor: pointer;
		padding: 0;
		transition: border-color var(--tx-base), transform 0.1s;
	}

	.qr-swatch:hover {
		transform: scale(1.15);
	}

	.qr-swatch.active {
		border-color: var(--accent);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 30%, transparent);
	}

	.qr-slider-group {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.qr-slider-row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.qr-slider-row :global(.slider) {
		flex: 1;
	}

	.qr-val {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: var(--fs-xs);
		min-width: 3.5rem;
		text-align: right;
		color: var(--text);
	}

	.qr-upload-btn {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.5rem 0.75rem;
		border: 1px dashed var(--border);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--muted);
		font-size: var(--fs-xs);
		cursor: pointer;
		transition: all var(--tx-fast);
	}

	.qr-upload-btn:hover {
		border-color: var(--accent);
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 6%, transparent);
	}

	.qr-upload-btn input {
		display: none;
	}

	.qr-logo-preview {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: 0.3rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--panel);
	}

	.qr-logo-preview img {
		width: 36px;
		height: 36px;
		border-radius: 4px;
		object-fit: contain;
	}

	.qr-logo-remove {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border: none;
		border-radius: 50%;
		background: color-mix(in srgb, #ff8e74 18%, transparent);
		color: #ff8e74;
		cursor: pointer;
		font-size: 0.65rem;
		transition: all var(--tx-fast);
	}

	.qr-logo-remove:hover {
		background: color-mix(in srgb, #ff8e74 30%, transparent);
	}

	.qr-preview-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
		min-width: 240px;
		position: sticky;
		top: var(--space-4);
	}

	.qr-preview-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-3);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		width: fit-content;
		margin: 0 auto;
		gap: 0.4rem;
		transition: background var(--tx-base);
	}

	.qr-preview-card.empty {
		border-style: dashed;
	}

	.qr-canvas {
		display: flex;
	}

	.qr-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		color: var(--muted);
		opacity: 0.5;
	}

	.qr-placeholder i {
		font-size: 3rem;
	}

	.qr-placeholder p {
		margin: 0;
		font-size: var(--fs-sm);
	}

	.qr-preview-label {
		margin: 0;
		font-size: var(--fs-sm);
		font-weight: 700;
		text-align: center;
	}

	.qr-actions {
		display: flex;
		gap: var(--space-2);
	}

	.qr-dl-btn {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.45rem 0.85rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--panel);
		color: var(--text);
		font-size: var(--fs-xs);
		font-weight: 600;
		cursor: pointer;
		transition: all var(--tx-fast);
	}

	.qr-dl-btn:hover {
		border-color: var(--accent);
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 8%, transparent);
	}

	@media (max-width: 640px) {
		.qr-layout {
			flex-direction: column;
		}

		.qr-preview-col {
			position: static;
			width: 100%;
		}

		.qr-preview-card {
			max-width: 100%;
		}
	}
</style>
