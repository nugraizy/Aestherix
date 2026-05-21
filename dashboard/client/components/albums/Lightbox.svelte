<script>
	import { createEventDispatcher } from 'svelte';

	export let pictures = [];
	export let activeIndex = 0;
	export let canDelete = false;

	const dispatch = createEventDispatcher();
	let containerEl;

	let velocity = 0;
	let lastWheelTime = 0;
	let inertiaFrame = null;
	let accumulated = 0;
	let showActions = false;

	const FRICTION = 0.82;
	const MIN_VELOCITY = 0.2;
	const STEP_THRESHOLD = 150;
	const WHEEL_BOOST = 0.5;
	const MAX_VELOCITY = 50;

	$: total = pictures.length;
	$: current = pictures[activeIndex] || null;
	$: hasPrev = total > 1;
	$: hasNext = total > 1;

	function close() {
		dispatch('close');
	}

	function next() {
		if (total > 1) {
			activeIndex = (activeIndex + 1) % total;
		}
	}

	function prev() {
		if (total > 1) {
			activeIndex = (activeIndex - 1 + total) % total;
		}
	}

	function selectIndex(index) {
		if (index < 0 || index >= total) {
			return;
		}

		activeIndex = index;
	}

	function handleKey(event) {
		if (event.key === 'Escape') {
			close();
		} else if (event.key === 'ArrowRight') {
			next();
		} else if (event.key === 'ArrowLeft') {
			prev();
		}
	}

	function handleBackdrop(event) {
		if (event.target.closest('.carousel-item, .nav, .image-actions')) {
			return;
		}

		close();
	}

	function handleWheel(event) {
		event.preventDefault();

		if (total <= 1) {
			return;
		}

		const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;

		if (!delta) {
			return;
		}

		const now = performance.now();
		const elapsed = now - lastWheelTime;

		lastWheelTime = now;

		if (elapsed > 200) {
			velocity = 0;
			accumulated = 0;
		}

		velocity += delta * WHEEL_BOOST;
		velocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, velocity));
		accumulated += Math.abs(delta * WHEEL_BOOST);

		if (!inertiaFrame) {
			inertiaFrame = requestAnimationFrame(tickInertia);
		}
	}

	function tickInertia() {
		inertiaFrame = null;

		if (Math.abs(velocity) < MIN_VELOCITY && accumulated < STEP_THRESHOLD) {
			velocity = 0;
			accumulated = 0;
			return;
		}

		if (accumulated >= STEP_THRESHOLD) {
			const direction = velocity > 0 ? 1 : -1;

			activeIndex = (activeIndex + direction + total) % total;
			accumulated = 0;
		}

		velocity *= FRICTION;

		if (Math.abs(velocity) >= MIN_VELOCITY) {
			accumulated += Math.abs(velocity);
			inertiaFrame = requestAnimationFrame(tickInertia);
		} else {
			velocity = 0;
			accumulated = 0;
		}
	}

	const SWIPE_DIST = 48;
	const SWIPE_TIME_FAST = 280;
	const SWIPE_TIME_MAX = 700;
	let touchStartX = 0;
	let touchStartY = 0;
	let touchStartAt = 0;
	let touchActive = false;

	function handleTouchStart(event) {
		if (!event.touches || event.touches.length !== 1) {
			touchActive = false;
			return;
		}

		const touch = event.touches[0];

		if (touch.target.closest('.image-actions, .nav')) {
			touchActive = false;
			return;
		}

		touchStartX = touch.clientX;
		touchStartY = touch.clientY;
		touchStartAt = Date.now();
		touchActive = true;
	}

	function handleTouchMove(event) {
		if (!touchActive || !event.touches || event.touches.length !== 1) {
			return;
		}

		const touch = event.touches[0];
		const deltaX = Math.abs(touch.clientX - touchStartX);
		const deltaY = Math.abs(touch.clientY - touchStartY);

		if (deltaX > deltaY && deltaX > 10) {
			event.preventDefault();
		}
	}

	function handleTouchEnd(event) {
		if (!touchActive) {
			return;
		}

		touchActive = false;

		const touch = event.changedTouches?.[0];

		if (!touch) {
			return;
		}

		const deltaX = touch.clientX - touchStartX;
		const deltaY = touch.clientY - touchStartY;
		const elapsed = Date.now() - touchStartAt;

		if (Math.abs(deltaY) > Math.abs(deltaX)) {
			return;
		}

		if (Math.abs(deltaX) < SWIPE_DIST) {
			return;
		}

		if (elapsed > SWIPE_TIME_MAX) {
			return;
		}

		if (total <= 1) {
			return;
		}

		const fast = elapsed < SWIPE_TIME_FAST;
		const magnitude = Math.abs(deltaX);
		const baseStep = fast ? Math.min(3, Math.ceil(magnitude / 140)) : Math.max(1, Math.floor(magnitude / 180));
		const step = Math.max(1, Math.min(4, baseStep));
		const direction = deltaX < 0 ? 1 : -1;

		activeIndex = (activeIndex + direction * step + total * step) % total;
	}

	function handleItemClick(event, index) {
		if (event.target.closest('[data-action]')) {
			return;
		}

		selectIndex(index);
	}

	function handleItemKey(event, index) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			selectIndex(index);
		}
	}

	function download() {
		if (!current) {
			return;
		}

		dispatch('download', { picture: current });
	}

	function remove() {
		if (!current) {
			return;
		}

		dispatch('delete', { picture: current });
	}

	function toggleActions() {
		showActions = !showActions;
	}

	function getRelativeClass(offset) {
		const abs = Math.abs(offset);

		if (abs === 0) {
			return 'is-center';
		}
		if (abs === 1) {
			return offset > 0 ? 'is-right' : 'is-left';
		}
		if (abs === 2) {
			return offset > 0 ? 'is-far-right' : 'is-far-left';
		}
		return 'is-hidden';
	}

	function getOffset(index) {
		if (total <= 1) {
			return 0;
		}

		const forward = (index - activeIndex + total) % total;
		const backward = forward - total;

		return Math.abs(backward) < Math.abs(forward) ? backward : forward;
	}
