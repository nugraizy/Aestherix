<script>
	import { createEventDispatcher } from 'svelte';

	export let value = 0;
	export let min = undefined;
	export let max = undefined;
	export let step = 1;
	export let disabled = false;
	export let placeholder = '';
	export let id = '';

	const dispatch = createEventDispatcher();

	function clamp(val) {
		let n = Number(val) || 0;

		if (min !== undefined) {
			n = Math.max(min, n);
		}

		if (max !== undefined) {
			n = Math.min(max, n);
		}

		return n;
	}

	function increment() {
		if (disabled) {
			return;
		}

		value = clamp(Number(value || 0) + Number(step));
		dispatch('change', value);
	}

	function decrement() {
		if (disabled) {
			return;
		}

		value = clamp(Number(value || 0) - Number(step));
		dispatch('change', value);
	}

	function handleInput(event) {
		value = Number(event.target.value) || 0;
		dispatch('change', value);
	}

	function handleBlur() {
		value = clamp(value);
		dispatch('change', value);
	}

	function handleWheel(event) {
		if (disabled) {
			return;
		}

		event.preventDefault();

		const delta = event.deltaY < 0 ? 1 : -1;

		value = clamp(Number(value || 0) + delta * Number(step));
		dispatch('change', value);
	}
</script>

<div
	class="number-input"
	class:disabled
	on:wheel|nonpassive|preventDefault={handleWheel}
>
	<button
		type="button"
		class="spin decrement"
		on:click={decrement}
		{disabled}
		aria-label="Decrease"
		tabindex="-1"
	>
		−
	</button>
	<input
		class="field"
		type="number"
		{value}
		{min}
		{max}
		{step}
		{disabled}
		{placeholder}
		{id}
		on:input={handleInput}
		on:blur={handleBlur}
	/>
	<button
		type="button"
		class="spin increment"
		on:click={increment}
		{disabled}
		aria-label="Increase"
		tabindex="-1"
	>
		+
	</button>
</div>

<style>
	.number-input {
		display: inline-flex;
		align-items: stretch;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		overflow: hidden;
		transition: border-color var(--tx-base);
		width: fit-content;
	}

	.number-input:hover:not(.disabled) {
		border-color: color-mix(in srgb, var(--accent) 50%, var(--border));
	}

	.number-input:focus-within {
		border-color: var(--accent);
	}

	.field {
		background: var(--bg);
		border: none;
		color: var(--text);
		font-size: var(--fs-sm);
		text-align: center;
		width: 3.5rem;
		padding: 0.35rem 0.2rem;
		outline: none;
		font-variant-numeric: tabular-nums;
		-moz-appearance: textfield;
	}

	.field::-webkit-inner-spin-button,
	.field::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.spin {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		background: color-mix(in srgb, var(--bg) 70%, var(--panel));
		border: none;
		color: var(--muted);
		font-size: 1rem;
		font-weight: 700;
		cursor: pointer;
		transition: background var(--tx-base), color var(--tx-base);
		user-select: none;
	}

	.spin:hover:not(:disabled) {
		background: color-mix(in srgb, var(--accent) 16%, var(--bg));
		color: var(--accent);
	}

	.spin:active:not(:disabled) {
		background: color-mix(in srgb, var(--accent) 24%, var(--bg));
	}

	.spin:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.number-input.disabled {
		opacity: 0.55;
	}
</style>
