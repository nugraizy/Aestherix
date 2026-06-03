<script>
	import { afterUpdate } from 'svelte';

	const TABS = [
		{ id: 'basic', label: 'Basic', icon: 'nf-md-calculator' },
		{ id: 'scientific', label: 'Scientific', icon: 'nf-md-flask' },
		{ id: 'percentage', label: 'Percentage', icon: 'nf-md-percent' },
		{ id: 'tip', label: 'Tip', icon: 'nf-md-account_cash' }
	];

	let activeTab = 'basic';
	let expression = '';
	let displayValue = '0';
	let result = '';
	let error = '';
	let history = [];
	let parenOpen = 0;
	let lastWasResult = false;

	let pctMode = 'of';
	let pctA = '';
	let pctB = '';
	let pctResult = '';

	let tipBill = '';
	let tipPercent = '15';
	let tipSplit = '1';
	let tipResult = null;

	$: updateDisplay(expression);

	function updateDisplay(expr) {
		if (!expr) {
			displayValue = '0';
			return;
		}

		displayValue = formatExpression(expr);
	}

	function formatExpression(expr) {
		return expr
			.replace(/\*/g, ' \u00D7 ')
			.replace(/\//g, ' \u00F7 ')
			.replace(/\+/g, ' + ')
			.replace(/(^|[^e])-/g, '$1 - ')
			.replace(/\bMath\.PI\b/g, '\u03C0')
			.replace(/\bMath\.E\b/g, 'e')
			.replace(/\bMath\.sqrt\b/g, '\u221A')
			.replace(/\bMath\.cbrt\b/g, '\u221B')
			.replace(/\bMath\.pow\(([^,]+),\s*2\)/g, '$1\u00B2')
			.replace(/\bMath\.pow\(([^,]+),\s*3\)/g, '$1\u00B3')
			.replace(/\bMath\.sin\b/g, 'sin')
			.replace(/\bMath\.cos\b/g, 'cos')
			.replace(/\bMath\.tan\b/g, 'tan')
			.replace(/\bMath\.log10\b/g, 'log')
			.replace(/\bMath\.log\b/g, 'ln')
			.replace(/\bMath\.abs\b/g, '|x|')
			.replace(/\bMath\.floor\b/g, 'floor')
			.replace(/\bMath\.ceil\b/g, 'ceil')
			.replace(/\bMath\.round\b/g, 'round')
			.replace(/\*\*/g, '^');
	}

	function formatNumber(value, maxDecimals = 10) {
		if (typeof value !== 'number' || !Number.isFinite(value)) return String(value);

		const str = Number(value.toPrecision(12)).toString();
		const num = parseFloat(str);

		if (Number.isInteger(num) && Math.abs(num) < 1e15) {
			return num.toLocaleString('en-US');
		}

		const fixed = num.toFixed(Math.min(maxDecimals, 10));
		const parts = fixed.split('.');
		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

		return parts.join('.');
	}

	function append(val) {
		if (lastWasResult && /[0-9.]/.test(val)) {
			expression = '';
			result = '';
		}

		lastWasResult = false;
		error = '';

		if (val === '(') parenOpen++;
		if (val === ')' && parenOpen > 0) parenOpen--;

		expression += val;
	}

	function appendFn(fn) {
		if (lastWasResult) {
			expression = '';
			result = '';
		}

		lastWasResult = false;
		error = '';

		if (fn === 'Math.pow(') {
			expression += 'Math.pow(';
			parenOpen++;
		} else if (fn === 'negate') {
			if (!expression) return;
			const match = expression.match(/(-?\d+\.?\d*)$/);
			if (match) {
				const num = match[1];
				const start = expression.slice(0, -num.length);
				expression = start + (num.startsWith('-') ? num.slice(1) : `-${num}`);
			}
		} else {
			expression += fn + '(';
			parenOpen++;
		}
	}

	function backspace() {
		if (!expression) return;

		if (expression.endsWith('Math.') || expression.endsWith('Math.pow(')) {
			const m = expression.match(/Math\.\w+\(?$/);
			if (m) {
				expression = expression.slice(0, -m[0].length);
				if (m[0].includes('(')) parenOpen--;
				return;
			}
		}

		const last = expression[expression.length - 1];
		if (last === '(') parenOpen--;
		if (last === ')') parenOpen++;

		expression = expression.slice(0, -1);
	}

	function clearAll() {
		expression = '';
		result = '';
		error = '';
		parenOpen = 0;
		lastWasResult = false;
	}

	function evaluate() {
		if (!expression.trim()) return;

		error = '';
		result = '';

		try {
			let balanced = expression;
			while (parenOpen > 0) {
				balanced += ')';
				parenOpen--;
			}

			const sanitized = balanced
				.replace(/[^0-9+\-*/().%^,e ]/g, '')
				.replace(/\^/g, '**');

			const value = Function(`"use strict"; return (${sanitized})`)();

			if (typeof value !== 'number' || !Number.isFinite(value)) {
				throw new Error('Invalid result');
			}

			result = formatNumber(value);
			history = [{ expr: formatExpression(balanced), result }, ...history.slice(0, 9)];
			lastWasResult = true;
			expression = String(value);
		} catch {
			error = 'Invalid expression';
		}
	}

	function useHistory(r) {
		expression = r.replace(/,/g, '');
		result = '';
		error = '';
		lastWasResult = false;
	}

	function handleKey(event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			evaluate();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			clearAll();
		} else if (event.key === 'Backspace') {
			event.preventDefault();
			backspace();
		}
	}

	function calculatePct() {
		const a = parseFloat(pctA);
		const b = parseFloat(pctB);

		if (isNaN(a) || isNaN(b)) {
			pctResult = '';
			return;
		}

		let val;

		if (pctMode === 'of') val = (a / 100) * b;
		else if (pctMode === 'change') val = ((b - a) / Math.abs(a)) * 100;
		else if (pctMode === 'increase') val = a * (1 + b / 100);
		else if (pctMode === 'decrease') val = a * (1 - b / 100);
		else if (pctMode === 'what') val = (b / a) * 100;

		pctResult = typeof val === 'number' && Number.isFinite(val)
			? formatNumber(val, 4)
			: 'N/A';
	}

	function calculateTip() {
		const bill = parseFloat(tipBill);
		const pct = parseFloat(tipPercent);
		const split = parseInt(tipSplit, 10);

		if (isNaN(bill) || isNaN(pct) || isNaN(split) || split < 1) {
			tipResult = null;
			return;
		}

		const tipAmt = bill * (pct / 100);
		const total = bill + tipAmt;
		const perPerson = total / split;

		tipResult = {
			tip: formatNumber(tipAmt, 2),
			total: formatNumber(total, 2),
			perPerson: formatNumber(perPerson, 2)
		};
	}

	$: pctA, pctB, pctMode, calculatePct();
	$: tipBill, tipPercent, tipSplit, calculateTip();
</script>

<svelte:window on:keydown={handleKey} />

<div class="calc">
	<div class="calc-tabs">
		{#each TABS as tab (tab.id)}
			<button
				class="calc-tab"
				class:active={activeTab === tab.id}
				type="button"
				on:click={() => (activeTab = tab.id)}
			>
				<i class="nf {tab.icon}"></i>
				<span>{tab.label}</span>
			</button>
		{/each}
	</div>

	{#if activeTab === 'basic' || activeTab === 'scientific'}
		<div class="calc-body">
			<div class="display">
				<div class="display-expr" class:error>{displayValue}</div>
				{#if result}
					<div class="display-result">= {result}</div>
				{/if}
				{#if error}
					<div class="display-error">{error}</div>
				{/if}
			</div>

			{#if activeTab === 'scientific'}
				<div class="sci-row">
					<button class="btn-fn" type="button" on:click={() => appendFn('Math.sin')}>sin</button>
					<button class="btn-fn" type="button" on:click={() => appendFn('Math.cos')}>cos</button>
					<button class="btn-fn" type="button" on:click={() => appendFn('Math.tan')}>tan</button>
					<button class="btn-fn" type="button" on:click={() => appendFn('Math.log10')}>log</button>
					<button class="btn-fn" type="button" on:click={() => appendFn('Math.log')}>ln</button>
				</div>
				<div class="sci-row">
					<button class="btn-fn" type="button" on:click={() => appendFn('Math.sqrt')}>
						<i class="nf nf-md-square_root"></i>
					</button>
					<button class="btn-fn" type="button" on:click={() => append('Math.pow(')}>
						x<sup>y</sup>
					</button>
					<button class="btn-fn" type="button" on:click={() => appendFn('Math.pow(')}>x&sup2;</button>
					<button class="btn-fn" type="button" on:click={() => append('Math.PI')}>&pi;</button>
					<button class="btn-fn" type="button" on:click={() => append('Math.E')}>e</button>
				</div>
				<div class="sci-row">
					<button class="btn-fn" type="button" on:click={() => appendFn('Math.abs')}>|x|</button>
					<button class="btn-fn" type="button" on:click={() => appendFn('Math.floor')}>floor</button>
					<button class="btn-fn" type="button" on:click={() => appendFn('Math.ceil')}>ceil</button>
					<button class="btn-fn" type="button" on:click={() => appendFn('Math.round')}>round</button>
					<button class="btn-fn" type="button" on:click={() => appendFn('negate')}>+/-</button>
				</div>
			{/if}

			<div class="keypad">
				<button class="btn-action" type="button" on:click={clearAll}>AC</button>
				<button class="btn-action" type="button" on:click={backspace}>
					<i class="nf nf-md-backspace_outline"></i>
				</button>
				<button class="btn-op" type="button" on:click={() => append('(')}>(</button>
				<button class="btn-op" type="button" on:click={() => append(')')}>)</button>

				<button class="btn-num" type="button" on:click={() => append('7')}>7</button>
				<button class="btn-num" type="button" on:click={() => append('8')}>8</button>
				<button class="btn-num" type="button" on:click={() => append('9')}>9</button>
				<button class="btn-op" type="button" on:click={() => append('/')}>
					<i class="nf nf-md-division"></i>
				</button>

				<button class="btn-num" type="button" on:click={() => append('4')}>4</button>
				<button class="btn-num" type="button" on:click={() => append('5')}>5</button>
				<button class="btn-num" type="button" on:click={() => append('6')}>6</button>
				<button class="btn-op" type="button" on:click={() => append('*')}>
					<i class="nf nf-md-multiplication"></i>
				</button>

				<button class="btn-num" type="button" on:click={() => append('1')}>1</button>
				<button class="btn-num" type="button" on:click={() => append('2')}>2</button>
				<button class="btn-num" type="button" on:click={() => append('3')}>3</button>
				<button class="btn-op" type="button" on:click={() => append('-')}>
					<i class="nf nf-md-minus"></i>
				</button>

				<button class="btn-num" type="button" on:click={() => append('0')}>0</button>
				<button class="btn-num" type="button" on:click={() => append('.')}>.</button>
				<button class="btn-eval" type="button" on:click={evaluate}>=</button>
				<button class="btn-op" type="button" on:click={() => append('+')}>
					<i class="nf nf-md-plus"></i>
				</button>
			</div>

			{#if history.length}
				<div class="history">
					<span class="history-label">History</span>
					{#each history as item, i (i)}
						<button class="history-row" type="button" on:click={() => useHistory(item.result)}>
							<span class="history-expr">{item.expr}</span>
							<span class="history-res">= {item.result}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>

	{:else if activeTab === 'percentage'}
		<div class="calc-body">
			<div class="pct-tabs">
				{#each [
					{ id: 'of', label: '% of' },
					{ id: 'change', label: '% Change' },
					{ id: 'increase', label: 'Increase' },
					{ id: 'decrease', label: 'Decrease' },
					{ id: 'what', label: 'What %' }
				] as m (m.id)}
					<button
						class="pct-tab"
						class:active={pctMode === m.id}
						type="button"
						on:click={() => (pctMode = m.id)}
					>
						{m.label}
					</button>
				{/each}
			</div>

			<div class="pct-form">
				{#if pctMode === 'of'}
					<label class="field">
						<span class="field-label">Percentage (%)</span>
						<input class="input mono" type="number" placeholder="25" bind:value={pctA} />
					</label>
					<label class="field">
						<span class="field-label">Of value</span>
						<input class="input mono" type="number" placeholder="200" bind:value={pctB} />
					</label>
				{:else if pctMode === 'change'}
					<label class="field">
						<span class="field-label">Original value</span>
						<input class="input mono" type="number" placeholder="100" bind:value={pctA} />
					</label>
					<label class="field">
						<span class="field-label">New value</span>
						<input class="input mono" type="number" placeholder="150" bind:value={pctB} />
					</label>
				{:else if pctMode === 'increase' || pctMode === 'decrease'}
					<label class="field">
						<span class="field-label">Original value</span>
						<input class="input mono" type="number" placeholder="100" bind:value={pctA} />
					</label>
					<label class="field">
						<span class="field-label">{pctMode === 'increase' ? 'Increase' : 'Decrease'} by (%)</span>
						<input class="input mono" type="number" placeholder="20" bind:value={pctB} />
					</label>
				{:else if pctMode === 'what'}
					<label class="field">
						<span class="field-label">is what % of</span>
						<input class="input mono" type="number" placeholder="50" bind:value={pctA} />
					</label>
					<label class="field">
						<span class="field-label">Total value</span>
						<input class="input mono" type="number" placeholder="200" bind:value={pctB} />
					</label>
				{/if}
			</div>

			{#if pctResult}
				<div class="pct-result">
					<span class="pct-result-label">
						{#if pctMode === 'of'}Result{:else if pctMode === 'change'}% Change{:else if pctMode === 'what'}Percentage{:else}New Value{/if}
					</span>
					<span class="pct-result-value">
						{pctResult}{pctMode === 'change' || pctMode === 'what' ? '%' : ''}
					</span>
				</div>
			{/if}
		</div>

	{:else if activeTab === 'tip'}
		<div class="calc-body">
			<div class="tip-form">
				<label class="field">
					<span class="field-label">Bill Amount</span>
					<input class="input mono" type="number" min="0" step="0.01" placeholder="0.00" bind:value={tipBill} />
				</label>

				<div class="tip-pct-row">
					<span class="field-label">Tip %</span>
					<div class="tip-pct-btns">
						{#each [10, 15, 18, 20, 25] as pct (pct)}
							<button
								class="tip-pct-btn"
								class:active={tipPercent === String(pct)}
								type="button"
								on:click={() => (tipPercent = String(pct))}
							>
								{pct}%
							</button>
						{/each}
						<input class="input mono tip-custom" type="number" min="0" placeholder="Custom" bind:value={tipPercent} />
					</div>
				</div>

				<label class="field">
					<span class="field-label">Split between</span>
					<div class="split-control">
						<button class="split-btn" type="button" on:click={() => { const v = parseInt(tipSplit, 10); if (v > 1) tipSplit = String(v - 1); }}>
							<i class="nf nf-md-minus"></i>
						</button>
						<span class="split-value">{tipSplit}</span>
						<button class="split-btn" type="button" on:click={() => { const v = parseInt(tipSplit, 10); tipSplit = String(v + 1); }}>
							<i class="nf nf-md-plus"></i>
						</button>
						<span class="split-label">{parseInt(tipSplit, 10) === 1 ? 'person' : 'people'}</span>
					</div>
				</label>
			</div>

			{#if tipResult}
				<div class="tip-results">
					<div class="tip-card">
						<span class="tip-card-label">Tip</span>
						<span class="tip-card-value">${tipResult.tip}</span>
					</div>
					<div class="tip-card primary">
						<span class="tip-card-label">Total</span>
						<span class="tip-card-value">${tipResult.total}</span>
					</div>
					{#if parseInt(tipSplit, 10) > 1}
						<div class="tip-card">
							<span class="tip-card-label">Per Person</span>
							<span class="tip-card-value">${tipResult.perPerson}</span>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.calc {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.calc-tabs {
		display: flex;
		gap: 0.25rem;
		padding: 0.25rem;
		border-radius: var(--radius-pill);
		background: var(--bg);
		border: 1px solid var(--border);
	}

	.calc-tab {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.4rem 0.7rem;
		border: none;
		border-radius: var(--radius-pill);
		background: transparent;
		color: var(--muted);
		font-size: var(--fs-xs);
		font-weight: 600;
		cursor: pointer;
		transition: all var(--tx-fast);
		white-space: nowrap;
	}

	.calc-tab:hover:not(.active) {
		color: var(--text);
	}

	.calc-tab.active {
		background: color-mix(in srgb, var(--accent) 22%, transparent);
		color: var(--accent);
	}

	.calc-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.display {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: var(--space-3) var(--space-4);
		min-height: 4rem;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		align-items: flex-end;
		gap: 0.2rem;
		overflow-x: auto;
	}

	.display-expr {
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		font-size: var(--fs-xl);
		font-weight: 600;
		color: var(--text);
		word-break: break-all;
		text-align: right;
		line-height: 1.3;
	}

	.display-expr.error {
		color: #ff8e74;
	}

	.display-result {
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		font-size: var(--fs-sm);
		color: var(--accent);
		font-weight: 600;
	}

	.display-error {
		font-size: var(--fs-xs);
		color: #ff8e74;
	}

	.sci-row {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 4px;
	}

	.btn-fn {
		padding: 0.45rem 0.2rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--accent) 8%, var(--bg));
		color: var(--accent);
		font-size: var(--fs-xs);
		font-weight: 600;
		cursor: pointer;
		transition: all var(--tx-fast);
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
	}

	.btn-fn:hover {
		background: color-mix(in srgb, var(--accent) 16%, var(--bg));
		border-color: var(--accent);
	}

	.btn-fn sup {
		font-size: 0.65em;
	}

	.keypad {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 5px;
	}

	.keypad button {
		padding: 0.7rem 0.4rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: var(--fs-md);
		font-weight: 600;
		cursor: pointer;
		transition: all var(--tx-fast);
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 2.8rem;
	}

	.btn-num {
		background: var(--panel);
		color: var(--text);
	}

	.btn-num:hover {
		border-color: color-mix(in srgb, var(--accent) 40%, var(--border));
	}

	.btn-op {
		background: color-mix(in srgb, var(--accent) 10%, var(--bg));
		color: var(--accent);
	}

	.btn-op:hover {
		background: color-mix(in srgb, var(--accent) 20%, var(--bg));
		border-color: var(--accent);
	}

	.btn-action {
		background: color-mix(in srgb, #ff8e74 12%, var(--bg));
		color: #ff8e74;
		border-color: color-mix(in srgb, #ff8e74 20%, var(--border));
	}

	.btn-action:hover {
		background: color-mix(in srgb, #ff8e74 22%, var(--bg));
	}

	.btn-eval {
		background: var(--accent);
		color: var(--bg);
		border-color: var(--accent);
		font-size: var(--fs-lg);
	}

	.btn-eval:hover {
		filter: brightness(1.1);
	}

	.history {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.history-label {
		font-size: var(--fs-xs);
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 0.2rem;
	}

	.history-row {
		display: flex;
		justify-content: space-between;
		gap: var(--space-2);
		padding: 0.3rem 0.5rem;
		border-radius: var(--radius-sm);
		background: transparent;
		border: none;
		color: var(--text);
		font-size: var(--fs-sm);
		cursor: pointer;
		text-align: left;
		transition: background var(--tx-base);
	}

	.history-row:hover {
		background: color-mix(in srgb, var(--accent) 8%, transparent);
	}

	.history-expr {
		color: var(--muted);
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
	}

	.history-res {
		color: var(--accent);
		font-weight: 600;
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
	}

	.pct-tabs {
		display: flex;
		gap: 0.25rem;
		padding: 0.25rem;
		border-radius: var(--radius-pill);
		background: var(--bg);
		border: 1px solid var(--border);
		overflow-x: auto;
	}

	.pct-tab {
		padding: 0.35rem 0.6rem;
		border: none;
		border-radius: var(--radius-pill);
		background: transparent;
		color: var(--muted);
		font-size: var(--fs-xs);
		font-weight: 600;
		cursor: pointer;
		transition: all var(--tx-fast);
		white-space: nowrap;
	}

	.pct-tab:hover:not(.active) {
		color: var(--text);
	}

	.pct-tab.active {
		background: color-mix(in srgb, var(--accent) 22%, transparent);
		color: var(--accent);
	}

	.pct-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.field-label {
		font-size: var(--fs-xs);
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 600;
	}

	.mono {
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		-moz-appearance: textfield;
	}

	.mono::-webkit-inner-spin-button,
	.mono::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.pct-result {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		padding: var(--space-3) var(--space-4);
		background: color-mix(in srgb, var(--accent) 8%, var(--bg));
		border: 1px solid color-mix(in srgb, var(--accent) 25%, var(--border));
		border-radius: var(--radius-sm);
	}

	.pct-result-label {
		font-size: var(--fs-xs);
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.pct-result-value {
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		font-size: var(--fs-xl);
		font-weight: 700;
		color: var(--accent);
	}

	.tip-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.tip-pct-row {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.tip-pct-btns {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
	}

	.tip-pct-btn {
		flex: 1;
		min-width: 48px;
		padding: 0.45rem 0.3rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--panel);
		color: var(--text);
		font-size: var(--fs-xs);
		font-weight: 600;
		cursor: pointer;
		transition: all var(--tx-fast);
	}

	.tip-pct-btn:hover:not(.active) {
		border-color: color-mix(in srgb, var(--accent) 50%, var(--border));
	}

	.tip-pct-btn.active {
		background: color-mix(in srgb, var(--accent) 20%, transparent);
		border-color: var(--accent);
		color: var(--accent);
	}

	.tip-custom {
		flex: 1;
		min-width: 60px;
		max-width: 80px;
		font-size: var(--fs-xs);
	}

	.split-control {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.split-btn {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--border);
		border-radius: 50%;
		background: var(--panel);
		color: var(--text);
		cursor: pointer;
		font-size: 0.8rem;
		transition: all var(--tx-fast);
	}

	.split-btn:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.split-value {
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		font-size: var(--fs-lg);
		font-weight: 700;
		min-width: 2rem;
		text-align: center;
	}

	.split-label {
		font-size: var(--fs-sm);
		color: var(--muted);
	}

	.tip-results {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: var(--space-2);
	}

	.tip-card {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: var(--space-3);
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		text-align: center;
	}

	.tip-card.primary {
		background: color-mix(in srgb, var(--accent) 8%, var(--bg));
		border-color: color-mix(in srgb, var(--accent) 25%, var(--border));
	}

	.tip-card-label {
		font-size: var(--fs-xs);
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.tip-card-value {
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		font-size: var(--fs-xl);
		font-weight: 700;
		color: var(--text);
	}

	.tip-card.primary .tip-card-value {
		color: var(--accent);
	}
</style>
