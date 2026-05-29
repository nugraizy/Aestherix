<script>
	let expression = '';
	let result = '';
	let error = '';
	let history = [];

	function evaluate() {
		if (!expression.trim()) return;

		error = '';
		result = '';

		try {
			const sanitized = expression
				.replace(/[^0-9+\-*/().%^, ]/g, '')
				.replace(/\^/g, '**');

			const value = Function(`"use strict"; return (${sanitized})`)();

			if (typeof value !== 'number' || !Number.isFinite(value)) {
				throw new Error('Invalid result');
			}

			result = String(value % 1 === 0 ? value : Number(value.toPrecision(12)));
			history = [{ expr: expression, result }, ...history.slice(0, 9)];
		} catch {
			error = 'Invalid expression';
		}
	}

	function clear() {
		expression = '';
		result = '';
		error = '';
	}

	function useResult(r) {
		expression = r;
		result = '';
		error = '';
	}

	function handleKey(event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			evaluate();
		}
	}
</script>

<div class="calc">
	<div class="input-row">
		<input
			class="input expr"
			type="text"
			placeholder="e.g. (12 + 8) * 3.5"
			bind:value={expression}
			on:keydown={handleKey}
		/>
		<button class="btn primary" type="button" on:click={evaluate}>=</button>
		<button class="btn" type="button" on:click={clear}>C</button>
	</div>

	{#if result}
		<div class="result" on:click={() => useResult(result)} role="button" tabindex="0" on:keydown={(e) => e.key === 'Enter' && useResult(result)}>
			<span class="result-label">Result</span>
			<span class="result-value">{result}</span>
		</div>
	{/if}

	{#if error}
		<p class="error">{error}</p>
	{/if}

	{#if history.length}
		<div class="history">
			<span class="history-label">History</span>
			{#each history as item, i (i)}
				<button class="history-row" type="button" on:click={() => useResult(item.result)}>
					<span class="history-expr">{item.expr}</span>
					<span class="history-res">= {item.result}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.calc {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.input-row {
		display: flex;
		gap: var(--space-2);
	}

	.expr {
		flex: 1;
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		max-width: none;
	}

	.result {
		padding: var(--space-3);
		background: color-mix(in srgb, var(--accent) 10%, var(--panel));
		border: 1px solid color-mix(in srgb, var(--accent) 30%, var(--border));
		border-radius: var(--radius-sm);
		cursor: pointer;
		display: flex;
		align-items: baseline;
		gap: var(--space-3);
	}

	.result:hover {
		border-color: var(--accent);
	}

	.result-label {
		font-size: var(--fs-xs);
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.result-value {
		font-size: var(--fs-xl);
		font-weight: 700;
		color: var(--accent);
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
	}

	.error {
		margin: 0;
		color: #ff8e74;
		font-size: var(--fs-sm);
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
</style>
