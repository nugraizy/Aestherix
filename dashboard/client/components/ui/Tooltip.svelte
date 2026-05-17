<script>
	import { onDestroy, tick } from 'svelte';

	export let text = '';
	export let placement = 'top';
	export let delay = 200;

	const MARGIN = 10;
	const EDGE = 8;

	let triggerEl;
	let bubbleEl;
	let visible = false;
	let pos = { top: 0, left: 0, place: placement };
	let timer = null;

	function portal(node) {
		document.body.appendChild(node);

		return {
			destroy() {
				node.remove();
			}
		};
	}

	function clearTimer() {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
	}

	async function show() {
		if (!text) {
			return;
		}

		clearTimer();
		timer = setTimeout(async () => {
			visible = true;
			await tick();
			reposition();
		}, delay);
	}

	function hide() {
		clearTimer();
		visible = false;
	}

	function reposition() {
		if (!triggerEl || !bubbleEl) {
			return;
		}

		const tr = triggerEl.getBoundingClientRect();
		const br = bubbleEl.getBoundingClientRect();
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		let place = placement;
		let top = 0;
		let left = 0;

		if (place === 'top') {
			top = tr.top - br.height - MARGIN;
			left = tr.left + tr.width / 2 - br.width / 2;

			if (top < EDGE) {
				place = 'bottom';
				top = tr.bottom + MARGIN;
			}
		} else if (place === 'bottom') {
			top = tr.bottom + MARGIN;
			left = tr.left + tr.width / 2 - br.width / 2;

			if (top + br.height > vh - EDGE) {
				place = 'top';
				top = tr.top - br.height - MARGIN;
			}
		} else if (place === 'left') {
			top = tr.top + tr.height / 2 - br.height / 2;
			left = tr.left - br.width - MARGIN;

			if (left < EDGE) {
				place = 'right';
				left = tr.right + MARGIN;
			}
		} else {
			top = tr.top + tr.height / 2 - br.height / 2;
			left = tr.right + MARGIN;

			if (left + br.width > vw - EDGE) {
				place = 'left';
				left = tr.left - br.width - MARGIN;
			}
		}

		left = Math.max(EDGE, Math.min(left, vw - br.width - EDGE));
		top = Math.max(EDGE, Math.min(top, vh - br.height - EDGE));

		pos = { top, left, place };
	}

	function handleViewport() {
		if (visible) {
			reposition();
		}
	}

	onDestroy(clearTimer);
</script>

<svelte:window on:scroll={handleViewport} on:resize={handleViewport} />

<span
	class="tooltip-host"
	role="presentation"
	bind:this={triggerEl}
	on:mouseenter={show}
	on:mouseleave={hide}
	on:focusin={show}
	on:focusout={hide}
>
	<slot />
</span>

{#if visible && text}
	<div
		use:portal
		bind:this={bubbleEl}
		class="app-tooltip-bubble place-{pos.place}"
		style:top="{pos.top}px"
		style:left="{pos.left}px"
		role="tooltip"
	>
		<span class="bubble-text">{text}</span>
	</div>
{/if}

<style>
	.tooltip-host {
		display: inline-flex;
		align-items: center;
	}

	:global(.app-tooltip-bubble) {
		position: fixed;
		z-index: 10000;
		padding: 0.45rem 0.65rem;
		background: color-mix(in srgb, var(--bg) 88%, #000 24%);
		color: var(--text);
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		box-shadow: var(--shadow-md);
		font-size: var(--fs-xs);
		font-weight: 500;
		max-width: 280px;
		pointer-events: none;
		white-space: normal;
		line-height: 1.4;
		opacity: 0;
		animation: app-tooltip-fade-in 0.14s ease-out forwards;
	}

	:global(.app-tooltip-bubble .bubble-text) {
		display: block;
		white-space: pre-line;
	}

	@keyframes app-tooltip-fade-in {
		to {
			opacity: 1;
		}
	}
</style>
