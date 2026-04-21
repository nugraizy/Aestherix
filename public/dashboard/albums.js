const els = {
	back: document.getElementById('albums-back'),
	shell: document.querySelector('.albums-shell'),
	state: document.getElementById('albums-state'),
	skeleton: document.getElementById('albums-skeleton'),
	grid: document.getElementById('albums-grid'),
	lightbox: document.getElementById('albums-lightbox'),
	lightboxContent: document.querySelector('.albums-lightbox-content'),
	lightboxStage: document.querySelector('.albums-lightbox-stage'),
	lightboxBackdrop: document.getElementById('albums-lightbox-backdrop'),
	lightboxTrack: document.getElementById('albums-lightbox-track'),
	lightboxMeta: document.getElementById('albums-lightbox-meta'),
	lightboxMenu: document.getElementById('albums-lightbox-menu'),
	lightboxMenuToggle: document.getElementById('albums-lightbox-menu-toggle'),
	lightboxMenuPanel: document.getElementById('albums-lightbox-menu-panel'),
	lightboxMenuDownload: document.getElementById('albums-lightbox-menu-download'),
	lightboxMenuDelete: document.getElementById('albums-lightbox-menu-delete')
};

const THEME_STORAGE_KEY = 'aestherix.dashboard.theme';
const THEME_PALETTE_STORAGE_KEY = 'aestherix.dashboard.palette';
const LIGHTBOX_ANIMATION_MS = 220;
const CYCLE_ANIMATION_MS = 180;
const WHEEL_DELTA_PER_IMAGE = 48;
const WHEEL_GESTURE_RESET_MS = 180;
const WHEEL_NAV_LOCK_BASE_MS = 46;
const NEW_CARD_ANIMATION_STAGGER_MS = 34;
const NEW_CARD_ANIMATION_STAGGER_LIMIT = 10;
const IMAGE_PLACEHOLDER_DATA_URI = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
const ZEN_CURSOR_POINTER_CACHE_KEY = 'aestherix.dashboard.cursor.pointer';
const ZEN_CURSOR_ENABLED_CACHE_KEY = 'aestherix.dashboard.cursor.enabled';
const ALBUMS_PICTURES_CACHE_KEY = 'aestherix.dashboard.albums.pictures.cache.v1';
const DASHBOARD_PROFILE_PICTURES_CACHE_KEY = 'aestherix.dashboard.profilePictures.cache.v1';
const ALBUMS_FETCH_TIMEOUT_MS = 12000;
const ALBUMS_IMAGES_LIMIT = 100;
const ALBUMS_DEFERRED_BOOT_DELAY_MS = 120;

let lightboxCloseTimer = null;
let lightboxPictures = [];
let lightboxIndex = -1;
let lightboxCycleTimer = null;
let isOwnerSession = false;
let picturesSignature = '';
let revealObserver = null;
let revealScrollListener = null;
let isScrollingDown = true;
let realtimeSocket = null;
let gridImageObserver = null;
let wheelDeltaAccumulator = 0;
let wheelLastInputAt = 0;
let wheelNavigationLockUntil = 0;
let toastHost = null;
let touchStartX = null;
let touchStartY = null;
let touchLastX = null;
let touchLastY = null;
let touchTrackingActive = false;
let touchSwipeTriggered = false;
const imageLoadQueue = [];
const activeImageLoads = new Set();
const MAX_CONCURRENT_IMAGE_LOADS = 5;
const loadedImageUrls = new Set();
const preloadedLightboxUrls = new Set();

const pumpImageLoadQueue = () => {
	while (activeImageLoads.size < MAX_CONCURRENT_IMAGE_LOADS && imageLoadQueue.length) {
		const nextImage = imageLoadQueue.shift();

		if (!(nextImage instanceof HTMLImageElement) || !nextImage.isConnected) {
			continue;
		}

		if (nextImage.dataset.loading === 'true' || nextImage.dataset.loaded === 'true') {
			continue;
		}

		activeImageLoads.add(nextImage);
		loadDeferredImage(nextImage, {
			eager: nextImage.dataset.queueEager === 'true'
		});
	}
};

const scheduleImageLoad = (imageElement, { eager = false } = {}) => {
	if (!(imageElement instanceof HTMLImageElement)) {
		return;
	}

	if (imageElement.dataset.loaded === 'true' || imageElement.dataset.loading === 'true') {
		return;
	}

	if (!imageLoadQueue.includes(imageElement)) {
		imageElement.dataset.queueEager = eager ? 'true' : 'false';
		imageLoadQueue.push(imageElement);
	}

	pumpImageLoadQueue();
};

const setCarouselScrollLock = (isLocked) => {
	document.documentElement.classList.toggle('albums-scroll-locked', isLocked);
	document.body?.classList.toggle('albums-scroll-locked', isLocked);
};

const persistZenPointerPosition = (x, y) => {
	if (!Number.isFinite(x) || !Number.isFinite(y) || typeof window === 'undefined') {
		return;
	}

	try {
		window.sessionStorage.setItem(
			ZEN_CURSOR_POINTER_CACHE_KEY,
			JSON.stringify({
				x: Math.round(x),
				y: Math.round(y)
			})
		);
	} catch {
		// Ignore storage write errors.
	}
};

const persistZenPointerFromEvent = (event) => {
	if (!event || typeof event.clientX !== 'number' || typeof event.clientY !== 'number') {
		return;
	}

	persistZenPointerPosition(event.clientX, event.clientY);
};

const readCachedZenPointerPosition = () => {
	if (typeof window === 'undefined') {
		return null;
	}

	try {
		const raw = window.sessionStorage.getItem(ZEN_CURSOR_POINTER_CACHE_KEY);

		if (!raw) {
			return null;
		}

		const parsed = JSON.parse(raw);
		const x = Number(parsed?.x);
		const y = Number(parsed?.y);

		if (!Number.isFinite(x) || !Number.isFinite(y)) {
			return null;
		}

		return { x, y };
	} catch {
		return null;
	}
};

const ensureToastHost = () => {
	if (toastHost) {
		return toastHost;
	}

	toastHost = document.createElement('div');
	toastHost.className = 'toast-host';
	document.body.appendChild(toastHost);

	return toastHost;
};

const showToast = (message, type = 'info', duration = 1800) => {
	if (!message) {
		return;
	}

	const host = ensureToastHost();
	const toast = document.createElement('div');
	const textNode = document.createElement('span');

	toast.className = `toast toast-${type}`;
	textNode.className = 'toast-text';
	textNode.textContent = String(message);
	toast.appendChild(textNode);
	host.appendChild(toast);

	requestAnimationFrame(() => {
		toast.classList.add('visible');
	});

	setTimeout(() => {
		toast.classList.remove('visible');
		setTimeout(() => {
			toast.remove();
		}, 220);
	}, Math.max(1200, Number(duration || 1800)));
};

