<script>
	import { onMount, tick } from 'svelte';
	import { bindColoris } from '../lib/coloris.js';

	export let value = '';
	export let onChange = () => {};

	let inputEl;
	let valid = true;
	const inputId = `coloris-${Math.random().toString(36).slice(2, 9)}`;

	onMount(async () => {
		await tick();
		await bindColoris(`#${inputId}`);
	});

	function handleInput(event) {
		const next = event.target.value.trim();
		const isPartial = !next || /^#?[0-9a-fA-F]{0,6}$/.test(next);

		valid = isPartial;

		if (!isPartial) {
			return;
		}

		const normalized = !next ? '' : next.startsWith('#') ? next : `#${next}`;

		value = normalized;

		if (!normalized || /^#[0-9a-fA-F]{6}$/i.test(normalized)) {
			onChange(normalized);
		}
	}

	function handleColorisPick(event) {
		if (event?.target !== inputEl) {
			return;
		}

		const next = String(inputEl.value || '').trim();

		valid = true;
		value = next;
		onChange(next);
	}

	function openPicker() {
		if (!inputEl) {
			return;
		}

		inputEl.focus();
		inputEl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
	}

	function clear() {
		value = '';
		valid = true;
		onChange('');

		if (inputEl) {
			inputEl.value = '';
			inputEl.dispatchEvent(new Event('input', { bubbles: true }));
		}
	}

	$: hexPreview = /^#[0-9a-fA-F]{6}$/i.test(value) ? value : null;
</script>

<svelte:window on:coloris:pick={handleColorisPick} />

<div class="color-filter" class:invalid={!valid}>
	<button type="button" class="swatch" on:click={openPicker} aria-label="Pick color">
		<span class="swatch-fill" style:background={hexPreview || 'transparent'} aria-hidden="true"></span>
	</button>
	<input
		bind:this={inputEl}
		type="text"
		class="coloris-input"
		id={inputId}
		placeholder="Filter by hex"
		value={value || ''}
		on:input={handleInput}
		spellcheck="false"
		maxlength="7"
		data-coloris
	/>
	{#if value}
		<button type="button" class="clear" on:click={clear} aria-label="Clear color filter">×</button>
	{/if}
</div>

<style>
	.color-filter {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 6px 10px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		background: var(--bg);
	}

	.color-filter.invalid {
		border-color: #ff8e74;
	}

	.swatch {
		width: 18px;
		height: 18px;
		padding: 0;
		border-radius: var(--radius-pill);
		border: 1px solid var(--border);
		background: transparent;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}

	.swatch-fill {
		width: 100%;
		height: 100%;
		border-radius: var(--radius-pill);
		background: transparent;
	}

	input {
		background: transparent;
		border: none;
		outline: none;
		color: var(--text);
		font-size: var(--fs-sm);
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		width: 110px;
	}

	.clear {
		background: none;
		border: none;
		color: var(--muted);
		font-size: 1rem;
		cursor: pointer;
		line-height: 1;
		padding: 0 2px;
	}

	.clear:hover {
		color: var(--text);
	}

	:global(.color-filter .clr-field) {
		display: contents !important;
	}

	:global(.color-filter .clr-field button) {
		display: none !important;
	}

	:global(.color-filter .clr-field input) {
		padding-right: 0 !important;
	}

	:global(.clr-picker) {
		--clr-color-1: var(--accent);
	}

	:global(.clr-picker.clr-pill) {
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-md);
		color: var(--text);
	}

	:global(.clr-picker) :global(.clr-field) input {
		background: var(--bg);
		color: var(--text);
		border: 1px solid var(--border);
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
	}

	:global(.clr-picker .clr-swatches button) {
		border: 1px solid var(--border);
	}

	:global(.clr-picker button.clr-close),
	:global(.clr-picker button.clr-clear) {
		color: var(--text);
		background: var(--bg);
		border: 1px solid var(--border);
	}

	:global(.clr-picker button.clr-close:hover),
	:global(.clr-picker button.clr-clear:hover) {
		border-color: var(--accent);
		color: var(--accent);
	}

	:global(.clr-marker) {
		border-color: var(--accent);
	}
</style>
