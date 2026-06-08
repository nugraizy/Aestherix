<script>
	import { onMount, afterUpdate } from 'svelte';
	import { showError } from '../../lib/toast.js';
	import Dropdown from '../ui/Dropdown.svelte';

	const CURRENCIES = [
		{ code: 'USD', name: 'US Dollar', symbol: '$' },
		{ code: 'EUR', name: 'Euro', symbol: '\u20AC' },
		{ code: 'GBP', name: 'British Pound', symbol: '\u00A3' },
		{ code: 'JPY', name: 'Japanese Yen', symbol: '\u00A5' },
		{ code: 'THB', name: 'Thai Baht', symbol: '\u0E3F' },
		{ code: 'CNY', name: 'Chinese Yuan', symbol: '\u00A5' },
		{ code: 'KRW', name: 'South Korean Won', symbol: '\u20A9' },
		{ code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
		{ code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
		{ code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
		{ code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
		{ code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
		{ code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
		{ code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
		{ code: 'PHP', name: 'Philippine Peso', symbol: '\u20B1' },
		{ code: 'VND', name: 'Vietnamese Dong', symbol: '\u20AB' },
		{ code: 'INR', name: 'Indian Rupee', symbol: '\u20B9' },
		{ code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$' },
		{ code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
		{ code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
		{ code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$' },
		{ code: 'RUB', name: 'Russian Ruble', symbol: '\u20BD' },
		{ code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
		{ code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
		{ code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
		{ code: 'PLN', name: 'Polish Zloty', symbol: 'z\u0142' },
		{ code: 'TRY', name: 'Turkish Lira', symbol: '\u20BA' },
		{ code: 'ZAR', name: 'South African Rand', symbol: 'R' },
		{ code: 'AED', name: 'UAE Dirham', symbol: '\u062F.\u0625' },
		{ code: 'SAR', name: 'Saudi Riyal', symbol: '\uFDFC' },
		{ code: 'EGP', name: 'Egyptian Pound', symbol: 'E\u00A3' },
		{ code: 'PKR', name: 'Pakistani Rupee', symbol: '\u20A8' },
		{ code: 'BDT', name: 'Bangladeshi Taka', symbol: '\u09F3' },
		{ code: 'NGN', name: 'Nigerian Naira', symbol: '\u20A6' }
	];

	const DROPDOWN_OPTIONS = CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} - ${c.name}` }));

	const RANGES = [
		{ label: '5D', days: 5 },
		{ label: '1M', days: 30 },
		{ label: '3M', days: 90 },
		{ label: '6M', days: 180 },
		{ label: '1Y', days: 365 },
		{ label: '5Y', days: 1825 },
		{ label: 'MAX', days: null }
	];

	let amount = '1';
	let fromCurrency = 'USD';
	let toCurrency = 'THB';
	let rates = null;
	let loading = false;
	let lastFetched = '';

	let chartCanvas;
	let chartData = null;
	let chartLoading = false;
	let activeRange = '1Y';
	let hoveredPoint = null;

	$: result = rates && amount ? calculateResult(amount, fromCurrency, toCurrency, rates) : null;
	$: chartPair = `${fromCurrency}:${toCurrency}`;
	$: if (chartPair && typeof window !== 'undefined') {
		fetchHistory();
	}

	$: hoveredValue = hoveredPoint !== null && chartData && chartData[hoveredPoint]
		? formatNumber(chartData[hoveredPoint].value, chartData[hoveredPoint].value >= 100 ? 2 : 4)
		: null;

	function calculateResult(amt, from, to, r) {
		const num = parseFloat(amt);

		if (isNaN(num) || num < 0) return null;

		const fromRate = from === 'EUR' ? 1 : r[from];
		const toRate = to === 'EUR' ? 1 : r[to];

		if (!fromRate || !toRate) return null;

		const value = (num / fromRate) * toRate;
		const decimals = value >= 100 ? 2 : value >= 1 ? 4 : 6;

		return formatNumber(value, decimals);
	}

	function formatNumber(value, decimals) {
		const parts = value.toFixed(decimals).split('.');
		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

		return parts.join('.');
	}

	onMount(() => {
		fetchRates();
	});

	afterUpdate(() => {
		if (chartCanvas && chartData) {
			drawChart();
		}
	});

	async function fetchRates() {
		loading = true;

		try {
			const res = await fetch('https://api.frankfurter.dev/v1/latest');

			if (!res.ok) throw new Error('Failed to fetch rates');

			const data = await res.json();

			rates = data.rates;
			lastFetched = data.date;
		} catch {
			showError('Failed to load exchange rates. Try again later.');
		}

		loading = false;
	}

	async function fetchHistory() {
		chartLoading = true;

		try {
			const range = RANGES.find((r) => r.label === activeRange);
			const end = new Date();
			let start;

			if (range.days) {
				start = new Date(end);
				start.setDate(start.getDate() - range.days);
			} else {
				start = new Date('1999-01-04');
			}

			const fmt = (d) => d.toISOString().slice(0, 10);
			const url = `https://api.frankfurter.dev/v1/${fmt(start)}..${fmt(end)}?from=${fromCurrency}&to=${toCurrency}`;
			const res = await fetch(url);

			if (!res.ok) throw new Error('Failed to fetch history');

			const data = await res.json();
			const entries = Object.entries(data.rates).sort(([a], [b]) => a.localeCompare(b));
			const points = entries.map(([date, r]) => ({
				date,
				value: r[toCurrency]
			}));

			chartData = points;
		} catch {
			chartData = null;
		}

		chartLoading = false;
	}

	function setRange(label) {
		activeRange = label;
		fetchHistory();
	}

	function drawChart() {
		if (!chartCanvas || !chartData || chartData.length < 2) return;

		const root = document.documentElement;
		const cs = getComputedStyle(root);
		const gridColor = cs.getPropertyValue('--border').trim() || '#333';
		const textColor = cs.getPropertyValue('--muted').trim() || '#888';
		const accentColor = cs.getPropertyValue('--accent').trim() || '#4ade80';

		const ctx = chartCanvas.getContext('2d');
		const dpr = window.devicePixelRatio || 1;
		const rect = chartCanvas.getBoundingClientRect();
		const w = rect.width;
		const h = rect.height;

		chartCanvas.width = w * dpr;
		chartCanvas.height = h * dpr;
		ctx.scale(dpr, dpr);

		const pad = { top: 12, right: 12, bottom: 28, left: 56 };
		const cw = w - pad.left - pad.right;
		const ch = h - pad.top - pad.bottom;

		const values = chartData.map((p) => p.value);
		const min = Math.min(...values);
		const max = Math.max(...values);
		const range = max - min || 1;
		const yPad = range * 0.08;
		const yMin = min - yPad;
		const yMax = max + yPad;

		const xScale = (i) => pad.left + (i / (chartData.length - 1)) * cw;
		const yScale = (v) => pad.top + ch - ((v - yMin) / (yMax - yMin)) * ch;

		ctx.clearRect(0, 0, w, h);

		ctx.strokeStyle = gridColor;
		ctx.lineWidth = 0.5;

		for (let i = 0; i <= 4; i++) {
			const y = pad.top + (ch / 4) * i;
			ctx.beginPath();
			ctx.moveTo(pad.left, y);
			ctx.lineTo(w - pad.right, y);
			ctx.stroke();
		}

		ctx.fillStyle = textColor;
		ctx.font = '10px system-ui, sans-serif';
		ctx.textAlign = 'right';

		for (let i = 0; i <= 4; i++) {
			const y = pad.top + (ch / 4) * i;
			const val = yMax - ((yMax - yMin) / 4) * i;
			ctx.fillText(formatNumber(val, val >= 100 ? 1 : 4), pad.left - 6, y + 3);
		}

		const xLabels = getXLabels();

		ctx.textAlign = 'center';

		for (const { index, label } of xLabels) {
			const x = xScale(index);
			ctx.fillText(label, x, h - 6);
		}

		const isPositive = values[values.length - 1] >= values[0];
		const lineColor = isPositive ? accentColor : '#ef4444';
		const fillColor = isPositive
			? colorWithAlpha(accentColor, 0.1)
			: 'rgba(239, 68, 68, 0.1)';

		ctx.beginPath();

		for (let i = 0; i < chartData.length; i++) {
			const x = xScale(i);
			const y = yScale(chartData[i].value);

			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}

		ctx.strokeStyle = lineColor;
		ctx.lineWidth = 2;
		ctx.lineJoin = 'round';
		ctx.stroke();

		const lastX = xScale(chartData.length - 1);

		ctx.lineTo(lastX, pad.top + ch);
		ctx.lineTo(pad.left, pad.top + ch);
		ctx.closePath();
		ctx.fillStyle = fillColor;
		ctx.fill();

		if (hoveredPoint !== null && hoveredPoint >= 0 && hoveredPoint < chartData.length) {
			const hx = xScale(hoveredPoint);
			const hy = yScale(chartData[hoveredPoint].value);

			ctx.beginPath();
			ctx.arc(hx, hy, 4, 0, Math.PI * 2);
			ctx.fillStyle = lineColor;
			ctx.fill();
			ctx.strokeStyle = '#1a1a2e';
			ctx.lineWidth = 2;
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(hx, pad.top);
			ctx.lineTo(hx, pad.top + ch);
			ctx.strokeStyle = gridColor;
			ctx.lineWidth = 1;
			ctx.setLineDash([3, 3]);
			ctx.stroke();
			ctx.setLineDash([]);
		}
	}

	function getXLabels() {
		if (!chartData || chartData.length < 2) return [];

		const labels = [];
		const total = chartData.length;
		const count = Math.min(5, total);
		const step = (total - 1) / (count - 1);

		for (let i = 0; i < count; i++) {
			const index = Math.round(i * step);
			const date = chartData[index].date;
			const d = new Date(date + 'T00:00:00');
			const label = activeRange === '5D' || activeRange === '1M'
				? d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
				: d.toLocaleDateString('en', { month: 'short', year: '2-digit' });

			labels.push({ index, label });
		}

		return labels;
	}

	function handleChartMove(e) {
		if (!chartData || !chartCanvas) return;

		const rect = chartCanvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const pad = { left: 56, right: 12 };
		const cw = rect.width - pad.left - pad.right;
		const ratio = (x - pad.left) / cw;
		const index = Math.round(ratio * (chartData.length - 1));

		hoveredPoint = Math.max(0, Math.min(chartData.length - 1, index));
	}

	function handleChartLeave() {
		hoveredPoint = null;
	}

	function swap() {
		const tmp = fromCurrency;

		fromCurrency = toCurrency;
		toCurrency = tmp;
	}

	function getSymbol(code) {
		return CURRENCIES.find((c) => c.code === code)?.symbol || code;
	}

	function colorWithAlpha(color, alpha) {
		if (color.startsWith('#')) {
			const r = parseInt(color.slice(1, 3), 16);
			const g = parseInt(color.slice(3, 5), 16);
			const b = parseInt(color.slice(5, 7), 16);

			return `rgba(${r}, ${g}, ${b}, ${alpha})`;
		}

		if (color.startsWith('rgb(')) {
			return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
		}

		return color;
	}
</script>

<div class="currency">
	<div class="converter-grid">
		<div class="row top-row">
			<div class="input-group">
				<label class="label" for="curr-amount">Amount</label>
				<input
					id="curr-amount"
					class="input amount-input"
					type="number"
					min="0"
					step="any"
					placeholder="0"
					bind:value={amount}
				/>
			</div>
			<div class="input-group">
				<span class="label">From</span>
				<Dropdown
					value={fromCurrency}
					options={DROPDOWN_OPTIONS}
					on:change={(e) => (fromCurrency = e.detail)}
				/>
			</div>
		</div>

		<div class="row bottom-row">
			<div class="input-group result-group">
				<span class="label">Result</span>
				{#if loading}
					<div class="result-display loading">
						<span class="spinner"></span>
					</div>
				{:else if result !== null}
					<div class="result-display">
						<span class="result-symbol">{getSymbol(toCurrency)}</span>
						<span class="result-value">{result}</span>
					</div>
				{:else}
					<div class="result-display empty">-</div>
				{/if}
			</div>
			<div class="input-group">
				<span class="label">To</span>
				<Dropdown
					value={toCurrency}
					options={DROPDOWN_OPTIONS}
					on:change={(e) => (toCurrency = e.detail)}
				/>
			</div>
		</div>

		<button class="swap-btn" type="button" on:click={swap} aria-label="Swap currencies">
			<i class="nf nf-md-swap_vertical"></i>
		</button>
	</div>

	{#if result !== null && !loading}
		<div class="rate-row">
			<span class="rate-text">
				1 {fromCurrency} = {calculateResult('1', fromCurrency, toCurrency, rates)} {toCurrency}
			</span>
			<span class="rate-text">
				1 {toCurrency} = {calculateResult('1', toCurrency, fromCurrency, rates)} {fromCurrency}
			</span>
		</div>
	{/if}

	<div class="chart-section">
		<div class="chart-header">
			<div class="range-tabs">
				{#each RANGES as r (r.label)}
					<button
						class="range-tab"
						class:active={activeRange === r.label}
						type="button"
						on:click={() => setRange(r.label)}
					>
						{r.label}
					</button>
				{/each}
			</div>
			{#if hoveredPoint !== null && chartData && chartData[hoveredPoint]}
				<span class="chart-tooltip-value">
					{hoveredValue} {toCurrency}
					<span class="chart-tooltip-date">{chartData[hoveredPoint].date}</span>
				</span>
			{/if}
		</div>

		<div class="chart-container">
			{#if chartLoading}
				<div class="chart-loading">
					<span class="spinner"></span>
				</div>
			{:else if chartData && chartData.length >= 2}
				<canvas
					bind:this={chartCanvas}
					class="chart-canvas"
					on:mousemove={handleChartMove}
					on:mouseleave={handleChartLeave}
				></canvas>
			{:else}
				<div class="chart-empty">No historical data available.</div>
			{/if}
		</div>
	</div>

	<div class="footer-row">
		{#if lastFetched}
			<span class="rate-date">Rates as of {lastFetched}</span>
		{/if}
		<button class="btn" type="button" on:click={fetchRates} disabled={loading}>
			<i class="nf nf-md-refresh"></i> Refresh
		</button>
	</div>
</div>

<style>
	.currency {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.converter-grid {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.row {
		display: flex;
		gap: var(--space-2);
	}

	.row .input-group:first-child {
		flex: 1;
	}

	.row .input-group:last-child {
		min-width: 160px;
	}

	.swap-btn {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: 1px solid var(--border);
		background: var(--bg);
		color: var(--muted);
		cursor: pointer;
		font-size: 1rem;
		transition: all var(--tx-base);
	}

	.swap-btn:hover {
		border-color: var(--accent);
		color: var(--accent);
		transform: translate(-50%, -50%) rotate(180deg);
	}

	.label {
		font-size: var(--fs-xs);
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 600;
		margin-bottom: 0.3rem;
		display: block;
	}

	.input {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--bg);
		color: var(--text);
		font-size: var(--fs-sm);
		outline: none;
		transition: border-color var(--tx-base);
		width: 100%;
		box-sizing: border-box;
	}

	.input:focus {
		border-color: var(--accent);
	}

	.amount-input {
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		font-size: var(--fs-lg);
		font-weight: 600;
		-moz-appearance: textfield;
	}

	.amount-input::-webkit-inner-spin-button,
	.amount-input::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.result-display {
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--accent) 6%, var(--bg));
		min-height: 2.4rem;
		box-sizing: border-box;
	}

	.result-display.empty {
		color: var(--muted);
	}

	.result-display.loading {
		justify-content: center;
	}

	.result-symbol {
		font-size: var(--fs-sm);
		color: var(--muted);
		font-weight: 600;
	}

	.result-value {
		font-size: var(--fs-lg);
		font-weight: 700;
		color: var(--accent);
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
	}

	.spinner {
		display: inline-block;
		width: 1em;
		height: 1em;
		border: 2px solid transparent;
		border-top-color: var(--muted);
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.rate-row {
		display: flex;
		justify-content: space-between;
		gap: var(--space-2);
		padding: 0;
	}

	.rate-text {
		font-size: var(--fs-xs);
		color: var(--muted);
	}

	.chart-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.chart-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 28px;
	}

	.range-tabs {
		display: flex;
		gap: 2px;
	}

	.range-tab {
		padding: 0.25rem 0.55rem;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--muted);
		font-size: var(--fs-xs);
		font-weight: 600;
		cursor: pointer;
		transition: all var(--tx-fast);
	}

	.range-tab:hover {
		color: var(--text);
		background: color-mix(in srgb, var(--accent) 10%, transparent);
	}

	.range-tab.active {
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 16%, transparent);
	}

	.chart-tooltip-value {
		font-size: var(--fs-sm);
		font-weight: 700;
		color: var(--text);
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
	}

	.chart-tooltip-date {
		font-size: var(--fs-xs);
		color: var(--muted);
		font-weight: 400;
		margin-left: 0.4rem;
	}

	.chart-container {
		position: relative;
		height: 200px;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--bg);
		overflow: hidden;
	}

	.chart-canvas {
		display: block;
		width: 100%;
		height: 100%;
		cursor: crosshair;
	}

	.chart-loading {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
	}

	.chart-loading .spinner {
		width: 1.5em;
		height: 1.5em;
	}

	.chart-empty {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--muted);
		font-size: var(--fs-sm);
	}

	.footer-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.rate-date {
		font-size: var(--fs-xs);
		color: var(--muted);
	}

	.btn {
		padding: 0.35rem 0.7rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--bg);
		color: var(--text);
		font-size: var(--fs-xs);
		font-weight: 600;
		cursor: pointer;
		transition: border-color var(--tx-base), background var(--tx-base);
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
	}

	.btn:hover:not(:disabled) {
		border-color: var(--accent);
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 480px) {
		.row {
			flex-direction: column;
		}

		.row .input-group:last-child {
			min-width: 100%;
		}

		.rate-row {
			flex-direction: column;
			gap: 0.2rem;
		}

		.chart-container {
			height: 160px;
		}
	}
</style>