const getPictureFilename = (picture) => {
	const fallbackBase = String(picture?.timestamp || Date.now())
		.replace(/[^a-z0-9_-]+/gi, '_')
		.slice(0, 80);

	if (!picture?.url) {
		return `album-${fallbackBase}.jpg`;
	}

	try {
		const parsedUrl = new URL(String(picture.url));
		const rawName = decodeURIComponent((parsedUrl.pathname || '').split('/').pop() || '').trim();

		if (/^[^\\/:*?"<>|]{1,120}\.[a-z0-9]{2,5}$/i.test(rawName)) {
			return rawName;
		}

		const ext = (rawName.match(/\.([a-z0-9]{2,5})$/i)?.[1] || 'jpg').toLowerCase();

		return `album-${fallbackBase}.${ext}`;
	} catch {
		return `album-${fallbackBase}.jpg`;
	}
};

const closeActionMenu = () => {
	if (els.lightboxMenuPanel) {
		els.lightboxMenuPanel.classList.add('hidden');
	}

	if (els.lightboxMenuToggle) {
		els.lightboxMenuToggle.setAttribute('aria-expanded', 'false');
	}
};

const setActionMenuOwnerState = () => {
	if (!els.lightboxMenuDelete) {
		return;
	}

	els.lightboxMenuDelete.classList.toggle('hidden', !isOwnerSession);
};

const updateActionMenuVisibility = () => {
	if (!els.lightboxMenu) {
		return;
	}

	const shouldShow = !els.lightbox?.classList.contains('hidden') && Boolean(getCurrentLightboxPicture());

	els.lightboxMenu.classList.toggle('hidden', !shouldShow);
	setActionMenuOwnerState();
};

const loadDeferredImage = (imageElement, { eager = false } = {}) => {
	if (!(imageElement instanceof HTMLImageElement)) {
		activeImageLoads.delete(imageElement);
		pumpImageLoadQueue();
		return;
	}

	const currentSrc = String(imageElement.getAttribute('src') || '').trim();
	const sourceUrl = String(imageElement.dataset.src || currentSrc || '').trim();

	if (!sourceUrl || sourceUrl === IMAGE_PLACEHOLDER_DATA_URI) {
		activeImageLoads.delete(imageElement);
		pumpImageLoadQueue();
		return;
	}

	if (imageElement.dataset.loaded === 'true' || imageElement.dataset.loading === 'true') {
		activeImageLoads.delete(imageElement);
		pumpImageLoadQueue();
		return;
	}

	const maxRetries = 1;
	const retryCount = Number.parseInt(imageElement.dataset.retryCount || '0', 10) || 0;
	let loadSettled = false;
	let stallTimerId = null;

	imageElement.loading = eager ? 'eager' : 'lazy';
	imageElement.fetchPriority = eager ? 'high' : 'low';
	imageElement.dataset.loading = 'true';

	const clearStallTimer = () => {
		if (stallTimerId !== null) {
			window.clearTimeout(stallTimerId);
			stallTimerId = null;
		}
	};

	const cleanupListeners = () => {
		imageElement.removeEventListener('load', handleLoad);
		imageElement.removeEventListener('error', handleError);
		clearStallTimer();
	};

	const finalizeLoadedState = () => {
		if (loadSettled) {
			return;
		}

		loadSettled = true;
		cleanupListeners();
		imageElement.classList.remove('is-lazy');
		imageElement.classList.remove('is-load-error');
		imageElement.classList.add('is-loaded');
		imageElement.dataset.loaded = 'true';
		delete imageElement.dataset.loading;
		delete imageElement.dataset.retryCount;
		delete imageElement.dataset.queueEager;
		loadedImageUrls.add(sourceUrl);
		activeImageLoads.delete(imageElement);
		pumpImageLoadQueue();
	};

	const markErrorState = () => {
		if (loadSettled) {
			return;
		}

		loadSettled = true;
		cleanupListeners();
		imageElement.classList.remove('is-lazy');
		imageElement.classList.remove('is-loaded');
		imageElement.classList.add('is-load-error');
		imageElement.dataset.loaded = 'error';
		delete imageElement.dataset.loading;
		delete imageElement.dataset.queueEager;
		activeImageLoads.delete(imageElement);
		pumpImageLoadQueue();
	};

	const retryLoad = () => {
		if (retryCount >= maxRetries) {
			markErrorState();
			return;
		}

		cleanupListeners();
		imageElement.dataset.retryCount = String(retryCount + 1);
		delete imageElement.dataset.loading;
		delete imageElement.dataset.loaded;
		imageElement.classList.add('is-lazy');
		imageElement.classList.remove('is-load-error');

		window.setTimeout(() => {
			if (!imageElement.isConnected) {
				activeImageLoads.delete(imageElement);
				pumpImageLoadQueue();
				return;
			}

			imageElement.src = IMAGE_PLACEHOLDER_DATA_URI;
			activeImageLoads.delete(imageElement);
			scheduleImageLoad(imageElement, { eager });
		}, 120);
	};

	const handleError = () => {
		if (loadSettled) {
			return;
		}

		retryLoad();
	};

	const handleLoad = () => {
		if (loadSettled) {
			return;
		}

		if (!imageElement.naturalWidth || !imageElement.naturalHeight) {
			handleError();
			return;
		}

		finalizeLoadedState();
	};

	const startStallTimer = () => {
		clearStallTimer();
		stallTimerId = window.setTimeout(() => {
			handleError();
		}, 10000);
	};

	imageElement.addEventListener('load', handleLoad, { once: true });
	imageElement.addEventListener('error', handleError, { once: true });
	startStallTimer();

	if (imageElement.src !== sourceUrl) {
		imageElement.src = sourceUrl;
	}

	if (loadedImageUrls.has(sourceUrl) && imageElement.complete) {
		handleLoad();
		return;
	}

	if (imageElement.complete) {
		if (imageElement.naturalWidth > 0 && imageElement.naturalHeight > 0) {
			handleLoad();
		} else {
			handleError();
		}
	}
};

const setupGridLazyLoading = () => {
	if (!els.grid) {
		return;
	}

	if (gridImageObserver) {
		gridImageObserver.disconnect();
		gridImageObserver = null;
	}

	const images = Array.from(els.grid.querySelectorAll('.album-image'));

	if (!images.length) {
		return;
	}

	if (typeof IntersectionObserver !== 'function') {
		images.forEach((imageElement, index) => {
			scheduleImageLoad(imageElement, { eager: index < 4 });
		});
		return;
	}

	gridImageObserver = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) {
					continue;
				}

				scheduleImageLoad(entry.target, { eager: false });
				gridImageObserver?.unobserve(entry.target);
			}
		},
		{
			threshold: 0.01,
			rootMargin: '180px 0px 220px 0px'
		}
	);

	images.forEach((imageElement, index) => {
		if (index < 4) {
			scheduleImageLoad(imageElement, { eager: true });
			return;
		}

		gridImageObserver?.observe(imageElement);
	});
};

const preloadLightboxImage = (url) => {
	const normalizedUrl = String(url || '').trim();

	if (!/^https?:\/\//i.test(normalizedUrl)) {
		return;
	}

	if (preloadedLightboxUrls.has(normalizedUrl)) {
		return;
	}

	preloadedLightboxUrls.add(normalizedUrl);

	const preloadImage = new Image();

	preloadImage.decoding = 'async';
	preloadImage.referrerPolicy = 'no-referrer';
	preloadImage.src = normalizedUrl;
};

