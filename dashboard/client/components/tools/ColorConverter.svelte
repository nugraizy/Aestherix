<script>
	import { onMount } from 'svelte';
	import { bindColoris } from '../../lib/coloris.js';
	import { showSuccess } from '../../lib/toast.js';

	let input = '#c4b5fd';
	let gradEnd = '#6d28d9';
	let gradAngle = 90;
	let activeTab = 'harmony';

	$: hex = normalizeHex(input);
	$: rgb = hexToRgb(hex);
	$: hsl = rgbToHsl(rgb);
	$: complementary = hex ? hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l) : null;
	$: triadic = hex ? [hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l), hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l)] : [];
	$: analogous = hex ? [
		hslToHex((hsl.h + 330) % 360, hsl.s, hsl.l),
		hslToHex((hsl.h + 345) % 360, hsl.s, hsl.l),
		hex,
		hslToHex((hsl.h + 15) % 360, hsl.s, hsl.l),
		hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l)
	] : [];
	$: splitComp = hex ? [hslToHex((hsl.h + 150) % 360, hsl.s, hsl.l), hslToHex((hsl.h + 210) % 360, hsl.s, hsl.l)] : [];
	$: shades = hex ? [90, 75, 60, 45, 30, 15, 5].map((l) => hslToHex(hsl.h, hsl.s, l)) : [];
	$: gradHex = normalizeHex(gradEnd);
	$: gradient = hex && gradHex ? `linear-gradient(${gradAngle}deg, ${hex}, ${gradHex})` : '';
	$: palette = hex ? generatePalette(hsl) : [];

	onMount(async () => {
		await bindColoris('#color-tool-swatch');
		await bindColoris('#grad-end-swatch');
	});

	function handlePickerInput(e) { input = e.target.value; }
	function handleGradPickerInput(e) { gradEnd = e.target.value; }

	function normalizeHex(v) {
		const raw = v.trim().replace(/^#/, '');
		if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw.toLowerCase()}`;
		if (/^[0-9a-f]{3}$/i.test(raw)) return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`.toLowerCase();
		return '';
	}

	function hexToRgb(h) {
		if (!h) return null;
		const n = parseInt(h.slice(1), 16);
		return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
	}

	function rgbToHsl({ r, g, b }) {
		if (!r && r !== 0) return null;
		const rf = r / 255, gf = g / 255, bf = b / 255;
		const max = Math.max(rf, gf, bf), min = Math.min(rf, gf, bf);
		let h = 0, s = 0;
		const l = (max + min) / 2;
		if (max !== min) {
			const d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			if (max === rf) h = ((gf - bf) / d + (gf < bf ? 6 : 0)) * 60;
			else if (max === gf) h = ((bf - rf) / d + 2) * 60;
			else h = ((rf - gf) / d + 4) * 60;
		}
		return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
	}

	function hslToHex(h, s, l) {
		const sf = s / 100, lf = l / 100;
		const c = (1 - Math.abs(2 * lf - 1)) * sf;
		const x = c * (1 - Math.abs((h / 60) % 2 - 1));
		const m = lf - c / 2;
		let r = 0, g = 0, b = 0;
		if (h < 60) { r = c; g = x; }
		else if (h < 120) { r = x; g = c; }
		else if (h < 180) { g = c; b = x; }
		else if (h < 240) { g = x; b = c; }
		else if (h < 300) { r = x; b = c; }
		else { r = c; b = x; }
		const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
		return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
	}

	function generatePalette(baseHsl) {
		if (!baseHsl) return [];
		return [
			{ name: '50', h: baseHsl.h, s: Math.max(baseHsl.s - 30, 10), l: 97 },
			{ name: '100', h: baseHsl.h, s: Math.max(baseHsl.s - 20, 15), l: 93 },
			{ name: '200', h: baseHsl.h, s: Math.max(baseHsl.s - 10, 20), l: 85 },
			{ name: '300', h: baseHsl.h, s: baseHsl.s, l: 72 },
			{ name: '400', h: baseHsl.h, s: baseHsl.s, l: 60 },
			{ name: '500', h: baseHsl.h, s: baseHsl.s, l: baseHsl.l },
			{ name: '600', h: baseHsl.h, s: baseHsl.s, l: Math.max(baseHsl.l - 12, 20) },
			{ name: '700', h: baseHsl.h, s: baseHsl.s, l: Math.max(baseHsl.l - 24, 15) },
			{ name: '800', h: baseHsl.h, s: Math.max(baseHsl.s - 5, 20), l: Math.max(baseHsl.l - 36, 10) },
			{ name: '900', h: baseHsl.h, s: Math.max(baseHsl.s - 10, 25), l: Math.max(baseHsl.l - 48, 8) }
		].map((c) => ({ ...c, hex: hslToHex(c.h, c.s, c.l) }));
	}

	function copyValue(text) {
		navigator.clipboard.writeText(text).then(() => showSuccess('Copied!'));
	}

	function setFromSwatch(color) { input = color; }
