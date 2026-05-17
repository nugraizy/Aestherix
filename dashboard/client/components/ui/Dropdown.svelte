<script>
	import { createEventDispatcher, onDestroy, tick } from 'svelte';

	export let value = '';
	export let options = [];
	export let placeholder = 'Select...';
	export let label = '';
	export let disabled = false;
	export let size = 'md';
	export let align = 'left';

	const dispatch = createEventDispatcher();
	const EDGE = 8;

	let open = false;
	let triggerEl;
	let menuEl;
	let highlight = -1;
	let menuPos = { top: 0, left: 0, width: 0 };

	$: normalized = options.map((option) => {
		if (option == null) {
			return null;
		}

		if (typeof option === 'string' || typeof option === 'number') {
			return { value: option, label: String(option) };
		}

		return {
			value: option.value,
			label: option.label ?? String(option.value),
			description: option.description || '',
			disabled: Boolean(option.disabled)
		};
	}).filter(Boolean);

	$: selected = normalized.find((option) => option.value === value) || null;

	function portal(node) {
		document.body.appendChild(node);

		return {
			destroy() {
				node.remove();
			}
		};
	}

	function reposition() {
		if (!triggerEl || !menuEl) {
			return;
		}

		const tr = triggerEl.getBoundingClientRect();
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const width = Math.max(tr.width, 160);
		let top = tr.bottom + 6;
		let left = align === 'right' ? tr.right - width : tr.left;
		const menuHeight = menuEl.offsetHeight;

		if (top + menuHeight > vh - EDGE) {
			top = Math.max(EDGE, tr.top - menuHeight - 6);
		}

		left = Math.max(EDGE, Math.min(left, vw - width - EDGE));

		menuPos = { top, left, width };
	}

	async function toggleOpen() {
		if (disabled) {
			return;
		}

		if (open) {
			close();
			return;
		}

		open = true;
		highlight = Math.max(0, normalized.findIndex((option) => option.value === value));
		await tick();
		reposition();
	}

	function close() {
		open = false;
		highlight = -1;
	}

	function pick(option) {
		if (option.disabled) {
			return;
		}

		dispatch('change', option.value);
		close();
	}

	function handleKey(event) {
		if (!open) {
			if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
				event.preventDefault();
				toggleOpen();
			}
			return;
		}

		if (event.key === 'Escape') {
			event.preventDefault();
			close();
			triggerEl?.focus();
			return;
		}

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			highlight = Math.min(normalized.length - 1, highlight + 1);
			return;
		}

		if (event.key === 'ArrowUp') {
			event.preventDefault();
			highlight = Math.max(0, highlight - 1);
			return;
		}

		if (event.key === 'Home') {
			event.preventDefault();
			highlight = 0;
			return;
		}

		if (event.key === 'End') {
			event.preventDefault();
			highlight = normalized.length - 1;
			return;
		}

		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();

			const option = normalized[highlight];

			if (option) {
				pick(option);
			}
		}
	}

	function handleOutside(event) {
		if (!open) {
			return;
		}

		if (triggerEl?.contains(event.target) || menuEl?.contains(event.target)) {
			return;
		}

		close();
	}

	function handleViewport() {
		if (open) {
			reposition();
		}
	}

	if (typeof window !== 'undefined') {
		window.addEventListener('mousedown', handleOutside);
		onDestroy(() => window.removeEventListener('mousedown', handleOutside));
	}
</script>

<svelte:window on:scroll={handleViewport} on:resize={handleViewport} />