const warmLightboxNeighbors = (centerIndex, total) => {
	if (!total) {
		return;
	}

	for (const offset of [-2, -1, 1, 2]) {
		const targetIndex = getWrappedIndex(centerIndex + offset, total);
		const picture = lightboxPictures[targetIndex];

		preloadLightboxImage(picture?.url);
	}
};

const getCurrentLightboxPicture = () => {
	if (!lightboxPictures.length || lightboxIndex < 0) {
		return null;
	}

	return lightboxPictures[lightboxIndex] || null;
};

const shouldReduceMotion =
	typeof window !== 'undefined' && typeof window.matchMedia === 'function'
		? window.matchMedia('(prefers-reduced-motion: reduce)').matches
		: false;

const CAROUSEL_OFFSETS = [-2, -1, 0, 1, 2];

const getWrappedIndex = (index, total) => ((index % total) + total) % total;

const getCarouselSlotClass = (offset) => {
	if (offset === 0) {
		return 'is-center';
	}

	if (offset === -1) {
		return 'is-left';
	}

	if (offset === 1) {
		return 'is-right';
	}

	if (offset === -2) {
		return 'is-far-left';
	}

	return 'is-far-right';
};

const triggerCycleAnimation = (direction) => {
	if (!els.lightboxContent || shouldReduceMotion) {
		return;
	}

	const className = direction < 0 ? 'is-cycling-left' : 'is-cycling-right';

	els.lightboxContent.classList.remove('is-cycling-left', 'is-cycling-right');
	void els.lightboxContent.offsetWidth;
	els.lightboxContent.classList.add(className);

	if (lightboxCycleTimer) {
		clearTimeout(lightboxCycleTimer);
	}

	lightboxCycleTimer = setTimeout(() => {
		els.lightboxContent?.classList.remove('is-cycling-left', 'is-cycling-right');
		lightboxCycleTimer = null;
	}, CYCLE_ANIMATION_MS);
};

const updateLightboxFrame = () => {
	if (!els.lightboxTrack || !lightboxPictures.length) {
		return;
	}

	const total = lightboxPictures.length;
	const safeIndex = getWrappedIndex(lightboxIndex, total);

	lightboxIndex = safeIndex;
	els.lightboxTrack.innerHTML = CAROUSEL_OFFSETS.map((offset) => {
		const targetIndex = getWrappedIndex(safeIndex + offset, total);
		const picture = lightboxPictures[targetIndex] || null;
		const url = String(picture?.url || '');
		const slotClass = getCarouselSlotClass(offset);
		const isCenter = offset === 0;
		const loadingValue = isCenter ? 'eager' : 'lazy';
		const fetchPriority = isCenter ? 'high' : 'low';

		return `
			<button
				type="button"
				class="albums-carousel-item ${slotClass}${isCenter ? ' is-active' : ''}"
				data-target-index="${targetIndex}"
				aria-label="Open image ${targetIndex + 1}"
				${isCenter ? 'aria-current="true"' : ''}
			>
				<img src="${url}" alt="Carousel image ${targetIndex + 1}" class="albums-carousel-image" loading="${loadingValue}" fetchpriority="${fetchPriority}" decoding="async" referrerpolicy="no-referrer" />
			</button>
		`;
	}).join('');

	if (els.lightboxMeta) {
		els.lightboxMeta.textContent = `${safeIndex + 1} / ${total}`;
	}

	if (els.lightboxMenu) {
		const centerCard = els.lightboxTrack.querySelector('.albums-carousel-item.is-center');

		if (centerCard instanceof HTMLElement) {
			centerCard.appendChild(els.lightboxMenu);
			els.lightboxMenu.style.top = '10px';
			els.lightboxMenu.style.right = '10px';
			els.lightboxMenu.style.bottom = '';

			if (els.lightboxMeta) {
				els.lightboxMenu.prepend(els.lightboxMeta);
			}
		}
	} else if (els.lightboxMeta) {
		const centerCard = els.lightboxTrack.querySelector('.albums-carousel-item.is-center');

		if (centerCard instanceof HTMLElement) {
			centerCard.appendChild(els.lightboxMeta);
		}
	}

	closeActionMenu();
	setActionMenuOwnerState();

	warmLightboxNeighbors(safeIndex, total);
};

const openLightbox = (index) => {
	if (!els.lightbox || !els.lightboxTrack || !lightboxPictures.length) {
		return;
	}

	if (lightboxCloseTimer) {
		clearTimeout(lightboxCloseTimer);
		lightboxCloseTimer = null;
	}

	lightboxIndex = Number.isFinite(index) ? index : 0;
	wheelDeltaAccumulator = 0;
	wheelLastInputAt = 0;
	updateLightboxFrame();
	els.lightbox.classList.remove('hidden');
	els.lightbox.classList.remove('is-closing');

	requestAnimationFrame(() => {
		els.lightbox?.classList.add('is-open');
		els.shell?.classList.add('is-blurred');
		setCarouselScrollLock(true);
		updateActionMenuVisibility();
	});
};

const closeLightbox = () => {
	if (!els.lightbox) {
		return;
	}

	els.lightbox.classList.remove('is-open');
	els.lightbox.classList.add('is-closing');
	els.shell?.classList.remove('is-blurred');
	setCarouselScrollLock(false);

	const finalizeClose = () => {
		els.lightbox?.classList.add('hidden');
		els.lightbox?.classList.remove('is-closing');

		if (els.lightboxTrack) {
			els.lightboxTrack.innerHTML = '';
		}
		
        if (els.lightboxMeta) {
			els.lightboxMeta.textContent = '';
			els.lightboxMeta.style.top = '';
		}
		
        if (els.lightboxMenu) {
			els.lightboxMenu.style.top = '';
			els.lightboxMenu.style.right = '';
			els.lightboxMenu.style.bottom = '';
		}
		
        if (els.lightboxContent) {
			els.lightboxContent.classList.remove('is-cycling-left', 'is-cycling-right');
		}
		
        lightboxIndex = -1;
		wheelDeltaAccumulator = 0;
		wheelLastInputAt = 0;
		wheelNavigationLockUntil = 0;
		closeActionMenu();
		updateActionMenuVisibility();
		lightboxCloseTimer = null;
	};

	if (shouldReduceMotion) {
		finalizeClose();
		return;
	}

	if (lightboxCloseTimer) {
		clearTimeout(lightboxCloseTimer);
	}

	lightboxCloseTimer = setTimeout(finalizeClose, LIGHTBOX_ANIMATION_MS);
};

const moveLightbox = (step) => {
	if (!lightboxPictures.length || !els.lightbox || els.lightbox.classList.contains('hidden')) {
		return;
	}

	lightboxIndex += step;
	updateLightboxFrame();
	triggerCycleAnimation(step);
	closeActionMenu();
};

