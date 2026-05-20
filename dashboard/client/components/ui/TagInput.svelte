<script>
	import { createEventDispatcher } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	export let tags = [];
	export let placeholder = '';
	export let disabled = false;
	export let validator = null;
	export let normalizer = null;
	export let id = '';

	const dispatch = createEventDispatcher();

	let inputValue = '';
	let invalid = false;

	function commit() {
		const raw = inputValue.trim();

		if (!raw) {
			return;
		}

		const value = typeof normalizer === 'function' ? normalizer(raw) : raw;

		if (!value) {
			invalid = true;
			return;
		}

		if (typeof validator === 'function' && !validator(value)) {
			invalid = true;
			return;
		}

		if (tags.includes(value)) {
			inputValue = '';
			invalid = false;
			return;
		}

		dispatch('change', [...tags, value]);
		inputValue = '';
		invalid = false;
	}

	function remove(index) {
		if (disabled) {
			return;
		}

		dispatch('change', tags.filter((_, current) => current !== index));
	}

	function handleKey(event) {
		if (event.key === 'Enter' || event.key === ',') {
			event.preventDefault();
			commit();
			return;
		}

		if (invalid) {
			invalid = false;
		}
	}

	function handleBlur() {
		if (inputValue.trim()) {
			commit();
		}
	}
</script>

<div class="tag-input" class:disabled class:invalid>
	{#if tags.length > 0}
		<div class="tags">
			{#each tags as tag, index (tag + index)}
				<span
					class="tag"
					transition:fly={{ y: -4, duration: 140, easing: cubicOut }}
				>
					<span class="tag-value">{tag}</span>
					{#if !disabled}
						<button
							type="button"
							class="tag-remove"
							aria-label="Remove {tag}"
							on:click|stopPropagation={() => remove(index)}
						>
							×
						</button>
					{/if}
				</span>
			{/each}
		</div>
	{/if}
	<input
		class="input"
		type="text"
		bind:value={inputValue}
		placeholder={tags.length === 0 ? placeholder : 'Add another, press Enter...'}
		{disabled}
		{id}
		on:keydown={handleKey}
		on:blur={handleBlur}
	/>
</div>

<style>
	.tag-input {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		pointer-events: none;
	}

	.tag {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.18rem 0.55rem 0.18rem 0.7rem;
		border-radius: var(--radius-pill);
		border: 1px solid color-mix(in srgb, var(--accent) 40%, var(--border));
		background: transparent;
		color: var(--text);
		font-size: var(--fs-sm);
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		pointer-events: auto;
	}

	.tag-value {
		line-height: 1.2;
	}

	.tag-remove {
		background: transparent;
		border: none;
		color: var(--muted);
		font-size: 1rem;
		line-height: 1;
		width: 20px;
		height: 20px;
		display: inline-grid;
		place-items: center;
		cursor: pointer;
		border-radius: 50%;
		transition: color var(--tx-base), background var(--tx-base);
	}

	.tag-remove:hover {
		color: #ff8e74;
		background: rgba(255, 142, 116, 0.18);
	}

	.tag-input.invalid .input {
		border-color: #ff8e74;
	}

	.tag-input.disabled .tag-remove {
		display: none;
	}
</style>