</script>

<div class="color-tool">
	<div class="color-layout">
		<div class="color-left">
			<div class="color-section">
				<label class="color-label">Input</label>
				<div class="color-input-row">
					<input
						id="color-tool-swatch"
						class="color-picker"
						type="text"
						value={hex}
						data-coloris
						on:input={handlePickerInput}
						style:background={hex || '#333'}
					/>
					<input
						class="input color-text-input"
						type="text"
						placeholder="#c4b5fd or c4b5fd"
						bind:value={input}
					/>
				</div>
			</div>

			{#if hex}
				<div class="color-section">
					<label class="color-label">Preview</label>
					<div class="color-preview-card" style:background={hex}>
						<span class="color-preview-text" style:color={hsl.l > 55 ? '#000' : '#fff'}>{hex}</span>
					</div>
				</div>

				<div class="color-section">
					<label class="color-label">Values</label>
					<div class="color-values">
						<button class="color-value-card" type="button" on:click={() => copyValue(hex)}>
							<span class="cv-label">HEX</span>
							<span class="cv-code">{hex}</span>
							<span class="cv-copy"><i class="nf nf-md-content_copy"></i></span>
						</button>
						{#if rgb}
							<button class="color-value-card" type="button" on:click={() => copyValue(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)}>
								<span class="cv-label">RGB</span>
								<span class="cv-code">{rgb.r}, {rgb.g}, {rgb.b}</span>
								<span class="cv-copy"><i class="nf nf-md-content_copy"></i></span>
							</button>
						{/if}
						{#if hsl}
							<button class="color-value-card" type="button" on:click={() => copyValue(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}>
								<span class="cv-label">HSL</span>
								<span class="cv-code">{hsl.h}, {hsl.s}%, {hsl.l}%</span>
								<span class="cv-copy"><i class="nf nf-md-content_copy"></i></span>
							</button>
						{/if}
					</div>
				</div>
			{:else if input.trim()}
				<p class="error">Enter a valid hex color (e.g. #ff0000 or abc)</p>
			{/if}
		</div>

		{#if hex}
			<div class="color-right">
				<div class="color-tabs">
					{#each [{ id: 'harmony', label: 'Harmony' }, { id: 'palette', label: 'Palette' }, { id: 'gradient', label: 'Gradient' }] as tab (tab.id)}
						<button class="color-tab" class:active={activeTab === tab.id} type="button" on:click={() => (activeTab = tab.id)}>
							{tab.label}
						</button>
					{/each}
				</div>

				{#if activeTab === 'harmony'}
					<div class="color-section">
						<label class="color-label">Complementary</label>
						<div class="color-swatches-row">
							<button class="color-swatch-lg" style:background={hex} type="button" on:click={() => setFromSwatch(hex)}></button>
							<button class="color-swatch-lg" style:background={complementary} type="button" on:click={() => setFromSwatch(complementary)}></button>
						</div>
					</div>

					<div class="color-section">
						<label class="color-label">Analogous</label>
						<div class="color-swatches-row">
							{#each analogous as color, i (i)}
								<button class="color-swatch-lg" class:active={i === 2} style:background={color} type="button" on:click={() => setFromSwatch(color)}></button>
							{/each}
						</div>
					</div>

					<div class="color-section">
						<label class="color-label">Triadic</label>
						<div class="color-swatches-row">
							<button class="color-swatch-lg" style:background={hex} type="button" on:click={() => setFromSwatch(hex)}></button>
							{#each triadic as color}
								<button class="color-swatch-lg" style:background={color} type="button" on:click={() => setFromSwatch(color)}></button>
							{/each}
						</div>
					</div>

					<div class="color-section">
						<label class="color-label">Split Complementary</label>
						<div class="color-swatches-row">
							{#each splitComp as color}
								<button class="color-swatch-lg" style:background={color} type="button" on:click={() => setFromSwatch(color)}></button>
							{/each}
							<button class="color-swatch-lg" style:background={hex} type="button" on:click={() => setFromSwatch(hex)}></button>
						</div>
					</div>

					<div class="color-section">
						<label class="color-label">Shades</label>
						<div class="color-swatches-row shades">
							{#each shades as color, i (i)}
								<button class="color-swatch-sm" style:background={color} type="button" on:click={() => setFromSwatch(color)}></button>
							{/each}
						</div>
					</div>
				{:else if activeTab === 'palette'}
					<div class="color-section">
						<label class="color-label">Material Palette</label>
						<div class="palette-grid">
							{#each palette as p (p.name)}
								<button class="palette-item" type="button" on:click={() => setFromSwatch(p.hex)}>
									<div class="palette-swatch" style:background={p.hex}></div>
									<span class="palette-name">{p.name}</span>
									<span class="palette-hex">{p.hex}</span>
								</button>
							{/each}
						</div>
					</div>
				{:else if activeTab === 'gradient'}
					<div class="color-section">
						<label class="color-label">Gradient Builder</label>
						<div class="grad-preview" style:background={gradient}></div>
						<div class="grad-controls">
							<div class="grad-color-row">
								<div class="grad-color">
									<span class="qr-sub">Start</span>
									<div class="grad-input-row">
										<input
											class="color-picker-sm"
											type="text"
											value={hex}
											data-coloris
											on:input={handlePickerInput}
											style:background={hex}
										/>
										<span class="grad-hex">{hex}</span>
									</div>
								</div>
								<div class="grad-color">
									<span class="qr-sub">End</span>
									<div class="grad-input-row">
										<input
											id="grad-end-swatch"
											class="color-picker-sm"
											type="text"
											value={gradHex}
											data-coloris
											on:input={handleGradPickerInput}
											style:background={gradHex || '#333'}
										/>
										<span class="grad-hex">{gradHex || '...'}</span>
									</div>
								</div>
							</div>
							<div class="grad-angle-row">
								<span class="qr-sub">Angle</span>
								<input class="grad-angle-slider" type="range" min="0" max="360" step="15" bind:value={gradAngle} />
								<span class="grad-angle-val">{gradAngle}&deg;</span>
							</div>
						</div>
						<div class="grad-presets">
							{#each [0, 45, 90, 135, 180, 270] as angle}
								<button
									class="grad-preset"
									class:active={gradAngle === angle}
									type="button"
									on:click={() => (gradAngle = angle)}
									style:background={`linear-gradient(${angle}deg, ${hex}, ${gradHex || '#888'})`}
									title="{angle}&deg;"
								></button>
							{/each}
						</div>
						<button class="grad-copy-btn" type="button" on:click={() => copyValue(`background: ${gradient};`)}>
							<i class="nf nf-md-content_copy"></i> Copy CSS
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.color-tool { display: flex; flex-direction: column; gap: var(--space-3); }
	.color-layout { display: flex; gap: var(--space-4); align-items: flex-start; }
	.color-left { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: var(--space-3); }
	.color-right { min-width: 220px; display: flex; flex-direction: column; gap: var(--space-3); }
	.color-section { display: flex; flex-direction: column; gap: 0.4rem; }
	.color-label { font-size: var(--fs-xs); font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }
	.color-input-row { display: flex; gap: var(--space-2); align-items: center; }
	.color-picker {
		width: 42px; height: 42px; border-radius: var(--radius-sm); border: 2px solid var(--border);
		cursor: pointer; padding: 0; font-size: 0; color: transparent;
		appearance: none; -webkit-appearance: none; outline: none; flex-shrink: 0; transition: border-color var(--tx-fast);
	}
	.color-picker:hover, .color-picker:focus { border-color: var(--accent); }
	:global(.clr-field) { display: block !important; width: 42px; height: 42px; border: none !important; padding: 0 !important; }
	:global(.clr-field button) { display: none !important; }
	.color-text-input { flex: 1; font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace; max-width: none; }
	.color-preview-card {
		display: flex; align-items: center; justify-content: center; height: 72px;
		border-radius: var(--radius-sm); border: 1px solid var(--border); transition: background var(--tx-base);
	}
	.color-preview-text { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: var(--fs-md); font-weight: 700; text-transform: uppercase; text-shadow: 0 1px 2px rgba(0,0,0,0.15); }
	.color-values { display: flex; flex-direction: column; gap: 0.3rem; }
	.color-value-card {
		display: flex; align-items: center; gap: var(--space-2); padding: 0.45rem 0.6rem;
		border: 1px solid var(--border); border-radius: var(--radius-sm); background: transparent;
		cursor: pointer; text-align: left; transition: all var(--tx-fast);
	}
	.color-value-card:hover { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 6%, transparent); }
	.cv-label { font-size: var(--fs-xs); font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; min-width: 2.2rem; }
	.cv-code { flex: 1; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: var(--fs-sm); color: var(--text); }
	.cv-copy { font-size: 0.7rem; color: var(--muted); opacity: 0; transition: opacity var(--tx-fast); }
	.color-value-card:hover .cv-copy { opacity: 1; }

	.color-tabs { display: flex; gap: 0.25rem; padding: 0.25rem; border-radius: var(--radius-pill); background: var(--bg); border: 1px solid var(--border); }
	.color-tab {
		flex: 1; padding: 0.35rem 0.5rem; border: none; border-radius: var(--radius-pill);
		background: transparent; color: var(--muted); font-size: var(--fs-xs); font-weight: 600;
		cursor: pointer; transition: all var(--tx-fast); text-align: center;
	}
	.color-tab:hover:not(.active) { color: var(--text); }
	.color-tab.active { background: color-mix(in srgb, var(--accent) 22%, transparent); color: var(--accent); }

	.color-swatches-row { display: flex; gap: 0.35rem; }
	.color-swatch-lg {
		width: 36px; height: 36px; border-radius: var(--radius-sm); border: 2px solid var(--border);
		cursor: pointer; padding: 0; transition: border-color var(--tx-fast), transform 0.1s;
	}
	.color-swatch-lg:hover { transform: scale(1.1); border-color: var(--accent); }
	.color-swatch-lg.active { border-color: var(--accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 30%, transparent); }
	.color-swatches-row.shades { gap: 0; }
	.color-swatch-sm {
		flex: 1; height: 28px; border: none; cursor: pointer; padding: 0; transition: transform 0.1s;
	}
	.color-swatch-sm:first-child { border-radius: var(--radius-sm) 0 0 var(--radius-sm); }
	.color-swatch-sm:last-child { border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
	.color-swatch-sm:hover { transform: scaleY(1.2); }

	.palette-grid { display: flex; flex-direction: column; gap: 1px; }
	.palette-item {
		display: flex; align-items: center; gap: var(--space-2); padding: 0.35rem 0.5rem;
		border: none; background: transparent; cursor: pointer; transition: background var(--tx-fast); text-align: left;
		border-radius: var(--radius-sm);
	}
	.palette-item:hover { background: color-mix(in srgb, var(--accent) 8%, transparent); }
	.palette-swatch { width: 24px; height: 24px; border-radius: 4px; border: 1px solid var(--border); flex-shrink: 0; }
	.palette-name { font-size: var(--fs-xs); font-weight: 700; color: var(--muted); min-width: 2rem; }
	.palette-hex { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: var(--fs-xs); color: var(--text); }

	.grad-preview { height: 80px; border-radius: var(--radius-sm); border: 1px solid var(--border); }
	.grad-controls { display: flex; flex-direction: column; gap: var(--space-2); }
	.grad-color-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
	.grad-color { display: flex; flex-direction: column; gap: 0.3rem; }
	.qr-sub { font-size: var(--fs-xs); color: var(--muted); }
	.grad-input-row { display: flex; align-items: center; gap: 0.4rem; }
	.color-picker-sm {
		width: 28px; height: 28px; border-radius: 4px; border: 2px solid var(--border);
		cursor: pointer; padding: 0; font-size: 0; color: transparent;
		appearance: none; -webkit-appearance: none; outline: none; flex-shrink: 0;
	}
	.color-picker-sm:hover { border-color: var(--accent); }
	.grad-hex { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: var(--fs-xs); color: var(--text); }
	.grad-angle-row { display: flex; align-items: center; gap: var(--space-2); }
	.grad-angle-slider { flex: 1; accent-color: var(--accent); }
	.grad-angle-val { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: var(--fs-xs); min-width: 2.5rem; text-align: right; }
	.grad-presets { display: flex; gap: 0.3rem; }
	.grad-preset {
		flex: 1; height: 28px; border: 2px solid var(--border); border-radius: 4px;
		cursor: pointer; padding: 0; transition: border-color var(--tx-fast);
	}
	.grad-preset:hover { border-color: var(--accent); }
	.grad-preset.active { border-color: var(--accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 30%, transparent); }
	.grad-copy-btn {
		display: flex; align-items: center; justify-content: center; gap: 0.35rem;
		padding: 0.4rem 0.7rem; border: 1px solid var(--border); border-radius: var(--radius-sm);
		background: transparent; color: var(--text); font-size: var(--fs-xs); font-weight: 600;
		cursor: pointer; transition: all var(--tx-fast);
	}
	.grad-copy-btn:hover { border-color: var(--accent); color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, transparent); }

	.error { margin: 0; color: #ff8e74; font-size: var(--fs-sm); }

	@media (max-width: 640px) {
		.color-layout { flex-direction: column; }
		.color-right { min-width: unset; width: 100%; }
	}
</style>