const handleLightboxWheel = (event) => {
	if (!els.lightbox || els.lightbox.classList.contains('hidden')) {
		return;
	}

	event.preventDefault();

	if (lightboxPictures.length < 2 || event.ctrlKey) {
		return;
	}

	const primaryDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;

	if (!Number.isFinite(primaryDelta) || Math.abs(primaryDelta) < 1) {
		return;
	}

	const now = Date.now();

	if (now - wheelLastInputAt > WHEEL_GESTURE_RESET_MS) {
		wheelDeltaAccumulator = 0;
	}

	wheelDeltaAccumulator += primaryDelta;
	wheelLastInputAt = now;

	if (now < wheelNavigationLockUntil) {
		return;
	}

	const stepsFromDelta = Math.trunc(Math.abs(wheelDeltaAccumulator) / WHEEL_DELTA_PER_IMAGE);

	if (stepsFromDelta < 1) {
		return;
	}

	const direction = wheelDeltaAccumulator > 0 ? 1 : -1;
	const stepCount = 1;

	wheelDeltaAccumulator -= direction * stepCount * WHEEL_DELTA_PER_IMAGE;

	if (Math.abs(wheelDeltaAccumulator) < WHEEL_DELTA_PER_IMAGE * 0.35) {
		wheelDeltaAccumulator = 0;
	}

	wheelNavigationLockUntil = now + WHEEL_NAV_LOCK_BASE_MS;
	moveLightbox(direction * stepCount);
};

const LIGHTBOX_TOUCH_SWIPE_THRESHOLD_PX = 42;
const LIGHTBOX_TOUCH_MAX_VERTICAL_DRIFT_PX = 64;

const resetLightboxTouchState = () => {
	touchStartX = null;
	touchStartY = null;
	touchLastX = null;
	touchLastY = null;
	touchTrackingActive = false;
	touchSwipeTriggered = false;
};

const handleLightboxTouchStart = (event) => {
	if (!els.lightbox || els.lightbox.classList.contains('hidden') || lightboxPictures.length < 2) {
		resetLightboxTouchState();
		return;
	}

	if (event.touches.length !== 1) {
		resetLightboxTouchState();
		return;
	}

	const touch = event.touches[0];

	touchStartX = touch.clientX;
	touchStartY = touch.clientY;
	touchLastX = touch.clientX;
	touchLastY = touch.clientY;
	touchTrackingActive = true;
	touchSwipeTriggered = false;
};

const handleLightboxTouchMove = (event) => {
	if (!touchTrackingActive || touchSwipeTriggered || event.touches.length !== 1) {
		return;
	}

	const touch = event.touches[0];

	touchLastX = touch.clientX;
	touchLastY = touch.clientY;

	if (!Number.isFinite(touchStartX) || !Number.isFinite(touchStartY)) {
		return;
	}

	const deltaX = touch.clientX - touchStartX;
	const deltaY = touch.clientY - touchStartY;

	if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > LIGHTBOX_TOUCH_MAX_VERTICAL_DRIFT_PX) {
		resetLightboxTouchState();
	}
};

const handleLightboxTouchEnd = () => {
	if (!touchTrackingActive || touchSwipeTriggered) {
		resetLightboxTouchState();
		return;
	}

	if (!Number.isFinite(touchStartX) || !Number.isFinite(touchLastX)) {
		resetLightboxTouchState();
		return;
	}

	const deltaX = touchLastX - touchStartX;
	const deltaY = Number.isFinite(touchStartY) && Number.isFinite(touchLastY) ? touchLastY - touchStartY : 0;

	if (
		Math.abs(deltaX) >= LIGHTBOX_TOUCH_SWIPE_THRESHOLD_PX &&
		Math.abs(deltaY) <= LIGHTBOX_TOUCH_MAX_VERTICAL_DRIFT_PX
	) {
		touchSwipeTriggered = true;
		moveLightbox(deltaX < 0 ? 1 : -1);
	}

	resetLightboxTouchState();
};

const getSafeHttpUrl = (value) => {
	const normalized = String(value || '').trim();

	if (!/^https?:\/\//i.test(normalized)) {
		return '';
	}

	return normalized;
};

const normalizePictureRecord = (picture) => {
	const timestamp = String(picture?.timestamp || '').trim();

	if (!timestamp) {
		return null;
	}

	const originalUrl =
		getSafeHttpUrl(picture?.original?.url) ||
		getSafeHttpUrl(picture?.url) ||
		getSafeHttpUrl(picture?.original);

	if (!originalUrl) {
		return null;
	}

	const previewUrl =
		getSafeHttpUrl(picture?.thumbnail?.url) ||
		getSafeHttpUrl(picture?.previewUrl) ||
		getSafeHttpUrl(picture?.thumbnail) ||
		originalUrl;

	return {
		timestamp,
		url: originalUrl,
		previewUrl,
		original: {
			url: originalUrl
		},
		thumbnail: {
			url: previewUrl
		}
	};
};

const getPictureKey = (picture) => `${picture.timestamp}|${picture.url}`;

const readPicturesCacheByKey = (storageKey) => {
	if (typeof window === 'undefined') {
		return {
			pictures: [],
			signature: '',
			updatedAt: 0
		};
	}

	try {
		const raw = window.sessionStorage.getItem(storageKey);

		if (!raw) {
			return {
				pictures: [],
				signature: '',
				updatedAt: 0
			};
		}

		const parsed = JSON.parse(raw);
		const cachedPictures = Array.isArray(parsed?.pictures) ? parsed.pictures : [];
		const signature = String(parsed?.signature || '').trim();
		const updatedAt = Number(parsed?.updatedAt || 0);
		const validUpdatedAt = Number.isFinite(updatedAt) && updatedAt > 0 ? updatedAt : 0;

		const pictures = cachedPictures
			.map((picture) => normalizePictureRecord(picture))
			.filter(Boolean)
			.slice(0, ALBUMS_IMAGES_LIMIT);

		return {
			pictures,
			signature,
			updatedAt: validUpdatedAt
		};
	} catch {
		return {
			pictures: [],
			signature: '',
			updatedAt: 0
		};
	}
};

const readCachedAlbumsPictures = () => {
	const localCache = readPicturesCacheByKey(ALBUMS_PICTURES_CACHE_KEY);
	const sharedCache = readPicturesCacheByKey(DASHBOARD_PROFILE_PICTURES_CACHE_KEY);

	if (!sharedCache.pictures.length) {
		return localCache;
	}

	if (!localCache.pictures.length) {
		return {
			pictures: sharedCache.pictures,
			signature: sharedCache.signature,
			updatedAt: sharedCache.updatedAt
		};
	}

	if (sharedCache.updatedAt >= localCache.updatedAt) {
		return {
			pictures: sharedCache.pictures,
			signature: sharedCache.signature,
			updatedAt: sharedCache.updatedAt
		};
	}

	return localCache;
};

