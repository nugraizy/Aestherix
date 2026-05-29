<script>
	import { onDestroy } from 'svelte';

	let unixInput = '';
	let dateInput = '';
	let now = Date.now();

	const timer = setInterval(() => { now = Date.now(); }, 1000);
	onDestroy(() => clearInterval(timer));

	$: fromUnix = parseUnix(unixInput);
	$: fromDate = parseDate(dateInput);

	function parseUnix(val) {
		const n = Number(val);
		if (!val.trim() || !Number.isFinite(n)) return null;
		const ms = n > 1e12 ? n : n * 1000;
		return new Date(ms);
	}

	function parseDate(val) {
		if (!val) return null;
		const d = new Date(val);
		return isNaN(d.getTime()) ? null : d;
	}

	function formatFull(d) {
		return d.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'long' });
	}

	function relative(d) {
		const diff = now - d.getTime();
		const abs = Math.abs(diff);
		const future = diff < 0;
		if (abs < 60000) return 'just now';
		if (abs < 3600000) { const m = Math.floor(abs / 60000); return `${m}m ${future ? 'from now' : 'ago'}`; }
		if (abs < 86400000) { const h = Math.floor(abs / 3600000); return `${h}h ${future ? 'from now' : 'ago'}`; }
		const days = Math.floor(abs / 86400000);
		return `${days}d ${future ? 'from now' : 'ago'}`;
	}

	function useNow() {
		unixInput = String(Math.floor(now / 1000));
	}
</script>

<div class="ts-tool">
	<div class="ts-current">
		<span class="ts-current-label">Now</span>
		<code class="ts-current-value">{Math.floor(now / 1000)}</code>
		<button class="btn" type="button" on:click={useNow}>Use</button>
	</div>

	<div class="ts-group">
		<span class="ts-label">Unix → Date</span>
		<input class="input ts-mono" type="text" placeholder="1716000000" bind:value={unixInput} />
		{#if fromUnix}
			<div class="ts-result">
				<span>{formatFull(fromUnix)}</span>
				<span class="ts-rel">{relative(fromUnix)}</span>
			</div>
		{/if}
	</div>

	<div class="ts-group">
		<span class="ts-label">Date → Unix</span>
		<input class="input" type="datetime-local" bind:value={dateInput} />
		{#if fromDate}
			<div class="ts-result">
				<code>{Math.floor(fromDate.getTime() / 1000)}</code>
				<span class="ts-rel">ms: {fromDate.getTime()}</span>
			</div>
		{/if}
	</div>
</div>

<style>
	.ts-tool { display: flex; flex-direction: column; gap: var(--space-4); }
	.ts-current { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); }
	.ts-current-label { font-size: var(--fs-xs); color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }
	.ts-current-value { font-size: var(--fs-md); color: var(--accent); font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace; }
	.ts-group { display: flex; flex-direction: column; gap: 0.4rem; }
	.ts-label { font-size: var(--fs-xs); color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
	.ts-mono { font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace; }
	.ts-result { padding: var(--space-2) var(--space-3); background: color-mix(in srgb, var(--accent) 8%, var(--panel)); border: 1px solid var(--border); border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 0.2rem; }
	.ts-result code { font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace; color: var(--accent); font-weight: 600; }
	.ts-result span { font-size: var(--fs-sm); color: var(--text); }
	.ts-rel { color: var(--muted) !important; font-size: var(--fs-xs) !important; }
	.input { max-width: 300px; }
</style>
