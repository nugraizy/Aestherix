<script>
	import { onDestroy } from 'svelte';
	import { showSuccess } from '../../lib/toast.js';

	let unixInput = '';
	let dateInput = '';
	let now = Date.now();

	const timer = setInterval(() => { now = Date.now(); }, 1000);
	onDestroy(() => clearInterval(timer));

	$: fromUnix = parseUnix(unixInput);
	$: fromDate = parseDate(dateInput);
	$: nowDate = new Date(now);

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

	function formatISO(d) {
		return d.toISOString();
	}

	function formatUTC(d) {
		return d.toUTCString();
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

	function pad(n) { return String(n).padStart(2, '0'); }

	function useNow() {
		unixInput = String(Math.floor(now / 1000));
	}

	function copyValue(text) {
		navigator.clipboard.writeText(text).then(() => showSuccess('Copied!'));
	}
</script>

<div class="ts-tool">
	<div class="ts-layout">
		<div class="ts-left">
			<div class="ts-live">
				<div class="ts-live-clock">
					<span class="ts-time">{pad(nowDate.getHours())}:{pad(nowDate.getMinutes())}<span class="ts-seconds">:{pad(nowDate.getSeconds())}</span></span>
					<span class="ts-date">{nowDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
				</div>
				<div class="ts-live-values">
					<button class="ts-live-val" type="button" on:click={() => copyValue(String(Math.floor(now / 1000)))}>
						<span class="ts-live-label">Unix</span>
						<code>{Math.floor(now / 1000)}</code>
						<span class="ts-copy"><i class="nf nf-md-content_copy"></i></span>
					</button>
					<button class="ts-live-val" type="button" on:click={() => copyValue(String(now))}>
						<span class="ts-live-label">ms</span>
						<code>{now}</code>
						<span class="ts-copy"><i class="nf nf-md-content_copy"></i></span>
					</button>
					<button class="ts-live-val" type="button" on:click={() => copyValue(nowDate.toISOString())}>
						<span class="ts-live-label">ISO</span>
						<code>{nowDate.toISOString()}</code>
						<span class="ts-copy"><i class="nf nf-md-content_copy"></i></span>
					</button>
				</div>
			</div>

			<div class="ts-section">
				<span class="ts-label">Unix &rarr; Date</span>
				<div class="ts-input-row">
					<input class="input ts-mono" type="text" placeholder="1716000000" bind:value={unixInput} />
					<button class="ts-now-btn" type="button" on:click={useNow}>Now</button>
				</div>
				{#if fromUnix}
					<div class="ts-results">
						<div class="ts-result-row">
							<span class="ts-result-label">Local</span>
							<span class="ts-result-value">{formatFull(fromUnix)}</span>
						</div>
						<div class="ts-result-row">
							<span class="ts-result-label">ISO</span>
							<code class="ts-result-code">{formatISO(fromUnix)}</code>
						</div>
						<div class="ts-result-row">
							<span class="ts-result-label">UTC</span>
							<code class="ts-result-code">{formatUTC(fromUnix)}</code>
						</div>
						<div class="ts-result-row">
							<span class="ts-result-label">Relative</span>
							<span class="ts-result-value accent">{relative(fromUnix)}</span>
						</div>
						<div class="ts-result-row">
							<span class="ts-result-label">Milliseconds</span>
							<code class="ts-result-code">{fromUnix.getTime()}</code>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<div class="ts-right">
			<div class="ts-section">
				<span class="ts-label">Date &rarr; Unix</span>
				<input class="input" type="datetime-local" bind:value={dateInput} />
				{#if fromDate}
					<div class="ts-results">
						<button class="ts-result-row clickable" type="button" on:click={() => copyValue(String(Math.floor(fromDate.getTime() / 1000)))}>
							<span class="ts-result-label">Unix</span>
							<code class="ts-result-code">{Math.floor(fromDate.getTime() / 1000)}</code>
							<span class="ts-copy"><i class="nf nf-md-content_copy"></i></span>
						</button>
						<button class="ts-result-row clickable" type="button" on:click={() => copyValue(String(fromDate.getTime()))}>
							<span class="ts-result-label">Milliseconds</span>
							<code class="ts-result-code">{fromDate.getTime()}</code>
							<span class="ts-copy"><i class="nf nf-md-content_copy"></i></span>
						</button>
						<button class="ts-result-row clickable" type="button" on:click={() => copyValue(fromDate.toISOString())}>
							<span class="ts-result-label">ISO</span>
							<code class="ts-result-code">{formatISO(fromDate)}</code>
							<span class="ts-copy"><i class="nf nf-md-content_copy"></i></span>
						</button>
						<div class="ts-result-row">
							<span class="ts-result-label">Relative</span>
							<span class="ts-result-value accent">{relative(fromDate)}</span>
						</div>
					</div>
				{/if}
			</div>

			<div class="ts-section">
				<span class="ts-label">Quick Reference</span>
				<div class="ts-ref-grid">
					{#each [
						{ label: 'Second', ms: 1000 },
						{ label: 'Minute', ms: 60000 },
						{ label: 'Hour', ms: 3600000 },
						{ label: 'Day', ms: 86400000 },
						{ label: 'Week', ms: 604800000 },
						{ label: 'Month (30d)', ms: 2592000000 },
						{ label: 'Year (365d)', ms: 31536000000 }
					] as ref (ref.label)}
						<div class="ts-ref-row">
							<span class="ts-ref-label">{ref.label}</span>
							<code class="ts-ref-val">{ref.ms.toLocaleString()} ms</code>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.ts-tool { display: flex; flex-direction: column; gap: var(--space-3); }
	.ts-layout { display: flex; gap: var(--space-4); align-items: flex-start; }
	.ts-left { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: var(--space-3); }
	.ts-right { min-width: 240px; display: flex; flex-direction: column; gap: var(--space-3); }
	.ts-section { display: flex; flex-direction: column; gap: 0.5rem; }
	.ts-label { font-size: var(--fs-xs); font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }
	.ts-input-row { display: flex; gap: var(--space-2); }
	.ts-input-row .input { flex: 1; }
	.ts-mono { font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace; }
	.ts-now-btn {
		padding: 0 0.7rem; border: 1px solid var(--border); border-radius: var(--radius-sm);
		background: var(--panel); color: var(--muted); font-size: var(--fs-xs); font-weight: 600;
		cursor: pointer; transition: all var(--tx-fast); white-space: nowrap;
	}
	.ts-now-btn:hover { border-color: var(--accent); color: var(--accent); }

	.ts-live {
		display: flex; flex-direction: column; gap: var(--space-3);
		padding: var(--space-4); background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-md);
	}
	.ts-live-clock { display: flex; flex-direction: column; gap: 0.2rem; }
	.ts-time {
		font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 2.2rem; font-weight: 700;
		color: var(--text); line-height: 1;
	}
	.ts-seconds { color: var(--accent); font-size: 1.4rem; }
	.ts-date { font-size: var(--fs-sm); color: var(--muted); }
	.ts-live-values { display: flex; flex-direction: column; gap: 0.25rem; }
	.ts-live-val {
		display: flex; align-items: center; gap: var(--space-2); padding: 0.35rem 0.5rem;
		border: 1px solid var(--border); border-radius: var(--radius-sm); background: transparent;
		cursor: pointer; text-align: left; transition: all var(--tx-fast);
	}
	.ts-live-val:hover { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 6%, transparent); }
	.ts-live-label { font-size: var(--fs-xs); font-weight: 700; color: var(--muted); text-transform: uppercase; min-width: 2.8rem; }
	.ts-live-val code { flex: 1; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: var(--fs-xs); color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.ts-copy { font-size: 0.65rem; color: var(--muted); opacity: 0; transition: opacity var(--tx-fast); }
	.ts-live-val:hover .ts-copy { opacity: 1; }

	.ts-results { display: flex; flex-direction: column; gap: 0.25rem; }
	.ts-result-row {
		display: flex; align-items: center; gap: var(--space-2); padding: 0.4rem 0.55rem;
		border: 1px solid var(--border); border-radius: var(--radius-sm); background: transparent;
		transition: all var(--tx-fast);
	}
	.ts-result-row.clickable { cursor: pointer; }
	.ts-result-row.clickable:hover { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 6%, transparent); }
	.ts-result-label { font-size: var(--fs-xs); font-weight: 700; color: var(--muted); text-transform: uppercase; min-width: 5rem; flex-shrink: 0; }
	.ts-result-value { font-size: var(--fs-sm); color: var(--text); }
	.ts-result-value.accent { color: var(--accent); font-weight: 600; }
	.ts-result-code { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: var(--fs-xs); color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.ts-result-row .ts-copy { opacity: 0; }
	.ts-result-row.clickable:hover .ts-copy { opacity: 1; }

	.ts-ref-grid { display: flex; flex-direction: column; gap: 1px; }
	.ts-ref-row {
		display: flex; align-items: center; justify-content: space-between; padding: 0.35rem 0.55rem;
		border: 1px solid var(--border); border-radius: var(--radius-sm);
	}
	.ts-ref-label { font-size: var(--fs-xs); color: var(--text); font-weight: 500; }
	.ts-ref-val { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: var(--fs-xs); color: var(--accent); }

	.input { max-width: 300px; }

	@media (max-width: 640px) {
		.ts-layout { flex-direction: column; }
		.ts-right { min-width: unset; width: 100%; }
		.input { max-width: 100%; }
	}
</style>