const persistAlbumsPicturesCache = (pictures, signature, updatedAt = Date.now()) => {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		const normalizedUpdatedAt = Number.isFinite(updatedAt) ? updatedAt : Date.now();
		const payload = JSON.stringify({
			signature: String(signature || ''),
			pictures: Array.isArray(pictures) ? pictures : [],
			updatedAt: normalizedUpdatedAt
		});

		window.sessionStorage.setItem(ALBUMS_PICTURES_CACHE_KEY, payload);
		window.sessionStorage.setItem(DASHBOARD_PROFILE_PICTURES_CACHE_KEY, payload);
	} catch {
		// Ignore cache write errors.
	}
};

const fetchAlbumsPictures = async () => {
	const controller = typeof AbortController === 'function' ? new AbortController() : null;
	const timeoutId = setTimeout(() => {
		controller?.abort();
	}, ALBUMS_FETCH_TIMEOUT_MS);

	try {
		const response = await fetch(`/api/dashboard/profile-pictures?limit=${ALBUMS_IMAGES_LIMIT}`, {
			signal: controller?.signal,
			cache: 'no-store'
		});

		if (response.status === 401) {
			window.location.href = '/dashboard/login';
			throw new Error('Unauthorized');
		}

		if (!response.ok) {
			throw new Error('Failed loading profile pictures');
		}

		const payload = await response.json().catch(() => ({}));

		return Array.isArray(payload?.pictures) ? payload.pictures : [];
	} finally {
		clearTimeout(timeoutId);
	}
};

const renderAlbumsGrid = ({ enteringIndexes = [] } = {}) => {
	if (!els.grid) {
		return;
	}

	els.grid.innerHTML = lightboxPictures
		.map((picture, index) => imageCard(picture, index))
		.join('');

	setupGridLazyLoading();

	if (!shouldReduceMotion && enteringIndexes.length) {
		let enterOrder = 0;

		for (const index of enteringIndexes) {
			const imageElement = els.grid.querySelector(`.album-image[data-image-index="${index}"]`);

			if (!(imageElement instanceof HTMLImageElement)) {
				continue;
			}

			const cardElement = imageElement.closest('.album-image-card');

			if (!(cardElement instanceof HTMLElement)) {
				continue;
			}

			const delaySlot = Math.min(enterOrder, NEW_CARD_ANIMATION_STAGGER_LIMIT);

			cardElement.style.setProperty('--album-enter-delay', `${delaySlot * NEW_CARD_ANIMATION_STAGGER_MS}ms`);

			requestAnimationFrame(() => {
				cardElement.classList.add('album-image-card-enter');
			});

			cardElement.addEventListener(
				'animationend',
				() => {
					cardElement.classList.remove('album-image-card-enter');
					cardElement.style.removeProperty('--album-enter-delay');
				},
				{ once: true }
			);

			enterOrder += 1;
		}
	}

	if (!els.grid.innerHTML.trim()) {
		els.grid.classList.add('hidden');
		els.state.textContent = 'No profile pictures available yet.';
		return;
	}

	els.state.textContent = '';
	els.grid.classList.remove('hidden');
};

const getPicturesSignature = (pictures) => pictures.map((picture) => getPictureKey(picture)).join('\n');

const cleanupScrollReveal = () => {
	if (revealScrollListener) {
		window.removeEventListener('scroll', revealScrollListener);
		revealScrollListener = null;
	}

	if (revealObserver) {
		revealObserver.disconnect();
		revealObserver = null;
	}
};

const applyPictures = (pictures, { fromRealtime = false } = {}) => {
	const validPictures = (Array.isArray(pictures) ? pictures : [])
		.map((picture) => normalizePictureRecord(picture))
		.filter(Boolean)
		.slice(0, ALBUMS_IMAGES_LIMIT);

	const nextSignature = getPicturesSignature(validPictures);

	if (nextSignature === picturesSignature) {
		persistAlbumsPicturesCache(lightboxPictures, picturesSignature);
		return;
	}

	const previousPictureKeys = new Set(lightboxPictures.map((picture) => getPictureKey(picture)));
	const previousCurrent = getCurrentLightboxPicture();
	const hasPreviousPictures = Boolean(picturesSignature);
	const enteringIndexes = hasPreviousPictures
		? validPictures.reduce((indexes, picture, index) => {
			if (!previousPictureKeys.has(getPictureKey(picture))) {
				indexes.push(index);
			}

			return indexes;
		}, [])
		: [];

	picturesSignature = nextSignature;
	lightboxPictures = validPictures;
	persistAlbumsPicturesCache(lightboxPictures, picturesSignature);
	renderAlbumsGrid({ enteringIndexes });

	if (!lightboxPictures.length) {
		if (els.lightbox && !els.lightbox.classList.contains('hidden')) {
			closeLightbox();
		}

		return;
	}

	if (!fromRealtime) {
		setupInitialScrollReveal();
	}

	if (fromRealtime && els.lightbox && !els.lightbox.classList.contains('hidden')) {
		if (previousCurrent) {
			const nextIndex = lightboxPictures.findIndex(
				(picture) => picture.timestamp === previousCurrent.timestamp && picture.url === previousCurrent.url
			);

			if (nextIndex >= 0) {
				lightboxIndex = nextIndex;
			} else {
				lightboxIndex = Math.min(Math.max(lightboxIndex, 0), lightboxPictures.length - 1);
			}
		} else {
			lightboxIndex = Math.min(Math.max(lightboxIndex, 0), lightboxPictures.length - 1);
		}

		updateLightboxFrame();
		updateActionMenuVisibility();
	}
};

const setupInitialScrollReveal = () => {
	if (shouldReduceMotion || !els.grid) {
		return;
	}

	cleanupScrollReveal();

	const cards = Array.from(els.grid.querySelectorAll('.album-image-card'));

	if (!cards.length) {
		return;
	}

	let lastScrollY = window.scrollY;

	revealScrollListener = () => {
		const currentScrollY = window.scrollY;
		const deltaY = currentScrollY - lastScrollY;

		isScrollingDown = currentScrollY >= lastScrollY;
		lastScrollY = currentScrollY;

		const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;

		if (Math.abs(deltaY) > viewportHeight * 0.75) {
			const pendingCards = els.grid?.querySelectorAll('.album-image-card.scroll-reveal-ready') || [];

			for (const card of pendingCards) {
				card.classList.add('scroll-reveal-visible');
				card.classList.remove('scroll-reveal-ready');
				revealObserver?.unobserve(card);
			}
		}
	};

	window.addEventListener('scroll', revealScrollListener, { passive: true });

	revealObserver = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting || !isScrollingDown) {
					continue;
				}

				const element = entry.target;

				element.classList.add('scroll-reveal-visible');
				element.classList.remove('scroll-reveal-ready');
				revealObserver?.unobserve(element);
			}
		},
		{
			threshold: 0.12,
			rootMargin: '0px 0px -8% 0px'
		}
	);

	const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;

	for (const card of cards) {
		card.classList.remove('scroll-reveal-ready', 'scroll-reveal-visible');

		const rect = card.getBoundingClientRect();

		if (rect.top < viewportHeight * 0.9) {
			card.classList.add('scroll-reveal-visible');
			continue;
		}

		card.classList.add('scroll-reveal-ready');
		revealObserver.observe(card);
	}
};

