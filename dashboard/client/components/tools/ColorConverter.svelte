<script>
	import { onMount } from 'svelte';
	import { bindColoris } from '../../lib/coloris.js';

	let input = '#c4b5fd';

	$: hex = normalizeHex(input);
	$: rgb = hexToRgb(hex);
	$: hsl = rgbToHsl(rgb);

	onMount(async () => {
		await bindColoris('#color-tool-swatch');
	});

	function handlePickerInput(e) {
		input = e.target.value;
	}

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
</script>

<div class="color-tool">
	<input class="input color-input" type="text" placeholder="#c4b5fd" bind:value={input} />

	{#if hex}
		<div class="preview-row">
			<input
				id="color-tool-swatch"
				class="swatch"
				type="text"
				value={hex}
				data-coloris
				on:input={handlePickerInput}
				style:background={hex}
			/>
			<div class="values">
				<div class="val"><span class="val-label">HEX</span><code>{hex}</code></div>
				{#if rgb}<div class="val"><span class="val-label">RGB</span><code>rgb({rgb.r}, {rgb.g}, {rgb.b})</code></div>{/if}
				{#if hsl}<div class="val"><span class="val-label">HSL</span><code>hsl({hsl.h}, {hsl.s}%, {hsl.l}%)</code></div>{/if}
			</div>
		</div>
	{:else if input.trim()}
		<p class="error">Enter a valid hex color (e.g. #ff0000 or abc)</p>
	{/if}
</div>

<style>
	.color-tool { display: flex; flex-direction: column; gap: var(--space-3); }
	.color-input { max-width: 200px; font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace; }
	.preview-row { display: flex; gap: var(--space-3); align-items: stretch; }
	.swatch {
		width: 80px;
		min-height: 80px;
		border-radius: var(--radius-sm);
		border: 2px solid var(--border);
		cursor: pointer;
		padding: 0;
		font-size: 0;
		color: transparent;
		appearance: none;
		-webkit-appearance: none;
		outline: none;
	}
	.swatch:hover { border-color: var(--accent); }
	.swatch:focus { border-color: var(--accent); }
	:global(.clr-field) {
		display: block !important;
		width: 80px;
		min-height: 80px;
		border: none !important;
		padding: 0 !important;
	}
	:global(.clr-field button) {
		display: none !important;
	}
	.values { display: flex; flex-direction: column; gap: 0.4rem; justify-content: center; }
	.val { display: flex; align-items: center; gap: var(--space-2); }
	.val-label { font-size: var(--fs-xs); color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; min-width: 2.5rem; }
	.val code { font-size: var(--fs-sm); color: var(--text); font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace; }
	.error { margin: 0; color: #ff8e74; font-size: var(--fs-sm); }
</style>