</script>

<svelte:window on:keydown={handleKey} />

{#if current}
	<div
		class="lightbox"
		bind:this={containerEl}
		on:click={handleBackdrop}
		on:keydown={handleKey}
		on:wheel|nonpassive|preventDefault={handleWheel}
		on:touchstart|passive={handleTouchStart}
		on:touchmove|nonpassive={handleTouchMove}
		on:touchend={handleTouchEnd}
		on:touchcancel={() => (touchActive = false)}
		role="dialog"
		aria-modal="true"
		aria-label="Image preview"
		tabindex="-1"
	>
		<div class="content">
			<div class="stage">
				{#each pictures as pic, i (pic.url + pic.timestamp)}
					{@const offset = getOffset(i)}
					{#if Math.abs(offset) <= 2}
						<div
							class="carousel-item {getRelativeClass(offset)}"
							role="button"
							tabindex={i === activeIndex ? 0 : -1}
							aria-current={i === activeIndex}
							on:click={(event) => handleItemClick(event, i)}
							on:keydown={(event) => handleItemKey(event, i)}
						>
							<img class="carousel-image" src={pic.url} alt="" />
							{#if i === activeIndex}
								<div class="image-actions" data-action>
									<div class="actions-slider" class:show={showActions}>
										<button
											type="button"
											class="action-btn action-segment"
											data-action="download"
											on:click|stopPropagation={download}
										>
											Download
										</button>
										{#if canDelete}
											<button
												type="button"
												class="action-btn action-segment danger"
												data-action="delete"
												on:click|stopPropagation={remove}
											>
												Delete
											</button>
										{/if}
									</div>
									<button
										type="button"
										class="action-reveal"
										data-action="reveal"
										on:click|stopPropagation={toggleActions}
										aria-label="Toggle actions"
									>
										<span class="reveal-icon">{showActions ? '×' : '⋮'}</span>
									</button>
								</div>
								<div class="image-counter" data-action>
									{activeIndex + 1} / {total}
								</div>
							{/if}
						</div>
					{/if}
				{/each}

				<button class="nav prev" type="button" on:click={prev} disabled={!hasPrev} aria-label="Previous">
					<i class="nf nf-fa-chevron_left" aria-hidden="true"></i>
				</button>
				<button class="nav next" type="button" on:click={next} disabled={!hasNext} aria-label="Next">
					<i class="nf nf-fa-chevron_right" aria-hidden="true"></i>
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.lightbox {
		position: fixed;
		inset: 0;
		display: grid;
		place-items: center;
		padding: 20px;
		z-index: 80;
		background: rgba(2, 8, 11, 0.62);
		backdrop-filter: blur(10px);
		touch-action: none;
		overscroll-behavior: contain;
	}

	.content {
		position: relative;
		display: grid;
		gap: 12px;
		max-width: 96vw;
		max-height: 92vh;
	}

	.stage {
		position: relative;
		width: min(96vw, 1220px);
		min-height: clamp(300px, 70vh, 820px);
		display: grid;
		place-items: center;
	}

	.carousel-item {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		padding: 0;
		border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
		border-radius: 14px;
		overflow: hidden;
		background: rgba(6, 17, 22, 0.4);
		cursor: pointer;
		transition: transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.32s ease, filter 0.32s ease;
	}

	.carousel-item:focus-visible {
		outline: none;
		box-shadow: var(--ring);
	}

	.carousel-item.is-center {
		max-width: min(90vw, 1200px);
		max-height: min(86vh, 900px);
		border-radius: 14px;
		border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
		opacity: 1;
		z-index: 5;
		cursor: default;
		box-shadow: 0 20px 36px rgba(0, 0, 0, 0.4);
	}

	.carousel-item.is-left,
	.carousel-item.is-right {
		max-width: clamp(160px, 16vw, 220px);
		max-height: clamp(190px, 36vh, 320px);
		opacity: 0.86;
		filter: saturate(0.82) brightness(0.85);
		z-index: 4;
	}

	.carousel-item.is-left {
		transform: translate(calc(-50% - clamp(190px, 19vw, 280px)), -50%) scale(0.86);
	}

	.carousel-item.is-right {
		transform: translate(calc(-50% + clamp(190px, 19vw, 280px)), -50%) scale(0.86);
	}

	.carousel-item.is-far-left {
		max-width: clamp(140px, 14vw, 200px);
		max-height: clamp(170px, 32vh, 290px);
		transform: translate(calc(-50% - clamp(245px, 24vw, 360px)), -50%) scale(0.72);
		opacity: 0.5;
		filter: saturate(0.64) brightness(0.68);
		z-index: 3;
	}

	.carousel-item.is-far-right {
		max-width: clamp(140px, 14vw, 200px);
		max-height: clamp(170px, 32vh, 290px);
		transform: translate(calc(-50% + clamp(245px, 24vw, 360px)), -50%) scale(0.72);
		opacity: 0.5;
		filter: saturate(0.64) brightness(0.68);
		z-index: 3;
	}

	.carousel-image {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.image-actions {
		position: absolute;
		top: 12px;
		right: 12px;
		display: inline-flex;
		align-items: center;
		border-radius: var(--radius-pill);
		border: 1px solid rgba(255, 255, 255, 0.22);
		background: rgba(6, 17, 22, 0.65);
		backdrop-filter: blur(10px);
		z-index: 6;
		overflow: hidden;
	}

	.action-reveal {
		background: transparent;
		border: none;
		border-left: 1px solid rgba(255, 255, 255, 0.18);
		color: #fff;
		font-size: 1.2rem;
		font-weight: 600;
		padding: 0.38rem 0.7rem;
		cursor: pointer;
		transition: background var(--tx-base), color var(--tx-base);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.action-reveal:hover {
		background: color-mix(in srgb, var(--accent) 26%, rgba(6, 17, 22, 0.72));
	}

	.reveal-icon {
		display: block;
		line-height: 1;
	}

	.actions-slider {
		display: inline-flex;
		align-items: center;
		max-width: 0;
		opacity: 0;
		overflow: hidden;
		transition: max-width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.25s ease;
	}

	.actions-slider.show {
		max-width: 300px;
		opacity: 1;
	}

	.actions-slider .action-segment:last-child {
		border-right: none;
	}

	.image-counter {
		position: absolute;
		left: 50%;
		bottom: 12px;
		transform: translateX(-50%);
		display: inline-flex;
		overflow: hidden;
		border-radius: var(--radius-pill);
		border: 1px solid rgba(255, 255, 255, 0.28);
		background: rgba(6, 17, 22, 0.7);
		backdrop-filter: blur(10px);
		color: #fff;
		font-size: 0.78rem;
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.02em;
		padding: 0.3rem 0.65rem;
		z-index: 6;
	}

	.action-btn {
		background: transparent;
		border: none;
		color: #fff;
		font-size: 0.78rem;
		font-weight: 600;
		padding: 0.38rem 0.7rem;
		cursor: pointer;
		transition: background var(--tx-base), color var(--tx-base);
	}

	.action-segment + .action-segment {
		border-left: 1px solid rgba(255, 255, 255, 0.18);
	}

	.action-btn:hover {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 26%, rgba(6, 17, 22, 0.72));
	}

	.action-btn.danger {
		color: #ffb1a0;
	}

	.action-btn.danger:hover {
		border-color: #ff8e74;
		background: rgba(255, 142, 116, 0.26);
		color: #fff;
	}

	.nav {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		z-index: 6;
		width: 34px;
		height: 34px;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.18);
		background: rgba(6, 17, 22, 0.42);
		color: rgba(255, 255, 255, 0.6);
		font-size: 1rem;
		line-height: 1;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition: color var(--tx-base), border-color var(--tx-base), background var(--tx-base);
	}

	.nav:hover:not(:disabled) {
		color: rgba(255, 255, 255, 0.92);
		border-color: rgba(255, 255, 255, 0.36);
		background: color-mix(in srgb, var(--accent) 30%, rgba(6, 17, 22, 0.5));
	}

	.nav:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.nav.prev {
		left: 8px;
	}

	.nav.next {
		right: 8px;
	}

</style>