const setupRealtimeProfileUpdates = () => {
	if (typeof window === 'undefined' || typeof window.io !== 'function') {
		return;
	}

	if (realtimeSocket) {
		return;
	}

	realtimeSocket = window.io({
		path: '/socket.io',
		transports: ['websocket', 'polling']
	});

	realtimeSocket.on('dashboard:profile-pictures', (payload) => {
		const nextPictures = Array.isArray(payload?.pictures) ? payload.pictures : [];

		if (!nextPictures.length && picturesSignature) {
			applyPictures([], { fromRealtime: true });
			return;
		}

		if (nextPictures.length) {
			applyPictures(nextPictures, { fromRealtime: true });
		}
	});

	window.addEventListener('beforeunload', () => {
		realtimeSocket?.close();
	});
};

const deleteCurrentPicture = async () => {
	const current = getCurrentLightboxPicture();

	if (!current) {
		return;
	}

	if (!isOwnerSession) {
		els.state.textContent = 'Only owner can delete images.';
		return;
	}

	els.lightboxMenuDelete?.setAttribute('disabled', 'disabled');

	try {
		const response = await fetch('/api/dashboard/profile-pictures', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				timestamp: current.timestamp,
				url: current.url
			})
		});

		ensureAuthorizedResponse(response, 'Failed deleting profile picture');

		const payload = await response.json().catch(() => ({}));

		if (!response.ok || payload?.ok === false) {
			throw new Error(payload?.message || 'Failed deleting profile picture');
		}

		lightboxPictures = lightboxPictures.filter(
			(picture) => !(picture.timestamp === current.timestamp && picture.url === current.url)
		);

		if (!lightboxPictures.length) {
			persistAlbumsPicturesCache(lightboxPictures, getPicturesSignature(lightboxPictures));
			closeLightbox();
			renderAlbumsGrid();
			els.state.textContent = 'No profile pictures available yet.';
			return;
		}

		if (lightboxIndex >= lightboxPictures.length) {
			lightboxIndex = lightboxPictures.length - 1;
		}

		persistAlbumsPicturesCache(lightboxPictures, getPicturesSignature(lightboxPictures));

		renderAlbumsGrid();
		updateLightboxFrame();
		updateActionMenuVisibility();
		showToast(`${getPictureFilename(current)} deleted`, 'success');
	} catch (error) {
		if (error?.message !== 'Unauthorized') {
			showToast(error?.message || 'Unable to delete image right now.', 'error');
		}
	} finally {
		els.lightboxMenuDelete?.removeAttribute('disabled');
	}
};

const downloadCurrentPicture = async () => {
	const current = getCurrentLightboxPicture();

	if (!current?.url) {
		return;
	}

	const downloadUrl = new URL('/api/dashboard/profile-pictures/download', window.location.origin);

	downloadUrl.searchParams.set('url', current.url);

	if (current.timestamp) {
		downloadUrl.searchParams.set('timestamp', current.timestamp);
	}

	showToast(`Downloading ${getPictureFilename(current)}...`, 'info', 2000);

	try {
		const response = await fetch(downloadUrl.toString(), {
			method: 'GET',
			credentials: 'same-origin'
		});

		if (!response.ok) {
			const fallbackMessage = 'File was not available for download.';
			const payload = await response.json().catch(() => ({}));

			throw new Error(payload?.message || fallbackMessage);
		}

		const contentDisposition = String(response.headers.get('content-disposition') || '');
		const encodedMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
		const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
		const filename = encodedMatch?.[1]
			? decodeURIComponent(encodedMatch[1])
			: plainMatch?.[1] || `album-${current.timestamp || Date.now()}.jpg`;
		const blob = await response.blob();
		const objectUrl = URL.createObjectURL(blob);

		const downloadLink = document.createElement('a');

		downloadLink.href = objectUrl;
		downloadLink.download = filename;
		downloadLink.rel = 'noopener noreferrer';
		document.body.appendChild(downloadLink);
		downloadLink.click();
		downloadLink.remove();

		setTimeout(() => {
			URL.revokeObjectURL(objectUrl);
		}, 1000);
	} catch (error) {
		showToast(error?.message || 'Unable to download image right now.', 'error');
	}
};

