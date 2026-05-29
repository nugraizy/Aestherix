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

	const FG_COLORS = ['#000000', '#1a1a2e', '#c4b5fd', '#1db954', '#ff2a6d', '#1da1f2', '#ff5500', '#e60023'];
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
	<div class="qr-input-row">
		<input
			class="input qr-input"
			type="text"
			placeholder="Enter text or URL"
			bind:value={input}
			on:keydown={handleKey}
		/>
		<button class="btn primary" type="button" on:click={createQR} disabled={!input.trim()}>Generate</button>
	</div>

	<div class="qr-options">
		<label class="qr-opt">
			<span>Preview</span>
			<Slider min={128} max={512} step={16} bind:value={size} />
			<span class="qr-opt-val">{size}</span>
		</label>
		<label class="qr-opt">
			<span>Export</span>
			<Slider min={256} max={2048} step={128} bind:value={exportSize} />
			<span class="qr-opt-val">{exportSize}</span>
		</label>
		<label class="qr-opt">
			<span>Margin</span>
			<Slider min={0} max={40} step={5} bind:value={margin} />
			<span class="qr-opt-val">{margin}</span>
		</label>
		<div class="qr-opt">
			<span>Dots</span>
			<Dropdown value={dotsType} options={DOT_OPTIONS} size="sm" on:change={(e) => (dotsType = e.detail)} />
		</div>
		<div class="qr-opt">
			<span>Corners</span>
			<Dropdown value={cornersSquareType} options={CORNER_SQUARE_OPTIONS} size="sm" on:change={(e) => (cornersSquareType = e.detail)} />
		</div>
		<div class="qr-opt">
			<span>Corner Dot</span>
			<Dropdown value={cornersDotType} options={CORNER_DOT_OPTIONS} size="sm" on:change={(e) => (cornersDotType = e.detail)} />
		</div>
		<div class="qr-opt">
			<span>Color</span>
			<div class="qr-swatches">
				{#each FG_COLORS as c}
					<button class="qr-swatch" class:active={fgColor === c} style:background={c} type="button" on:click={() => (fgColor = c)}></button>
				{/each}
			</div>
		</div>
		<div class="qr-opt">
			<span>Background</span>
			<div class="qr-swatches">
				{#each BG_COLORS as c}
					<button class="qr-swatch" class:active={bgColor === c} style:background={c} type="button" on:click={() => (bgColor = c)}></button>
				{/each}
			</div>
		</div>
	</div>

	<div class="qr-extras">
		<div class="qr-opt">
			<span>Logo</span>
			<input type="file" accept="image/*" on:change={handleLogoFile} class="qr-file" />
			{#if logoUrl}
				<button class="btn" type="button" on:click={clearLogo}>✕</button>
			{/if}
		</div>
		<label class="qr-opt">
			<span>Top text</span>
			<input class="input qr-text-input" type="text" placeholder="Optional" bind:value={topText} />
		</label>
		<label class="qr-opt">
			<span>Bottom text</span>
			<input class="input qr-text-input" type="text" placeholder="Optional" bind:value={bottomText} />
		</label>
	</div>

	<div class="qr-preview-wrap" class:hidden={!generated} style:background={bgColor}>
		{#if topText}
			<p class="qr-label" style:color={fgColor}>{topText}</p>
		{/if}
		<div class="qr-canvas" bind:this={containerEl}></div>
		{#if bottomText}
			<p class="qr-label" style:color={fgColor}>{bottomText}</p>
		{/if}
	</div>

	{#if generated}
		<div class="qr-actions">
			<button class="btn" type="button" on:click={() => download('png')}>↓ PNG</button>
			<button class="btn" type="button" on:click={() => download('svg')}>↓ SVG</button>
		</div>
	{/if}
</div>

<style>
	.qr-tool { display: flex; flex-direction: column; gap: var(--space-3); }
	.qr-input-row { display: flex; gap: var(--space-2); }
	.qr-input { flex: 1; max-width: none; }
	.qr-options { display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center; }
	.qr-opt { display: flex; align-items: center; gap: 0.4rem; font-size: var(--fs-xs); color: var(--muted); }
	.qr-opt :global(.slider) { width: 90px; }
	.qr-opt-val { font-family: 'JetBrains Mono', ui-monospace, monospace; min-width: 2.5rem; }
	.qr-swatches { display: flex; gap: 0.25rem; }
	.qr-swatch { width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--border); cursor: pointer; padding: 0; transition: border-color var(--tx-base), transform 0.1s; }
	.qr-swatch:hover { transform: scale(1.15); }
	.qr-swatch.active { border-color: var(--accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 30%, transparent); }
	.qr-preview-wrap { display: flex; flex-direction: column; align-items: center; padding: var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-md); width: fit-content; margin: 0 auto; gap: 0.4rem; }
	.qr-preview-wrap.hidden { display: none; }
	.qr-canvas { display: flex; }
	.qr-extras { display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center; }
	.qr-file { font-size: var(--fs-xs); max-width: 160px; }
	.qr-text-input { max-width: 140px; font-size: var(--fs-xs); }
	.qr-label { margin: 0; font-size: var(--fs-sm); font-weight: 600; text-align: center; }
	.qr-actions { display: flex; gap: var(--space-2); }
</style>
