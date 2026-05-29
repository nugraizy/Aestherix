<script>
	import { createEventDispatcher } from 'svelte';

	export let value = 0;
	export let min = 0;
	export let max = 100;
	export let step = 1;
	export let disabled = false;
	export let readonly = false;
	export let playing = false;

	const dispatch = createEventDispatcher();

	let el;
	let dragging = false;

	$: clamped = Math.min(max, Math.max(min, value));
	$: pct = max > min ? (clamped - min) / (max - min) : 0;
	$: interactive = !disabled && !readonly;

	function setFromClientX(clientX) {
		const rect = el.getBoundingClientRect();
		let p = rect.width ? (clientX - rect.left) / rect.width : 0;

		p = Math.min(1, Math.max(0, p));

		let next = min + p * (max - min);

		if (step) next = Math.round(next / step) * step;

		next = Math.min(max, Math.max(min, next));

		if (next !== value) {
			value = next;
			dispatch('input', value);
		}
	}

	function onPointerDown(event) {
		if (!interactive) return;
		dragging = true;
		el.setPointerCapture?.(event.pointerId);
		setFromClientX(event.clientX);
	}

	function onPointerMove(event) {
		if (dragging) setFromClientX(event.clientX);
	}

	function onPointerUp() {
		if (!dragging) return;
		dragging = false;
		dispatch('change', value);
	}

	function onKey(event) {
		if (!interactive) return;

		if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
			event.preventDefault();
			value = Math.max(min, value - step);
		} else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
			event.preventDefault();
			value = Math.min(max, value + step);
		} else {
			return;
		}

		dispatch('input', value);
		dispatch('change', value);
	}
</script>

<div
	class="slider"
	class:animate={playing}
	class:disabled
	class:interactive
	style:--value={pct}
	bind:this={el}
	role="slider"
	aria-valuemin={min}
	aria-valuemax={max}
	aria-valuenow={clamped}
	aria-disabled={disabled}
	tabindex={interactive ? 0 : -1}
	on:pointerdown={onPointerDown}
	on:pointermove={onPointerMove}
	on:pointerup={onPointerUp}
	on:keydown={onKey}
>
	<span class="slider__before"></span>
	<span class="slider__thumb"></span>
	<span class="slider__after"></span>
</div>

<style>
	.slider {
		--slider-foreground: var(--accent);
		--slider-opacity: 0.5;
		--slider-weight: 0.45rem;
		display: flex;
		height: var(--slider-weight);
		width: 100%;
		align-items: center;
		touch-action: none;
		outline: none;
	}

	.slider.interactive {
		cursor: pointer;
	}

	.slider.interactive:active {
		cursor: grabbing;
	}

	.slider.disabled {
		opacity: 0.5;
		pointer-events: none;
	}

	.slider__before,
	.slider__after {
		display: block;
	}

	.slider__before {
		flex-basis: calc(100% * var(--value));
		height: calc(100% * 0.4);
		border-radius: 2rem 0 0 2rem;
		background-color: var(--slider-foreground);
	}

	.slider.animate .slider__before {
		height: 100%;
		-webkit-mask: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjI1IiB2aWV3Qm94PSIwIDAgMTAwIDI1IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8ZyBjbGlwLXBhdGg9InVybCgjY2xpcDBfMV81OCkiPgo8cGF0aCBkPSJNLTEwMCAyOEwtNzUgMTNDLTU5LjYxMiAzLjc2NzE5IC00MC4zODggMy43NjcyIC0yNSAxM1YxM0MtOS42MTIgMjIuMjMyOCA5LjYxMiAyMi4yMzI4IDI1IDEzVjEzQzQwLjM4OCAzLjc2NzIgNTkuNjEyIDMuNzY3MiA3NSAxM1YxM0M5MC4zODggMjIuMjMyOCAxMDkuNjEyIDIyLjIzMjggMTI1IDEzVjEzQzE0MC4zODggMy43NjcyIDE1OS42MTIgMy43NjcyIDE3NSAxM0wyMDAgMjgiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMTAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L2c+CjxkZWZzPgo8Y2xpcFBhdGggaWQ9ImNsaXAwXzFfNTgiPgo8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjI1IiBmaWxsPSJ3aGl0ZSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPgo=");
		mask: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjI1IiB2aWV3Qm94PSIwIDAgMTAwIDI1IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8ZyBjbGlwLXBhdGg9InVybCgjY2xpcDBfMV81OCkiPgo8cGF0aCBkPSJNLTEwMCAyOEwtNzUgMTNDLTU5LjYxMiAzLjc2NzE5IC00MC4zODggMy43NjcyIC0yNSAxM1YxM0MtOS42MTIgMjIuMjMyOCA5LjYxMiAyMi4yMzI4IDI1IDEzVjEzQzQwLjM4OCAzLjc2NzIgNTkuNjEyIDMuNzY3MiA3NSAxM1YxM0M5MC4zODggMjIuMjMyOCAxMDkuNjEyIDIyLjIzMjggMTI1IDEzVjEzQzE0MC4zODggMy43NjcyIDE1OS42MTIgMy43NjcyIDE3NSAxM0wyMDAgMjgiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMTAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L2c+CjxkZWZzPgo8Y2xpcFBhdGggaWQ9ImNsaXAwXzFfNTgiPgo8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjI1IiBmaWxsPSJ3aGl0ZSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPgo=");
		-webkit-mask-size: calc(var(--slider-weight) * 4) 100%;
		mask-size: calc(var(--slider-weight) * 4) 100%;
		-webkit-mask-repeat: repeat-x;
		mask-repeat: repeat-x;
		animation: scrollBackground 2s linear infinite;
	}

	.slider:not(.interactive) .slider__before,
	.slider:not(.interactive) .slider__after {
		transition: flex-basis 0.25s linear, height 0.25s ease;
	}

	.slider__thumb {
		height: calc(var(--slider-weight) * 2.5);
		width: calc(var(--slider-weight) * 0.75);
		background: var(--slider-foreground);
		border-radius: 1rem;
		flex-shrink: 0;
		transition: transform 0.12s ease;
	}

	.slider.interactive:hover .slider__thumb,
	.slider.interactive:focus-visible .slider__thumb {
		transform: scale(1.1);
	}

	.slider__after {
		background: var(--muted);
		height: calc(100% * 0.4);
		opacity: var(--slider-opacity);
		flex-basis: calc(100% * (1 - var(--value)));
		border-radius: 0 2rem 2rem 0;
	}

	.slider:focus-visible {
		outline: none;
	}

	@keyframes scrollBackground {
		from {
			-webkit-mask-position: 0 0;
			mask-position: 0 0;
		}
		to {
			-webkit-mask-position: calc(var(--slider-weight) * -4) 0;
			mask-position: calc(var(--slider-weight) * -4) 0;
		}
	}
</style>
