<script>
	import { createEventDispatcher } from 'svelte';

	export let checked = false;
	export let disabled = false;
	export let readonly = false;
	export let size = 'md';
	export let label = '';
	export let id = '';

	const dispatch = createEventDispatcher();

	function handleToggle() {
		if (disabled || readonly) {
			return;
		}

		const next = !checked;

		dispatch('change', next);
	}

	function handleKey(event) {
		if (disabled || readonly) {
			return;
		}

		if (event.key === ' ' || event.key === 'Enter') {
			event.preventDefault();
			handleToggle();
		}
	}
</script>

<button
	type="button"
	class="toggle size-{size}"
	class:on={checked}
	class:off={!checked}
	class:disabled
	role="switch"
	aria-checked={checked}
	aria-label={label || (checked ? 'Enabled' : 'Disabled')}
	{disabled}
	{id}
	on:click={handleToggle}
	on:keydown={handleKey}
>
	<span class="track" aria-hidden="true">
		<span class="thumb"></span>
	</span>
</button>

<style>
	.toggle {
		--track-w: 38px;
		--track-h: 22px;
		--thumb-size: 18px;
		--track-pad: 2px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		padding: 11px;
		margin: -11px;
		cursor: pointer;
		outline: none;
	}

	@media (hover: hover) and (pointer: fine) {
		.toggle {
			padding: 0;
			margin: 0;
		}
	}

	.toggle.size-sm {
		--track-w: 30px;
		--track-h: 18px;
		--thumb-size: 14px;
	}

	.toggle.size-lg {
		--track-w: 46px;
		--track-h: 26px;
		--thumb-size: 22px;
	}

	.track {
		position: relative;
		display: inline-block;
		width: var(--track-w);
		height: var(--track-h);
		border-radius: 999px;
		background: color-mix(in srgb, var(--muted) 35%, transparent);
		transition: background var(--tx-base);
	}

	.toggle.on .track {
		background: var(--accent);
	}

	.thumb {
		position: absolute;
		top: var(--track-pad);
		left: var(--track-pad);
		width: var(--thumb-size);
		height: var(--thumb-size);
		border-radius: 50%;
		background: #fff;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.32);
		transition: transform var(--tx-base);
	}

	.toggle.on .thumb {
		transform: translateX(calc(var(--track-w) - var(--thumb-size) - 2 * var(--track-pad)));
	}

	.toggle:focus-visible .track {
		box-shadow: var(--ring);
	}

	.toggle.disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.toggle:hover:not(.disabled) .track {
		filter: brightness(1.06);
	}
</style>