<div class="dropdown size-{size}" class:open class:disabled>
	{#if label}
		<span class="label">{label}</span>
	{/if}
	<button
		type="button"
		class="trigger"
		bind:this={triggerEl}
		on:click={toggleOpen}
		on:keydown={handleKey}
		aria-haspopup="listbox"
		aria-expanded={open}
		{disabled}
	>
		<span class="trigger-text" class:placeholder={!selected}>
			{selected ? selected.label : placeholder}
		</span>
		<span class="chevron" aria-hidden="true" class:open>
			<i class="nf nf-fa-chevron_down"></i>
		</span>
	</button>
</div>

{#if open}
	<div
		use:portal
		bind:this={menuEl}
		class="app-dropdown-menu size-{size}"
		role="listbox"
		tabindex="-1"
		style:top="{menuPos.top}px"
		style:left="{menuPos.left}px"
		style:min-width="{menuPos.width}px"
	>
		{#each normalized as option, i (option.value)}
			<button
				type="button"
				class="app-dropdown-option"
				class:selected={option.value === value}
				class:highlight={highlight === i}
				class:disabled={option.disabled}
				role="option"
				aria-selected={option.value === value}
				on:mouseenter={() => (highlight = i)}
				on:click={() => pick(option)}
			>
				<span class="app-dropdown-option-label">{option.label}</span>
				{#if option.description}
					<span class="app-dropdown-option-desc">{option.description}</span>
				{/if}
			</button>
		{/each}
		{#if !normalized.length}
			<p class="app-dropdown-option empty">No options.</p>
		{/if}
	</div>
{/if}

<style>
	.dropdown {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		min-width: 0;
	}

	.dropdown.size-sm .trigger {
		padding: 0.3rem 0.55rem;
		font-size: var(--fs-xs);
	}

	.dropdown.size-lg .trigger {
		padding: 0.55rem 0.85rem;
		font-size: var(--fs-md);
	}

	.label {
		font-size: var(--fs-xs);
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.trigger {
		display: inline-flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.45rem;
		min-width: 110px;
		padding: 0.42rem 0.75rem;
		background: var(--bg);
		color: var(--text);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: var(--fs-sm);
		font-weight: 500;
		cursor: pointer;
		text-align: left;
		transition: border-color var(--tx-base), color var(--tx-base);
	}

	.trigger:hover:not(:disabled) {
		border-color: color-mix(in srgb, var(--accent) 50%, var(--border));
	}

	.dropdown.open .trigger {
		border-color: var(--accent);
	}

	.trigger:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.trigger-text {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-transform: capitalize;
	}

	.trigger-text.placeholder {
		color: var(--muted);
	}

	.chevron {
		font-size: 0.7rem;
		color: var(--muted);
		transition: transform var(--tx-base);
	}

	.chevron.open {
		transform: rotate(180deg);
	}

	:global(.app-dropdown-menu) {
		position: fixed;
		max-height: 280px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 0.35rem;
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-md);
		z-index: 9000;
		opacity: 0;
		animation: app-dropdown-fade 0.14s ease-out forwards;
	}

	@keyframes app-dropdown-fade {
		to {
			opacity: 1;
		}
	}

	:global(.app-dropdown-option) {
		display: flex;
		flex-direction: column;
		text-align: left;
		gap: 0.15rem;
		padding: 0.45rem 0.6rem;
		background: transparent;
		border: none;
		color: var(--text);
		font-size: var(--fs-sm);
		font-weight: 500;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: background var(--tx-fast), color var(--tx-fast);
		text-transform: capitalize;
	}

	:global(.app-dropdown-option.highlight) {
		background: color-mix(in srgb, var(--accent) 16%, transparent);
	}

	:global(.app-dropdown-option.selected) {
		background: color-mix(in srgb, var(--accent) 22%, transparent);
		color: var(--accent);
	}

	:global(.app-dropdown-option.disabled) {
		opacity: 0.5;
		cursor: not-allowed;
	}

	:global(.app-dropdown-option-desc) {
		font-size: var(--fs-xs);
		color: var(--muted);
		text-transform: none;
	}

	:global(.app-dropdown-option.empty) {
		color: var(--muted);
		font-size: var(--fs-xs);
		padding: 0.6rem 0.7rem;
		cursor: default;
	}
</style>