const setupZenCursor = () => {
	if (typeof window === 'undefined' || !document?.body) {
		document?.documentElement?.classList.remove('zen-cursor-preload');
		try {
			window?.sessionStorage?.removeItem(ZEN_CURSOR_ENABLED_CACHE_KEY);
		} catch {
			// Ignore storage cleanup errors.
		}
		return false;
	}

	if (!window.matchMedia('(pointer: fine)').matches) {
		document.documentElement.classList.remove('zen-cursor-preload');
		try {
			window.sessionStorage.removeItem(ZEN_CURSOR_ENABLED_CACHE_KEY);
		} catch {
			// Ignore storage cleanup errors.
		}
		return false;
	}

	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		document.documentElement.classList.remove('zen-cursor-preload');
		try {
			window.sessionStorage.removeItem(ZEN_CURSOR_ENABLED_CACHE_KEY);
		} catch {
			// Ignore storage cleanup errors.
		}
		return false;
	}

	const cursor = document.createElement('div');
	const cursorText = document.createElement('div');
	let isCursorVisible = true;

	cursor.id = 'zen-cursor';
	cursor.className = 'zen-cursor rounded blur cursor-normal';
	cursorText.id = 'zen-cursor-text';
	cursorText.className = 'zen-cursor-text';
	document.documentElement.appendChild(cursor);
	document.documentElement.appendChild(cursorText);
	document.documentElement.classList.remove('zen-cursor-preload');
	document.documentElement.classList.add('zen-cursor-enabled');
	document.body.classList.add('zen-cursor-enabled');
	document.body.style.cursor = 'none';

	try {
		window.sessionStorage.setItem(ZEN_CURSOR_ENABLED_CACHE_KEY, '1');
	} catch {
		// Ignore storage write errors.
	}

	const setCursorVisibility = (isVisible) => {
		if (isCursorVisible === isVisible) {
			return;
		}

		isCursorVisible = isVisible;
		cursor.style.opacity = isVisible ? '1' : '0';

		if (!isVisible) {
			cursorText.style.scale = '0';
		}
	};

	const moveCursor = (event) => {
		const mouseY = event.clientY;
		const mouseX = event.clientX;
		const tooltipGap = 24;

		setCursorVisibility(true);

		cursor.style.translate = `${mouseX}px ${mouseY}px`;

		if (mouseX > window.innerWidth - cursorText.clientWidth - tooltipGap) {
			cursorText.style.left = `${mouseX - cursorText.clientWidth - tooltipGap}px`;
		} else {
			cursorText.style.left = `${mouseX + tooltipGap}px`;
		}

		if (mouseY > window.innerHeight - cursorText.clientHeight - tooltipGap) {
			cursorText.style.top = `${mouseY - cursorText.clientHeight - tooltipGap}px`;
		} else {
			cursorText.style.top = `${mouseY + tooltipGap}px`;
		}

		persistZenPointerPosition(mouseX, mouseY);
	};

	const updateTitle = (titleText) => {
		if (titleText) {
			cursorText.style.scale = '1';
			cursorText.textContent = titleText;
			return;
		}

		cursorText.style.scale = '0';
	};

	const interactiveCursorSelector =
		'a, button, input, .album-image, .albums-carousel-image, [data-title], [data-tooltip]';
	let activeInteractiveTarget = null;

	const setInteractiveTarget = (target) => {
		if (activeInteractiveTarget === target) {
			return;
		}

		activeInteractiveTarget = target;

		if (!(target instanceof Element)) {
			cursor.classList.remove('blur-mini');
			cursor.classList.remove('cursor-grow');
			updateTitle('');
			return;
		}

		cursor.classList.add('blur-mini');
		cursor.classList.add('cursor-grow');
		updateTitle(target.getAttribute('data-title') || target.getAttribute('data-tooltip'));
	};

	const handleDocumentMouseOverInteractive = (event) => {
		const rawTarget = event.target;

		if (!(rawTarget instanceof Element)) {
			setInteractiveTarget(null);
			return;
		}

		const isLightboxOpen = Boolean(els.lightbox && !els.lightbox.classList.contains('hidden'));
		const inCarouselStage = rawTarget.closest('.albums-lightbox-stage');

		if (isLightboxOpen && inCarouselStage instanceof Element) {
			setInteractiveTarget(inCarouselStage);
			return;
		}

		const matchedTarget = rawTarget.closest(interactiveCursorSelector);

		setInteractiveTarget(matchedTarget);
	};

	const handleMouseDown = (event) => {
		if (event.button !== 0) {
			return;
		}

		cursor.classList.add('is-holding');
	};

	const handleMouseUp = (event) => {
		if (event.button !== 0) {
			return;
		}

		cursor.classList.remove('is-holding');
	};

	const handleWindowBlur = () => {
		setCursorVisibility(false);
	};

	const handleWindowFocus = () => {
		if (!document.hidden) {
			setCursorVisibility(true);
		}
	};

	const handleVisibilityChange = () => {
		setCursorVisibility(!document.hidden);
	};

	const handleDocumentMouseOut = (event) => {
		if (!event.relatedTarget && !event.toElement) {
			setCursorVisibility(false);
		}
	};

	const handleDocumentMouseEnter = () => {
		if (!document.hidden && document.hasFocus()) {
			setCursorVisibility(true);
		}
	};

	window.addEventListener('mousemove', moveCursor);
	window.addEventListener('mousedown', handleMouseDown);
	window.addEventListener('mouseup', handleMouseUp);
	window.addEventListener('blur', handleWindowBlur);
	window.addEventListener('focus', handleWindowFocus);
	document.addEventListener('visibilitychange', handleVisibilityChange);
	document.addEventListener('mouseout', handleDocumentMouseOut);
	document.addEventListener('mouseenter', handleDocumentMouseEnter);
	document.addEventListener('mouseover', handleDocumentMouseOverInteractive);

	const cachedPointer = readCachedZenPointerPosition();

	if (cachedPointer) {
		moveCursor({
			clientX: cachedPointer.x,
			clientY: cachedPointer.y
		});
	}

	window.addEventListener('beforeunload', () => {
		window.removeEventListener('mousemove', moveCursor);
		window.removeEventListener('mousedown', handleMouseDown);
		window.removeEventListener('mouseup', handleMouseUp);
		window.removeEventListener('blur', handleWindowBlur);
		window.removeEventListener('focus', handleWindowFocus);
		document.removeEventListener('visibilitychange', handleVisibilityChange);
		document.removeEventListener('mouseout', handleDocumentMouseOut);
		document.removeEventListener('mouseenter', handleDocumentMouseEnter);
		document.removeEventListener('mouseover', handleDocumentMouseOverInteractive);
		setInteractiveTarget(null);
	});

	return true;
};

const buildSkeletonCards = (count = 15) =>
	Array.from({ length: count })
		.map(
			() => `
	<article class="album-skeleton-card">
		<div class="album-skeleton-block"></div>
	</article>
`
		)
		.join('');

const setLoadingState = (isLoading) => {
	if (!els.skeleton) {
		return;
	}

	if (isLoading) {
		els.skeleton.innerHTML = buildSkeletonCards();
		els.skeleton.classList.remove('hidden');
		els.grid.classList.add('hidden');
		els.state.textContent = 'Loading your albums...';
		return;
	}

	els.skeleton.classList.add('hidden');
	els.skeleton.innerHTML = '';
};

const redirectToLogin = () => {
	window.location.href = '/dashboard/login';
};

const navigateToDashboard = () => {
	window.location.href = '/dashboard';
};

const scheduleZenCursorInit = () => {
	setupZenCursor();
};

const ensureAuthorizedResponse = (response, context) => {
	if (response.status === 401) {
		redirectToLogin();
		throw new Error('Unauthorized');
	}

	if (!response.ok) {
		throw new Error(context || 'Request failed');
	}
};

