<script context="module">
	let activeHide = null;

	function takeOver(hideFn) {
		if (activeHide && activeHide !== hideFn) {
			activeHide();
		}

		activeHide = hideFn;
	}

	function release(hideFn) {
		if (activeHide === hideFn) {
			activeHide = null;
		}
	}
</script>

<script>
	import { onDestroy, tick } from 'svelte';
	import { backOut, cubicOut } from 'svelte/easing';
	import { scale } from 'svelte/transition';

	export let text = '';
	export let html = '';
	export let placement = 'top';
	export let delay = 200;
	export let follow = true;

	const ANCHOR_MARGIN = 10;
	const CURSOR_OFFSET = 16;
	const EDGE = 8;

	let triggerEl;
	let bubbleEl;
	let visible = false;
	let pos = { top: 0, left: 0, place: placement };
	let timer = null;
	let mode = 'cursor';
	let cursorX = 0;
	let cursorY = 0;

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
		if (!text && !html) {
			return;
		}

		clearTimer();
		timer = setTimeout(async () => {
			takeOver(hide);
			visible = true;
			await tick();
			reposition();
		}, delay);
	}

	function showFromMouse(event) {
		cursorX = event.clientX;
		cursorY = event.clientY;
		mode = follow ? 'cursor' : 'anchor';
		show();
	}

	function showFromFocus() {
		mode = 'anchor';
		show();
	}

	function hide() {
		clearTimer();
		visible = false;
		release(hide);
	}

	function handleMouseMove(event) {
		if (mode !== 'cursor') {
			return;
		}

		cursorX = event.clientX;
		cursorY = event.clientY;

		if (visible) {
			reposition();
		}
	}

	function repositionFromCursor(br, vw, vh) {
		let place = placement;
		let top = 0;
		let left = 0;

		if (place === 'top') {
			top = cursorY - br.height - CURSOR_OFFSET;
			left = cursorX - br.width / 2;

			if (top < EDGE) {
				place = 'bottom';
				top = cursorY + CURSOR_OFFSET;
			}
		} else if (place === 'bottom') {
			top = cursorY + CURSOR_OFFSET;
			left = cursorX - br.width / 2;

			if (top + br.height > vh - EDGE) {
				place = 'top';
				top = cursorY - br.height - CURSOR_OFFSET;
			}
		} else if (place === 'left') {
			top = cursorY - br.height / 2;
			left = cursorX - br.width - CURSOR_OFFSET;

			if (left < EDGE) {
				place = 'right';
				left = cursorX + CURSOR_OFFSET;
			}
		} else {
			top = cursorY - br.height / 2;
			left = cursorX + CURSOR_OFFSET;

			if (left + br.width > vw - EDGE) {
				place = 'left';
				left = cursorX - br.width - CURSOR_OFFSET;
			}
		}

		return { top, left, place };
	}

	function repositionFromAnchor(br, vw, vh) {
		if (!triggerEl) {
			return { top: 0, left: 0, place: placement };
		}

		const tr = triggerEl.getBoundingClientRect();
		let place = placement;
		let top = 0;
		let left = 0;

		if (place === 'top') {
			top = tr.top - br.height - ANCHOR_MARGIN;
			left = tr.left + tr.width / 2 - br.width / 2;

			if (top < EDGE) {
				place = 'bottom';
				top = tr.bottom + ANCHOR_MARGIN;
			}
		} else if (place === 'bottom') {
			top = tr.bottom + ANCHOR_MARGIN;
			left = tr.left + tr.width / 2 - br.width / 2;

			if (top + br.height > vh - EDGE) {
				place = 'top';
				top = tr.top - br.height - ANCHOR_MARGIN;
			}
		} else if (place === 'left') {
			top = tr.top + tr.height / 2 - br.height / 2;
			left = tr.left - br.width - ANCHOR_MARGIN;

			if (left < EDGE) {
				place = 'right';
				left = tr.right + ANCHOR_MARGIN;
			}
		} else {
			top = tr.top + tr.height / 2 - br.height / 2;
			left = tr.right + ANCHOR_MARGIN;

			if (left + br.width > vw - EDGE) {
				place = 'left';
				left = tr.left - br.width - ANCHOR_MARGIN;
			}
		}

		return { top, left, place };
	}

	function reposition() {
		if (!bubbleEl) {
			return;
		}

		const br = bubbleEl.getBoundingClientRect();
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const next = mode === 'cursor' ? repositionFromCursor(br, vw, vh) : repositionFromAnchor(br, vw, vh);

		next.left = Math.max(EDGE, Math.min(next.left, vw - br.width - EDGE));
		next.top = Math.max(EDGE, Math.min(next.top, vh - br.height - EDGE));

		pos = next;
	}

	function handleViewport() {
		if (visible) {
			reposition();
		}
	}

	onDestroy(() => {
		clearTimer();
		release(hide);
	});
</script>

<svelte:window on:scroll={handleViewport} on:resize={handleViewport} />

<span
	class="tooltip-host"
	role="presentation"
	bind:this={triggerEl}
	on:mouseenter={showFromMouse}
	on:mousemove={handleMouseMove}
	on:mouseleave={hide}
	on:focusin={showFromFocus}
	on:focusout={hide}
>
	<slot />
</span>

{#if visible && (text || html)}
	<div
		use:portal
		bind:this={bubbleEl}
		class="app-tooltip-bubble place-{pos.place}"
		style:top="{pos.top}px"
		style:left="{pos.left}px"
		in:scale={{ duration: 220, start: 0.55, opacity: 0, easing: backOut }}
		out:scale={{ duration: 130, start: 0.85, opacity: 0, easing: cubicOut }}
		role="tooltip"
	>
		<span class="bubble-text">{#if html}{@html html}{:else}{text}{/if}</span>
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
		background: rgba(10, 14, 20, 0.65);
		backdrop-filter: blur(10px);
		color: var(--text);
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		box-shadow: var(--shadow-md);
		font-size: var(--fs-xs);
		font-weight: 500;
		max-width: 400px;
		pointer-events: none;
		white-space: normal;
		word-break: break-all;
		line-height: 1.4;
		will-change: transform, opacity;
	}

	:global(.app-tooltip-bubble.place-top) {
		transform-origin: 50% 100%;
	}

	:global(.app-tooltip-bubble.place-bottom) {
		transform-origin: 50% 0%;
	}

	:global(.app-tooltip-bubble.place-left) {
		transform-origin: 100% 50%;
	}

	:global(.app-tooltip-bubble.place-right) {
		transform-origin: 0% 50%;
	}

	:global(.app-tooltip-bubble .bubble-text) {
		display: block;
		white-space: pre-line;
	}

	:global(.app-tooltip-bubble mark.hl) {
		background: color-mix(in srgb, var(--accent) 32%, transparent);
		color: var(--accent);
		padding: 0 2px;
		border-radius: 3px;
		font-weight: 700;
	}
</style>