const isGifMediaUrl = (value) => {
	const normalized = String(value || '').trim();

	if (!normalized) {
		return false;
	}

	try {
		const parsed = new URL(normalized);

		return /\.gif$/i.test(parsed.pathname || '');
	} catch {
		return /\.gif(?:$|[?#])/i.test(normalized);
	}
};

const getGridImageSource = (picture) => {
	const originalUrl = String(picture?.url || '').trim();
	const previewUrl = String(picture?.previewUrl || '').trim();

	if (isGifMediaUrl(originalUrl)) {
		return originalUrl;
	}

	return previewUrl || originalUrl;
};

const imageCard = (picture, index) => `
	<article class="album-image-card">
		<img src="${IMAGE_PLACEHOLDER_DATA_URI}" data-src="${getGridImageSource(picture)}" alt="Album profile picture" class="album-image is-lazy" loading="lazy" decoding="async" fetchpriority="low" referrerpolicy="no-referrer" data-image-index="${index}" />
	</article>
`;

const loadAlbums = async () => {
	setLoadingState(true);

	const cachedEntry = readCachedAlbumsPictures();
	const cachedPictures = cachedEntry.pictures;
	const hasCachedPictures = cachedPictures.length > 0;

	if (hasCachedPictures) {
		applyPictures(cachedPictures);
		setLoadingState(false);
		els.state.textContent = '';
		els.grid.classList.remove('hidden');
		setupGridLazyLoading();
	}

	await new Promise((resolve) => {
		if (typeof window.requestAnimationFrame === 'function') {
			window.requestAnimationFrame(() => resolve());
			return;
		}

		setTimeout(resolve, 0);
	});

	try {
		const sessionPromise = fetch('/api/dashboard/auth/session', {
			cache: 'no-store'
		}).then(async (response) => {
			ensureAuthorizedResponse(response, 'Failed checking session');

			return response.json();
		});
		const picturesPromise = fetchAlbumsPictures();
		const [sessionResult, picturesResult] = await Promise.allSettled([sessionPromise, picturesPromise]);

		if (sessionResult.status === 'rejected') {
			throw sessionResult.reason;
		}

		const session = sessionResult.value;

		isOwnerSession = String(session?.role || '').toLowerCase() === 'owner';
		updateActionMenuVisibility();

		if (!session?.authenticated) {
			redirectToLogin();
			return;
		}

		setupRealtimeProfileUpdates();

		if (picturesResult.status === 'rejected') {
			const error = picturesResult.reason;

			if (!hasCachedPictures && error?.message !== 'Unauthorized') {
				throw error;
			}

			return;
		}

		const pictures = picturesResult.value;

		if (!pictures.length) {
			if (hasCachedPictures) {
				return;
			}

			setLoadingState(false);
			els.state.textContent = 'No profile pictures available yet.';
			els.grid.classList.add('hidden');
			return;
		}

		applyPictures(pictures);

		if (!els.grid.innerHTML.trim()) {
			setLoadingState(false);
			els.state.textContent = 'No valid images available.';
			els.grid.classList.add('hidden');
			return;
		}

		setLoadingState(false);
		els.state.textContent = '';
		els.grid.classList.remove('hidden');
		setupGridLazyLoading();
	} catch (error) {
		setLoadingState(false);
		console.error(error);

		if (error?.message !== 'Unauthorized' && !hasCachedPictures) {
			els.state.textContent = 'Unable to load albums right now.';
		}
	}
};

const scheduleDeferredAlbumsLoad = () => {
	const startAlbumsLoad = () => {
		window.setTimeout(() => {
			void loadAlbums();
		}, 0);
	};

	if (typeof window.requestIdleCallback === 'function') {
		window.requestIdleCallback(startAlbumsLoad, {
			timeout: 1200
		});
		return;
	}

	if (typeof window.requestAnimationFrame === 'function') {
		window.requestAnimationFrame(() => {
			window.setTimeout(startAlbumsLoad, ALBUMS_DEFERRED_BOOT_DELAY_MS);
		});
		return;
	}

	window.setTimeout(startAlbumsLoad, ALBUMS_DEFERRED_BOOT_DELAY_MS);
};

els.back?.addEventListener('pointerdown', (event) => {
	if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
		return;
	}

	persistZenPointerFromEvent(event);
	navigateToDashboard();
});
els.back?.addEventListener('click', (event) => {
	persistZenPointerFromEvent(event);
	navigateToDashboard();
});

els.grid?.addEventListener('click', (event) => {
	const target = event.target;

	if (!(target instanceof HTMLImageElement)) {
		return;
	}

	const index = Number.parseInt(String(target.dataset.imageIndex || ''), 10);

	if (!Number.isFinite(index)) {
		return;
	}

	openLightbox(index);
});

els.lightboxBackdrop?.addEventListener('click', closeLightbox);
els.lightbox?.addEventListener('click', (event) => {
	const target = event.target;

	if (!(target instanceof Element)) {
		return;
	}

	if (!target.closest('.albums-lightbox-menu')) {
		closeActionMenu();
	}

	const selectedCard = target.closest('.albums-carousel-item');

	if (selectedCard instanceof HTMLElement) {
		if (selectedCard.classList.contains('is-center')) {
			return;
		}

		const targetIndex = Number.parseInt(String(selectedCard.dataset.targetIndex || ''), 10);

		if (Number.isFinite(targetIndex) && lightboxPictures.length > 1) {
			const total = lightboxPictures.length;
			const current = getWrappedIndex(lightboxIndex, total);
			const next = getWrappedIndex(targetIndex, total);

			if (next !== current) {
				const forward = (next - current + total) % total;
				const backward = (current - next + total) % total;

				lightboxIndex = next;
				updateLightboxFrame();
				triggerCycleAnimation(forward <= backward ? 1 : -1);
			}
		}

		return;
	}

	if (target.closest('.albums-lightbox-nav, .albums-lightbox-menu, .albums-lightbox-content')) {
		const centerCard = els.lightboxTrack?.querySelector('.albums-carousel-item.is-center');

		if (!(centerCard instanceof HTMLElement)) {
			return;
		}

		const centerRect = centerCard.getBoundingClientRect();
		const clickedInsideCenterImage =
			event.clientX >= centerRect.left &&
			event.clientX <= centerRect.right &&
			event.clientY >= centerRect.top &&
			event.clientY <= centerRect.bottom;

		if (clickedInsideCenterImage) {
			return;
		}

		if (target.closest('.albums-lightbox-nav, .albums-lightbox-menu')) {
			return;
		}

		closeLightbox();
		return;
	}

	closeLightbox();
});
els.lightboxMenuToggle?.addEventListener('click', (event) => {
	event.stopPropagation();
	const isOpen = !els.lightboxMenuPanel?.classList.contains('hidden');

	if (!isOpen) {
		els.lightboxMenuPanel?.classList.remove('hidden');
		els.lightboxMenuToggle?.setAttribute('aria-expanded', 'true');
		return;
	}

	closeActionMenu();
});
els.lightboxMenuDownload?.addEventListener('click', () => {
	void downloadCurrentPicture();
	closeActionMenu();
});
els.lightboxMenuDelete?.addEventListener('click', () => {
	void deleteCurrentPicture();
	closeActionMenu();
});
els.lightboxStage?.addEventListener('wheel', handleLightboxWheel, { passive: false });
els.lightboxStage?.addEventListener('touchstart', handleLightboxTouchStart, { passive: true });
els.lightboxStage?.addEventListener('touchmove', handleLightboxTouchMove, { passive: true });
els.lightboxStage?.addEventListener('touchend', handleLightboxTouchEnd, { passive: true });
els.lightboxStage?.addEventListener('touchcancel', resetLightboxTouchState, { passive: true });

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && els.lightbox && !els.lightbox.classList.contains('hidden')) {
		if (els.lightboxMenuPanel && !els.lightboxMenuPanel.classList.contains('hidden')) {
			closeActionMenu();
			return;
		}

		closeLightbox();
		return;
	}

	if (event.key === 'ArrowLeft') {
		moveLightbox(-1);

		return;
	}

	if (event.key === 'ArrowRight') {
		moveLightbox(1);
	}
});

window.addEventListener('resize', () => {
	if (!els.lightbox || els.lightbox.classList.contains('hidden')) {
		return;
	}
});

window.addEventListener('beforeunload', () => {
	cleanupScrollReveal();
	setCarouselScrollLock(false);
	resetLightboxTouchState();
	closeActionMenu();

	if (gridImageObserver) {
		gridImageObserver.disconnect();
		gridImageObserver = null;
	}
});

window.addEventListener('storage', (event) => {
	if (event.key === THEME_STORAGE_KEY) {
		if (event.newValue === 'light' || event.newValue === 'dark') {
			document.documentElement.setAttribute('data-theme', event.newValue);
		}

		return;
	}

	if (event.key === THEME_PALETTE_STORAGE_KEY && event.newValue) {
		document.documentElement.setAttribute('data-palette', event.newValue);
	}
});

scheduleZenCursorInit();
scheduleDeferredAlbumsLoad();
