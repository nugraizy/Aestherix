import {
	ACTIVE_FOLDER_STORAGE_KEY,
	ALERT_RULES,
	ansiRegex,
	AUDIT_ACTION_PARAM,
	AUDIT_ACTIONS_COLLAPSED_KEY,
	AUDIT_QUERY_PARAM,
	AUDIT_ROLE_PARAM,
	AUDIT_ROLES_COLLAPSED_KEY,
	CHANGELOG_MARKDOWN_PATH,
	COLLAPSE_STORAGE_KEY,
	CONTRIBUTORS_PATH,
	DEFAULT_DASHBOARD_SETTINGS,
	DEFAULT_THEME_PALETTE,
	ERROR_SPIKE_PATTERN,
	SEARCH_PLACEHOLDERS,
	SETTINGS_STORAGE_KEY,
	THEME_ICON_MORPH_MS,
	THEME_PALETTE_STORAGE_KEY,
	THEME_PALETTES,
	THEME_STORAGE_KEY,
	THEME_TRANSITION_MS
} from './app/constants.js';
import { els } from './app/dom.js';
import { escapeHtml, fuzzyIncludes, highlightMatch, renderChangelogMarkdown, sanitizeMarkdownUrl } from './app/formatters.js';
import { state } from './app/state.js';

let themeTransitionTimer = null;
let themeIconMorphTimer = null;
let toastHost = null;
const userLimitSaveTimers = new Map();
const pollingTimers = {
	status: null,
	logs: null,
	audit: null,
	commands: null,
	flags: null,
	users: null,
	profilePictures: null
};
let floatingTooltipHost = null;
let floatingTooltipTarget = null;
let chartHoverTooltipHost = null;
let renderStatusCharts = () => {};
let pendingConfirmResolver = null;
let pendingEditorCloseResolver = null;
let dashboardSocket = null;
let realtimeConnected = false;
let botLogsBridgeWarningShown = false;
let auditRenderSignature = '';
let changelogHtmlCache = '';
let contributorsHtmlCache = '';
let spotifyPollTimer = null;
let spotifyProgressTimer = null;
let spotifyLastProgressAt = 0;
let latestSpotify = null;
const DIALOG_ANIMATION_MS = 240;
const dialogHideTimers = new WeakMap();
const CONTRIBUTORS_AVATAR_CACHE_NAME = 'aestherix.dashboard.contributor-avatars.v1';
const contributorAvatarObjectUrlCache = new Map();
const LOGOUT_MIN_LOADING_MS = 3500;
let logoutInProgress = false;
const ZEN_CURSOR_LOGOUT_LOCK_ATTR = 'data-logout-lock';
const ZEN_CURSOR_POINTER_CACHE_KEY = 'aestherix.dashboard.cursor.pointer';
const ZEN_CURSOR_ENABLED_CACHE_KEY = 'aestherix.dashboard.cursor.enabled';
const DASHBOARD_PROFILE_PICTURES_CACHE_KEY = 'aestherix.dashboard.profilePictures.cache.v1';
const PROFILE_PICTURES_LIMIT = 250;
const PROFILE_PICTURES_COLOR_FILTER_TOLERANCE = 88;
const ALBUMS_ROUTE_PATH = '/albums';
const DASHBOARD_ROUTE_PATH = '/dashboard';
const EDITOR_ROUTE_PATH = '/dashboard/editor';
const CYCLE_ANIMATION_MS = 180;
const WHEEL_DELTA_PER_IMAGE = 48;
const WHEEL_GESTURE_RESET_MS = 180;
const WHEEL_NAV_LOCK_BASE_MS = 46;
const LIGHTBOX_TOUCH_SWIPE_THRESHOLD_PX = 42;
const LIGHTBOX_TOUCH_MAX_VERTICAL_DRIFT_PX = 64;
let profilePicturesCarouselItems = [];
let profilePicturesCarouselIndex = -1;
const PROFILE_PICTURES_CAROUSEL_OFFSETS = [-2, -1, 0, 1, 2];
let seamlessAlbumsOpen = false;
let lastDashboardRouteHref = DASHBOARD_ROUTE_PATH;
let profilePicturesWheelDeltaAccumulator = 0;
let profilePicturesWheelLastInputAt = 0;
let profilePicturesWheelNavigationLockUntil = 0;
let profilePicturesCycleTimer = null;
let profilePicturesTouchStartX = null;
let profilePicturesTouchStartY = null;
let profilePicturesTouchLastX = null;
let profilePicturesTouchLastY = null;
let profilePicturesTouchTrackingActive = false;
let profilePicturesTouchSwipeTriggered = false;
let seamlessAlbumsRenderedSignature = '';
let seamlessAlbumsColorFilterHex = '';
let seamlessAlbumsColorisPickerInput = null;
let seamlessAlbumsColorisConfigured = false;
let seamlessAlbumsColorisPickerDraftHex = '';
let editorTreeSnapshot = null;
let editorTreeExpanded = new Set();
let editorTabs = new Map();
let editorActivePath = '';
let editorView = null;
let editorModules = null;
let editorLoading = false;
let editorRouteIntent = false;
let editorActiveTheme = 'dracula';
const editorSyntaxTimers = new Map();
const editorSyntaxErrors = new Map();
let editorCursorBound = false;
const EDITOR_THEME_STORAGE_KEY = 'aestherix.dashboard.editor.theme';

const clampProfilePictures = (pictures) => (Array.isArray(pictures) ? pictures : []).slice(0, PROFILE_PICTURES_LIMIT);

const normalizeHexColor = (value) => {
	const raw = String(value || '')
		.trim()
		.replace(/^#/, '');

	if (/^[0-9a-fA-F]{3}$/.test(raw)) {
		const expanded = raw
			.split('')
			.map((character) => `${character}${character}`)
			.join('');

		return `#${expanded.toLowerCase()}`;
	}

	if (/^[0-9a-fA-F]{6}$/.test(raw)) {
		return `#${raw.toLowerCase()}`;
	}

	if (/^[0-9a-fA-F]{8}$/.test(raw)) {
		return `#${raw.slice(0, 6).toLowerCase()}`;
	}

	return '';
};

const hasActiveSeamlessAlbumsColorFilter = () => Boolean(seamlessAlbumsColorFilterHex);

const getSeamlessAlbumsNoPicturesMessage = () => {
	if (!hasActiveSeamlessAlbumsColorFilter()) {
		return 'No profile pictures have been captured yet.';
	}

	return `No images matched ${seamlessAlbumsColorFilterHex.toUpperCase()}.`;
};

const updateSeamlessAlbumsColorFilterUi = () => {
	const colorHex = hasActiveSeamlessAlbumsColorFilter() ? seamlessAlbumsColorFilterHex : '#7ecfff';

	if (els.albumsSeamlessColorSwatch) {
		els.albumsSeamlessColorSwatch.style.background = colorHex;
	}

	if (els.albumsSeamlessColorLabel) {
		els.albumsSeamlessColorLabel.textContent = hasActiveSeamlessAlbumsColorFilter()
			? seamlessAlbumsColorFilterHex.toUpperCase()
			: 'All colors';
	}

	if (els.albumsSeamlessColorClear) {
		els.albumsSeamlessColorClear.classList.toggle('hidden', !hasActiveSeamlessAlbumsColorFilter());
	}
};

const updateSeamlessAlbumsColorPickerPreviewUi = (nextHex) => {
	if (els.albumsSeamlessColorSwatch) {
		els.albumsSeamlessColorSwatch.style.background = nextHex;
	}

	if (els.albumsSeamlessColorLabel) {
		els.albumsSeamlessColorLabel.textContent = nextHex.toUpperCase();
	}
};

const getColorisApi = () => {
	if (typeof window === 'undefined' || typeof window.Coloris !== 'function') {
		return null;
	}

	return window.Coloris;
};

const stageSeamlessAlbumsColorPickerSelection = (value) => {
	const normalized = normalizeHexColor(value);

	if (!normalized) {
		return;
	}

	seamlessAlbumsColorisPickerDraftHex = normalized;
	updateSeamlessAlbumsColorPickerPreviewUi(normalized);
};

const commitSeamlessAlbumsColorPickerSelection = ({ forceReload = false } = {}) => {
	const normalized = normalizeHexColor(seamlessAlbumsColorisPickerDraftHex || seamlessAlbumsColorFilterHex || '#7ecfff');

	if (!normalized) {
		updateSeamlessAlbumsColorFilterUi();
		return;
	}

	if (!forceReload && normalized === seamlessAlbumsColorFilterHex) {
		updateSeamlessAlbumsColorFilterUi();
		return;
	}

	seamlessAlbumsColorFilterHex = normalized;
	updateSeamlessAlbumsColorFilterUi();
	void runSafe(fetchProfilePictures);
};

const ensureSeamlessAlbumsColorisPickerInput = () => {
	if (seamlessAlbumsColorisPickerInput?.isConnected) {
		return seamlessAlbumsColorisPickerInput;
	}

	const input = document.createElement('input');

	input.id = 'albums-seamless-coloris-input';
	input.type = 'text';
	input.className = 'albums-coloris-input';
	input.setAttribute('data-coloris', '');
	input.setAttribute('aria-hidden', 'true');
	input.setAttribute('tabindex', '-1');
	input.autocomplete = 'off';
	input.spellcheck = false;
	input.value = (seamlessAlbumsColorFilterHex || '#7ecfff').toUpperCase();
	input.addEventListener('open', () => {
		seamlessAlbumsColorisPickerDraftHex =
			normalizeHexColor(input.value || seamlessAlbumsColorFilterHex || '#7ecfff') || '#7ecfff';
		els.albumsSeamlessColorTrigger?.setAttribute('aria-expanded', 'true');
	});
	input.addEventListener('close', () => {
		els.albumsSeamlessColorTrigger?.setAttribute('aria-expanded', 'false');
		commitSeamlessAlbumsColorPickerSelection();
	});
	document.body.appendChild(input);
	seamlessAlbumsColorisPickerInput = input;

	return input;
};

const ensureSeamlessAlbumsColorisConfigured = () => {
	const Coloris = getColorisApi();

	if (!Coloris) {
		return false;
	}

	if (!seamlessAlbumsColorisConfigured) {
		Coloris({
			el: '#albums-seamless-coloris-input',
			onChange: (nextColor) => {
				const normalized = normalizeHexColor(nextColor);

				if (!normalized) {
					return;
				}

				stageSeamlessAlbumsColorPickerSelection(normalized);
			}
		});

		seamlessAlbumsColorisConfigured = true;
	}

	return true;
};

const toggleSeamlessAlbumsColorPicker = () => {
	const input = ensureSeamlessAlbumsColorisPickerInput();

	if (!ensureSeamlessAlbumsColorisConfigured()) {
		showToast('Color picker is unavailable right now.', 'error');
		return;
	}

	const currentColor = normalizeHexColor(seamlessAlbumsColorFilterHex || '#7ecfff') || '#7ecfff';

	seamlessAlbumsColorisPickerDraftHex = currentColor;
	input.value = currentColor.toUpperCase();
	updateSeamlessAlbumsColorPickerPreviewUi(currentColor);

	if (els.albumsSeamlessColorTrigger instanceof HTMLElement) {
		const triggerRect = els.albumsSeamlessColorTrigger.getBoundingClientRect();

		input.style.left = `${Math.round(triggerRect.left)}px`;
		input.style.top = `${Math.round(triggerRect.bottom)}px`;
	}

	input.click();
	input.focus();
};

const buildProfilePicturesRequestUrl = () => {
	const requestUrl = new URL('/api/dashboard/profile-pictures', window.location.origin);

	requestUrl.searchParams.set('limit', String(PROFILE_PICTURES_LIMIT));

	if (hasActiveSeamlessAlbumsColorFilter()) {
		requestUrl.searchParams.set('color', seamlessAlbumsColorFilterHex);
		requestUrl.searchParams.set('tolerance', String(PROFILE_PICTURES_COLOR_FILTER_TOLERANCE));
	}

	return requestUrl.toString();
};

const persistSharedProfilePicturesCache = (pictures) => {
	if (typeof window === 'undefined') {
		return;
	}

	const limitedPictures = clampProfilePictures(pictures);

	try {
		window.sessionStorage.setItem(
			DASHBOARD_PROFILE_PICTURES_CACHE_KEY,
			JSON.stringify({
				updatedAt: Date.now(),
				pictures: limitedPictures
			})
		);
	} catch {
		// Ignore cache write errors.
	}
};

const getZenCursorElement = () => document.getElementById('zen-cursor');

const isZenCursorLogoutLocked = () => getZenCursorElement()?.getAttribute(ZEN_CURSOR_LOGOUT_LOCK_ATTR) === '1';

const setZenCursorLogoutHoverState = (isActive) => {
	const cursor = getZenCursorElement();

	if (!cursor || isZenCursorLogoutLocked()) {
		return;
	}

	cursor.classList.toggle('is-logout-alert', Boolean(isActive));
};

const lockZenCursorLogoutState = () => {
	const cursor = getZenCursorElement();

	if (!cursor) {
		return;
	}

	cursor.setAttribute(ZEN_CURSOR_LOGOUT_LOCK_ATTR, '1');
	cursor.classList.add('is-logout-alert');
};

const STATUS_CHART_SERIES = {
	sysCpu: {
		label: 'System CPU',
		toneVar: '--mint',
		fallbackColor: '#87f0c1',
		canvas: () => els.sysCpuChart
	},
	procCpu: {
		label: 'Process CPU',
		toneVar: '--amber',
		fallbackColor: '#ffd166',
		canvas: () => els.procCpuChart
	},
	memoryPercent: {
		label: 'Memory Usage',
		toneVar: '--sky',
		fallbackColor: '#8ecfff',
		canvas: () => els.memoryChart
	}
};

const toRgbaWithAlpha = (color, alpha) => {
	const safeColor = String(color || '').trim();
	const safeAlpha = Math.max(0, Math.min(1, Number(alpha ?? 1)));
	const hexMatch = safeColor.match(/^#([\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i);

	if (hexMatch) {
		let hex = hexMatch[1];

		if (hex.length === 3) {
			hex = hex
				.split('')
				.map((chunk) => `${chunk}${chunk}`)
				.join('');
		}

		if (hex.length === 8) {
			hex = hex.slice(0, 6);
		}

		const red = parseInt(hex.slice(0, 2), 16);
		const green = parseInt(hex.slice(2, 4), 16);
		const blue = parseInt(hex.slice(4, 6), 16);

		return `rgba(${red}, ${green}, ${blue}, ${safeAlpha})`;
	}

	const rgbMatch = safeColor.match(/^rgba?\(([^)]+)\)$/i);

	if (rgbMatch) {
		const parts = rgbMatch[1]
			.split(',')
			.slice(0, 3)
			.map((part) => Number.parseFloat(part.trim()));

		if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
			const [red, green, blue] = parts;

			return `rgba(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)}, ${safeAlpha})`;
		}
	}

	return safeColor;
};

const resolveThemeSeriesColor = (toneVar, fallbackColor) => {
	const styles = getComputedStyle(document.documentElement);
	const resolved = styles.getPropertyValue(toneVar).trim();

	return resolved || fallbackColor;
};

const ensureChangelogRendered = async () => {
	if (!els.changelogContent) {
		return;
	}

	if (changelogHtmlCache) {
		els.changelogContent.innerHTML = changelogHtmlCache;
		return;
	}

	els.changelogContent.innerHTML = `
		<div class="popup-skeleton changelog-popup-skeleton" aria-hidden="true">
			<div class="popup-skeleton-line w-35"></div>
			<div class="popup-skeleton-line w-85"></div>
			<div class="popup-skeleton-line w-92"></div>
			<div class="popup-skeleton-line w-80"></div>
			<div class="popup-skeleton-line w-68"></div>
			<div class="popup-skeleton-line w-88"></div>
		</div>
	`;

	try {
		const response = await fetch(CHANGELOG_MARKDOWN_PATH, {
			cache: 'no-store'
		});

		if (!response.ok) {
			throw new Error(`Failed loading changelog (${response.status}).`);
		}

		const markdown = await response.text();
		const rendered = renderChangelogMarkdown(markdown);

		changelogHtmlCache = rendered || '<p class="changelog-note">No changelog entries available.</p>';
		els.changelogContent.innerHTML = changelogHtmlCache;
	} catch (error) {
		console.error(error);
		els.changelogContent.innerHTML = '<p class="changelog-note">Unable to load changelog right now.</p>';
	}
};

const resolveContributorAvatarUrl = async (avatarUrl) => {
	const safeAvatarUrl = String(sanitizeMarkdownUrl(String(avatarUrl || '').trim()) || '').trim();

	if (!safeAvatarUrl) {
		return '';
	}

	if (contributorAvatarObjectUrlCache.has(safeAvatarUrl)) {
		return contributorAvatarObjectUrlCache.get(safeAvatarUrl) || safeAvatarUrl;
	}

	if (typeof caches === 'undefined') {
		return safeAvatarUrl;
	}

	try {
		const cacheStore = await caches.open(CONTRIBUTORS_AVATAR_CACHE_NAME);
		let response = await cacheStore.match(safeAvatarUrl);

		if (!response) {
			response = await fetch(safeAvatarUrl, {
				cache: 'force-cache',
				mode: 'cors'
			});

			if (!response.ok) {
				return safeAvatarUrl;
			}

			await cacheStore.put(safeAvatarUrl, response.clone());
		}

		if (!response.ok) {
			return safeAvatarUrl;
		}

		const avatarBlob = await response.blob();
		const objectUrl = URL.createObjectURL(avatarBlob);

		contributorAvatarObjectUrlCache.set(safeAvatarUrl, objectUrl);

		return objectUrl;
	} catch {
		return safeAvatarUrl;
	}
};

const renderContributors = (contributors) => {
	if (!Array.isArray(contributors) || !contributors.length) {
		return '<p class="changelog-note">No contributors available right now.</p>';
	}

	const people = contributors
		.filter((entry) => String(entry?.name || '').trim())
		.map((entry) => {
			const name = escapeHtml(String(entry.name || '').trim());
			const login = escapeHtml(String(entry.login || '').trim());
			const profileUrl = String(entry.profileUrl || '').trim();
			const avatarUrl = String(entry.cachedAvatarUrl || entry.avatarUrl || '').trim();
			const commits = Number(entry.commits || 0);
			const safeProfileUrl = sanitizeMarkdownUrl(profileUrl);
			const safeAvatarUrl = sanitizeMarkdownUrl(avatarUrl);
			const profileLabel = login ? `@${login}` : 'Profile unavailable';
			const commitsLabel = Number.isFinite(commits) && commits > 0 ? `${commits} commit${commits === 1 ? '' : 's'}` : '';

			return `
				<article class="contributor-item">
					${
						safeAvatarUrl
							? `<img class="contributor-avatar" src="${escapeHtml(safeAvatarUrl)}" alt="${name} profile picture" loading="lazy" />`
							: '<div class="contributor-avatar contributor-avatar-fallback" aria-hidden="true"></div>'
					}
					<div class="contributor-info">
						<p class="contributor-name">${name}</p>
						${safeProfileUrl ? `<a class="changelog-link contributor-link" href="${escapeHtml(safeProfileUrl)}" target="_blank" rel="noopener noreferrer">${profileLabel}</a>` : `<p class="contributor-link-muted">${profileLabel}</p>`}
						${commitsLabel ? `<p class="contributor-commits">${escapeHtml(commitsLabel)}</p>` : ''}
					</div>
				</article>
			`;
		})
		.join('');

	return `<div class="contributors-grid">${people}</div>`;
};

const ensureContributorsRendered = async () => {
	if (!els.contributorsContent) {
		return;
	}

	if (contributorsHtmlCache) {
		els.contributorsContent.innerHTML = contributorsHtmlCache;
		return;
	}

	els.contributorsContent.innerHTML = `
		<div class="popup-skeleton contributors-popup-skeleton" aria-hidden="true">
			<div class="contributor-skeleton-card">
				<div class="contributor-skeleton-avatar"></div>
				<div class="contributor-skeleton-meta">
					<div class="popup-skeleton-line w-70"></div>
					<div class="popup-skeleton-line w-52"></div>
					<div class="popup-skeleton-line w-40"></div>
				</div>
			</div>
			<div class="contributor-skeleton-card">
				<div class="contributor-skeleton-avatar"></div>
				<div class="contributor-skeleton-meta">
					<div class="popup-skeleton-line w-76"></div>
					<div class="popup-skeleton-line w-58"></div>
					<div class="popup-skeleton-line w-44"></div>
				</div>
			</div>
		</div>
	`;

	try {
		const response = await fetch(CONTRIBUTORS_PATH, {
			cache: 'no-store'
		});

		if (!response.ok) {
			throw new Error(`Failed loading contributors (${response.status}).`);
		}

		const payload = await response.json();
		const contributors = Array.isArray(payload?.contributors) ? payload.contributors : [];
		const contributorsWithCachedAvatars = await Promise.all(
			contributors.map(async (entry) => {
				const cachedAvatarUrl = await resolveContributorAvatarUrl(entry?.avatarUrl);

				return {
					...entry,
					cachedAvatarUrl
				};
			})
		);
		const total = Number(payload?.totalContributors || contributors.length || 0);

		contributorsHtmlCache = renderContributors(contributorsWithCachedAvatars);
		els.contributorsContent.innerHTML = contributorsHtmlCache;

		if (els.contributorsMeta) {
			els.contributorsMeta.textContent = `Contributors pulled from repository history | ${total} total`;
		}
	} catch (error) {
		console.error(error);
		els.contributorsContent.innerHTML = '<p class="changelog-note">Unable to load contributors right now.</p>';
	}
};

const getCustomFilterOptions = (filterElement) => {
	if (!filterElement) {
		return [];
	}

	return Array.from(filterElement.querySelectorAll('.custom-select-option'));
};

const closeCustomFilter = (filterElement) => {
	if (!filterElement) {
		return;
	}

	filterElement.classList.remove('is-open');

	const trigger = filterElement.querySelector('.custom-select-trigger');

	if (trigger) {
		trigger.setAttribute('aria-expanded', 'false');
	}
};

const closeAllCustomFilters = (except = null) => {
	const filters = [
		els.controlsCommandFilter,
		els.controlsCommandSort,
		els.controlsFlagFilter,
		els.controlsUserRoleFilter,
		els.controlsUserStatusFilter,
		els.settingsThemePalette,
		els.editorThemeSelect
	].filter(Boolean);

	for (const filter of filters) {
		if (except && filter === except) {
			continue;
		}

		closeCustomFilter(filter);
	}
};

const setCustomFilterValue = (filterElement, value) => {
	if (!filterElement) {
		return '';
	}

	const options = getCustomFilterOptions(filterElement);

	if (!options.length) {
		return '';
	}

	const normalized = String(value || '');
	const selected = options.find((option) => option.getAttribute('data-value') === normalized) || options[0];
	const selectedValue = selected.getAttribute('data-value') || '';
	const selectedLabel = selected.textContent?.trim() || '';

	filterElement.dataset.value = selectedValue;

	const label = filterElement.querySelector('.custom-select-label');

	if (label) {
		label.textContent = selectedLabel;
	}

	for (const option of options) {
		const isSelected = option === selected;

		option.classList.toggle('is-selected', isSelected);
		option.setAttribute('aria-selected', isSelected ? 'true' : 'false');
	}

	return selectedValue;
};

const toggleCustomFilter = (filterElement) => {
	if (!filterElement || filterElement.classList.contains('hidden')) {
		return;
	}

	const isOpen = filterElement.classList.contains('is-open');

	if (isOpen) {
		closeCustomFilter(filterElement);
		return;
	}

	closeAllCustomFilters(filterElement);
	filterElement.classList.add('is-open');

	const trigger = filterElement.querySelector('.custom-select-trigger');

	if (trigger) {
		trigger.setAttribute('aria-expanded', 'true');
	}
};

const getSectionStateElement = (section) => {
	if (section === 'logs') {
		return els.logsState;
	}

	if (section === 'audit') {
		return els.auditState;
	}

	if (section === 'commands') {
		return els.commandsState;
	}

	if (section === 'flags') {
		return els.flagsState;
	}

	if (section === 'users') {
		return els.usersState;
	}

	if (section === 'editor') {
		return els.editorState;
	}

	return null;
};

const getSectionLoadingSkeletonMarkup = (section) => {
	if (section === 'logs') {
		return `
			<div class="section-skeleton section-skeleton-console" aria-hidden="true">
				<div class="section-skeleton-line w-80"></div>
				<div class="section-skeleton-line w-95"></div>
				<div class="section-skeleton-line w-70"></div>
				<div class="section-skeleton-line w-90"></div>
			</div>
		`;
	}

	if (section === 'audit') {
		return `
			<div class="section-skeleton section-skeleton-audit" aria-hidden="true">
				<div class="section-skeleton-item">
					<div class="section-skeleton-line w-35"></div>
					<div class="section-skeleton-line w-85"></div>
				</div>
				<div class="section-skeleton-item">
					<div class="section-skeleton-line w-28"></div>
					<div class="section-skeleton-line w-78"></div>
				</div>
				<div class="section-skeleton-item">
					<div class="section-skeleton-line w-42"></div>
					<div class="section-skeleton-line w-88"></div>
				</div>
			</div>
		`;
	}

	return `
		<div class="section-skeleton section-skeleton-grid" aria-hidden="true">
			<div class="section-skeleton-card">
				<div class="section-skeleton-line w-45"></div>
				<div class="section-skeleton-line w-80"></div>
				<div class="section-skeleton-line w-60"></div>
			</div>
			<div class="section-skeleton-card">
				<div class="section-skeleton-line w-40"></div>
				<div class="section-skeleton-line w-86"></div>
				<div class="section-skeleton-line w-58"></div>
			</div>
			<div class="section-skeleton-card">
				<div class="section-skeleton-line w-50"></div>
				<div class="section-skeleton-line w-76"></div>
				<div class="section-skeleton-line w-66"></div>
			</div>
		</div>
	`;
};

const setSectionState = (section, kind, message = '') => {
	if (!state.sectionStates[section]) {
		return;
	}

	state.sectionStates[section] = {
		kind: String(kind || 'idle'),
		message: String(message || '')
	};
};

const setSectionContentVisibility = (section, visible) => {
	const isVisible = Boolean(visible);

	if (section === 'logs') {
		els.logsConsoleGrid?.classList.toggle('hidden', !isVisible);
		return;
	}

	if (section === 'audit') {
		els.auditWrap?.classList.toggle('hidden', !isVisible);
		return;
	}

	if (section === 'commands') {
		els.commandsWrap?.classList.toggle('hidden', !isVisible);
		return;
	}

	if (section === 'flags') {
		els.flagsWrap?.classList.toggle('hidden', !isVisible);
		return;
	}

	if (section === 'editor') {
		els.editorShell?.classList.toggle('hidden', !isVisible);
	}
};

const renderSectionState = (section) => {
	const target = getSectionStateElement(section);
	const current = state.sectionStates[section] || { kind: 'idle', message: '' };

	if (!target) {
		return;
	}

	if (current.kind === 'idle') {
		target.className = 'section-state hidden';
		target.innerHTML = '';
		return;
	}

	const kind = current.kind;
	const loadingCopyBySection = {
		logs: {
			title: 'Preparing Logger Console',
			message: 'Fetching the latest logger output and building your console view.'
		},
		audit: {
			title: 'Preparing Activity Timeline',
			message: 'Collecting recent activity entries and applying your selected filters.'
		},
		commands: {
			title: 'Preparing Command Controls',
			message: 'Loading command states, categories, and moderation actions.'
		},
		flags: {
			title: 'Preparing Bot Flags',
			message: 'Loading runtime flag states and available toggle actions.'
		},
		users: {
			title: 'Preparing User Controls',
			message: 'Loading users, limits, and moderation status for this panel.'
		},
		editor: {
			title: 'Preparing Command Editor',
			message: 'Loading command files and initializing the editor workspace.'
		},
		profilePictures: {
			title: 'Preparing Profile Picture Album',
			message: 'Loading Pinterest profile picture history and building album cards.'
		}
	};
	const loadingCopy = loadingCopyBySection[section] || {
		title: 'Preparing Section',
		message: 'Fetching the latest data for this section.'
	};
	const title =
		kind === 'loading'
			? loadingCopy.title
			: kind === 'error'
				? 'Unable to load section'
				: kind === 'redacted'
					? 'Restricted content'
					: 'No data found';
	const message =
		current.message ||
		(kind === 'loading'
			? loadingCopy.message
			: kind === 'error'
				? 'Something went wrong while fetching this section.'
				: kind === 'redacted'
					? 'This section is hidden for your role.'
					: 'Nothing to display right now.');
	const retryMarkup =
		kind === 'error'
			? `<div class="section-state-actions"><button type="button" data-section-retry="${section}">Retry</button></div>`
			: '';
	const titleMarkup = kind === 'empty' ? '' : `<p class="section-state-title">${escapeHtml(title)}</p>`;
	const skeletonMarkup = kind === 'loading' ? getSectionLoadingSkeletonMarkup(section) : '';

	target.className = `section-state section-state-${kind}`;
	target.innerHTML = `
		${titleMarkup}
		<p class="section-state-message">${escapeHtml(message)}</p>
		${skeletonMarkup}
		${retryMarkup}
	`;
};

const parseUrlFilterValues = (value) =>
	String(value || '')
		.split(',')
		.map((item) => item.trim().toLowerCase())
		.filter(Boolean);

const fmtAuditCount = (value) => {
	const safeValue = Math.max(0, Number(value || 0));

	if (safeValue > 99) {
		return '99+';
	}

	return String(safeValue);
};

const setAuditChipCount = (chip, count) => {
	if (!chip) {
		return;
	}

	const badge = chip.querySelector('.audit-chip-count');

	if (!badge) {
		return;
	}

	badge.textContent = fmtAuditCount(count);
};

const renderAuditChipCounts = (logs = []) => {
	const safeLogs = Array.isArray(logs) ? logs : [];

	const actionChips = Array.from(els.auditActionChips?.querySelectorAll('button.audit-chip[data-audit-action]') || []);

	actionChips.forEach((chip) => {
		const action = (chip.getAttribute('data-audit-action') || '').toLowerCase();

		if (!action) {
			setAuditChipCount(chip, safeLogs.length);

			return;
		}

		const count = safeLogs.filter((entry) =>
			String(entry?.action || '')
				.toLowerCase()
				.includes(action)
		).length;

		setAuditChipCount(chip, count);
	});

	const roleChips = Array.from(els.auditRoleChips?.querySelectorAll('button.audit-chip[data-audit-role]') || []);

	roleChips.forEach((chip) => {
		const role = (chip.getAttribute('data-audit-role') || '').toLowerCase();

		if (!role) {
			setAuditChipCount(chip, safeLogs.length);
			return;
		}

		const count = safeLogs.filter((entry) => String(entry?.actorRole || '').toLowerCase() === role).length;

		setAuditChipCount(chip, count);
	});
};

const getActiveAuditFilterValues = (container, attrName) => {
	if (!container) {
		return [];
	}

	const activeChips = Array.from(container.querySelectorAll(`.audit-chip.is-active[${attrName}]`));

	return activeChips.map((chip) => chip.getAttribute(attrName) || '').filter((value) => Boolean(value));
};

const setAuditChipValues = (container, attrName, values) => {
	if (!container) {
		return;
	}

	const valueSet = new Set((values || []).filter(Boolean));
	const chips = Array.from(container.querySelectorAll(`.audit-chip[${attrName}]`));
	const allChip = chips.find((chip) => (chip.getAttribute(attrName) || '') === '');

	if (!valueSet.size) {
		chips.forEach((chip) => {
			chip.classList.toggle('is-active', chip === allChip);
		});

		return;
	}

	chips.forEach((chip) => {
		const value = chip.getAttribute(attrName) || '';

		chip.classList.toggle('is-active', value ? valueSet.has(value) : false);
	});
};

const toggleAuditChip = (container, attrName, chip) => {
	if (!container) {
		return;
	}

	const chipValue = chip.getAttribute(attrName) || '';
	const chips = Array.from(container.querySelectorAll(`.audit-chip[${attrName}]`));
	const allChip = chips.find((item) => (item.getAttribute(attrName) || '') === '');

	if (!chipValue) {
		setAuditChipValues(container, attrName, []);
		return;
	}

	chip.classList.toggle('is-active');

	const selectedValues = chips
		.filter((item) => item !== allChip && item.classList.contains('is-active'))
		.map((item) => item.getAttribute(attrName) || '')
		.filter(Boolean);

	if (!selectedValues.length) {
		setAuditChipValues(container, attrName, []);
		return;
	}

	if (allChip) {
		allChip.classList.remove('is-active');
	}

	setAuditChipValues(container, attrName, selectedValues);
};

const syncAuditFiltersToUrl = () => {
	const url = new URL(window.location.href);
	const actionValues = getActiveAuditFilterValues(els.auditActionChips, 'data-audit-action');
	const roleValues = getActiveAuditFilterValues(els.auditRoleChips, 'data-audit-role');
	const query = String(els.auditSearch?.value || '').trim();

	if (actionValues.length) {
		url.searchParams.set(AUDIT_ACTION_PARAM, actionValues.join(','));
	} else {
		url.searchParams.delete(AUDIT_ACTION_PARAM);
	}

	if (roleValues.length) {
		url.searchParams.set(AUDIT_ROLE_PARAM, roleValues.join(','));
	} else {
		url.searchParams.delete(AUDIT_ROLE_PARAM);
	}

	if (query) {
		url.searchParams.set(AUDIT_QUERY_PARAM, query);
	} else {
		url.searchParams.delete(AUDIT_QUERY_PARAM);
	}

	const nextPath = `${url.pathname}${url.search}${url.hash}`;
	const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;

	if (nextPath !== currentPath) {
		history.replaceState(null, '', nextPath);
	}
};

const applyAuditFiltersFromUrl = () => {
	const params = new URLSearchParams(window.location.search);
	const actionValues = parseUrlFilterValues(params.get(AUDIT_ACTION_PARAM));
	const roleValues = parseUrlFilterValues(params.get(AUDIT_ROLE_PARAM));
	const query = String(params.get(AUDIT_QUERY_PARAM) || '');

	setAuditChipValues(els.auditActionChips, 'data-audit-action', actionValues);
	setAuditChipValues(els.auditRoleChips, 'data-audit-role', roleValues);

	if (els.auditSearch) {
		els.auditSearch.value = query;
	}
};

const redirectToLogin = () => {
	window.location.href = '/dashboard/login';
};

const prefetchRoute = (href) => {
	if (!href || typeof document === 'undefined') {
		return;
	}

	if (document.querySelector(`link[data-prefetch-route="${href}"]`)) {
		return;
	}

	const link = document.createElement('link');

	link.rel = 'prefetch';
	link.href = href;
	link.as = 'document';
	link.setAttribute('data-prefetch-route', href);
	document.head.appendChild(link);
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

const navigateToAlbums = () => {
	hideFloatingTooltip();

	if (typeof window !== 'undefined' && window.location.pathname !== ALBUMS_ROUTE_PATH) {
		lastDashboardRouteHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;
	}

	openSeamlessAlbumsPage({ updateHistory: true });
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

const showToast = (message, type = 'info', options = {}) => {
	if (!message) {
		return;
	}

	const { actionLabel = '', onAction = null, duration = 1800, actionExpiresAt = 0 } = options || {};

	const host = ensureToastHost();
	const toast = document.createElement('div');
	let actionCountdownTimer = null;

	toast.className = `toast toast-${type}`;

	const textNode = document.createElement('span');

	textNode.className = 'toast-text';
	textNode.textContent = String(message);
	toast.appendChild(textNode);

	if (actionLabel && typeof onAction === 'function') {
		const actionButton = document.createElement('button');
		const updateActionCountdown = () => {
			if (!actionExpiresAt) {
				actionButton.textContent = String(actionLabel);
				return;
			}

			const remainingMs = Math.max(0, Number(actionExpiresAt) - Date.now());
			const remainingSec = Math.ceil(remainingMs / 1000);

			actionButton.textContent = `${String(actionLabel)} (${remainingSec}s)`;
		};

		actionButton.type = 'button';
		actionButton.className = 'toast-action';
		updateActionCountdown();

		if (actionExpiresAt) {
			actionCountdownTimer = setInterval(() => {
				updateActionCountdown();

				if (Date.now() >= Number(actionExpiresAt)) {
					clearInterval(actionCountdownTimer);
					actionCountdownTimer = null;
					actionButton.disabled = true;
				}
			}, 250);
		}

		actionButton.addEventListener('click', async () => {
			actionButton.disabled = true;

			try {
				await onAction();

				if (actionCountdownTimer) {
					clearInterval(actionCountdownTimer);
					actionCountdownTimer = null;
				}

				toast.classList.remove('visible');
				setTimeout(() => {
					toast.remove();
				}, 220);
			} catch (error) {
				console.error(error);
				showToast(error?.message || 'Undo failed.', 'error');
			} finally {
				actionButton.disabled = false;
			}
		});

		toast.appendChild(actionButton);
	}

	host.appendChild(toast);

	requestAnimationFrame(() => {
		toast.classList.add('visible');
	});

	setTimeout(
		() => {
			if (actionCountdownTimer) {
				clearInterval(actionCountdownTimer);
				actionCountdownTimer = null;
			}

			toast.classList.remove('visible');
			setTimeout(() => {
				toast.remove();
			}, 220);
		},
		Math.max(1200, Number(duration || 1800))
	);
};

const undoDashboardAction = async (token) => {
	const response = await fetch('/api/dashboard/actions/undo', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ token })
	});

	if (response.status === 401) {
		redirectToLogin();
		throw new Error('Unauthorized');
	}

	if (!response.ok) {
		throw new Error('Failed to undo dashboard action');
	}

	return response.json();
};

const getUndoToastType = (risk) => {
	if (risk === 'high') {
		return 'danger';
	}

	if (risk === 'medium') {
		return 'warning';
	}

	return 'success';
};

const showUndoToast = ({ message, undo, onAfterUndo = null }) => {
	if (!undo?.token) {
		showToast(message, 'success');
		return;
	}

	const undoToastType = getUndoToastType(undo.risk);

	showToast(message, undoToastType, {
		actionLabel: undo.actionLabel || 'Undo',
		duration: Math.max(3500, Number(undo.ttlMs || 12000)),
		actionExpiresAt: Number(undo.expiresAt || 0),
		onAction: async () => {
			await undoDashboardAction(undo.token);
			showToast('Last action reverted.', 'success');

			if (typeof onAfterUndo === 'function') {
				await onAfterUndo();
			}
		}
	});
};

const closeConfirmDialog = (accepted) => {
	if (els.confirmDialog) {
		els.confirmDialog.classList.add('hidden');
	}

	if (pendingConfirmResolver) {
		const resolver = pendingConfirmResolver;

		pendingConfirmResolver = null;
		resolver(Boolean(accepted));
	}
};

const closeEditorCloseDialog = (choice) => {
	if (els.editorCloseDialog) {
		closeAnimatedDialog(els.editorCloseDialog);
	}

	if (pendingEditorCloseResolver) {
		const resolver = pendingEditorCloseResolver;

		pendingEditorCloseResolver = null;
		resolver(choice || 'cancel');
	}
};

const openEditorCloseDialog = ({ fileName } = {}) => {
	if (!els.editorCloseDialog || !els.editorCloseMessage) {
		return Promise.resolve(window.confirm('Save changes before closing?') ? 'save' : 'cancel');
	}

	if (pendingEditorCloseResolver) {
		pendingEditorCloseResolver('cancel');
		pendingEditorCloseResolver = null;
	}

	const safeName = String(fileName || 'this file');

	els.editorCloseMessage.textContent = `Save changes to ${safeName} before closing?`;
	openAnimatedDialog(els.editorCloseDialog);

	return new Promise((resolve) => {
		pendingEditorCloseResolver = resolve;
	});
};

const openAnimatedDialog = (dialogElement) => {
	if (!dialogElement) {
		return;
	}

	const activeTimer = dialogHideTimers.get(dialogElement);

	if (activeTimer) {
		clearTimeout(activeTimer);
		dialogHideTimers.delete(dialogElement);
	}

	dialogElement.classList.remove('hidden');

	requestAnimationFrame(() => {
		dialogElement.classList.add('is-visible');
	});
};

const closeAnimatedDialog = (dialogElement) => {
	if (!dialogElement || dialogElement.classList.contains('hidden')) {
		return;
	}

	dialogElement.classList.remove('is-visible');

	const hideTimer = setTimeout(() => {
		dialogElement.classList.add('hidden');
		dialogHideTimers.delete(dialogElement);
	}, DIALOG_ANIMATION_MS);

	dialogHideTimers.set(dialogElement, hideTimer);
};

const closeChangelogDialog = () => {
	if (!els.changelogDialog) {
		return;
	}

	closeAnimatedDialog(els.changelogDialog);
};

const openChangelogDialog = () => {
	if (!els.changelogDialog) {
		return;
	}

	openAnimatedDialog(els.changelogDialog);
	changelogHtmlCache = '';
	void ensureChangelogRendered();
};

const closeContributorsDialog = () => {
	if (!els.contributorsDialog) {
		return;
	}

	closeAnimatedDialog(els.contributorsDialog);
};

const openContributorsDialog = () => {
	if (!els.contributorsDialog) {
		return;
	}

	openAnimatedDialog(els.contributorsDialog);
	contributorsHtmlCache = '';
	void ensureContributorsRendered();
};

const closeLogoutDialog = () => {
	if (!els.logoutDialog || logoutInProgress) {
		return;
	}

	setZenCursorLogoutHoverState(false);

	closeAnimatedDialog(els.logoutDialog);
};

const openLogoutDialog = () => {
	if (!els.logoutDialog) {
		return;
	}

	els.logoutDialog.classList.remove('is-logging-out');

	logoutInProgress = false;

	if (els.logoutMessage) {
		els.logoutMessage.textContent = 'You are about to end your dashboard session and return to login.';
	}

	if (els.logoutWaiting) {
		els.logoutWaiting.classList.add('hidden');
	}

	if (els.logoutCancel) {
		els.logoutCancel.disabled = false;
	}

	if (els.logoutConfirm) {
		els.logoutConfirm.disabled = false;
		els.logoutConfirm.textContent = 'Log Out';
		els.logoutConfirm.classList.remove('is-waiting');
	}

	openAnimatedDialog(els.logoutDialog);
};

const logoutDashboard = async () => {
	if (logoutInProgress) {
		return;
	}

	const logoutStartMs = Date.now();

	logoutInProgress = true;
	lockZenCursorLogoutState();
	els.logoutDialog?.classList.add('is-logging-out');

	if (els.logoutCancel) {
		els.logoutCancel.disabled = true;
	}

	if (els.logoutConfirm) {
		els.logoutConfirm.disabled = true;
		els.logoutConfirm.textContent = 'Logging out...';
		els.logoutConfirm.classList.add('is-waiting');
	}

	if (els.logoutMessage) {
		els.logoutMessage.textContent = 'Closing dashboard session securely.';
	}

	if (els.logoutWaiting) {
		els.logoutWaiting.classList.remove('hidden');
	}

	try {
		await fetch('/api/dashboard/auth/logout', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		});
	} finally {
		const elapsedMs = Date.now() - logoutStartMs;
		const remainingMs = Math.max(0, LOGOUT_MIN_LOADING_MS - elapsedMs);

		if (remainingMs > 0) {
			await new Promise((resolve) => {
				setTimeout(resolve, remainingMs);
			});
		}

		window.location.href = '/dashboard/login';
	}
};

const confirmRiskAction = ({ title, message, confirmLabel = 'Confirm' }) => {
	if (!els.confirmDialog || !els.confirmTitle || !els.confirmMessage || !els.confirmAccept) {
		return Promise.resolve(window.confirm(message || title || 'Are you sure?'));
	}

	if (pendingConfirmResolver) {
		pendingConfirmResolver(false);
		pendingConfirmResolver = null;
	}

	els.confirmTitle.textContent = String(title || 'Confirm Action');
	els.confirmMessage.textContent = String(message || 'Please confirm this action.');
	els.confirmAccept.textContent = String(confirmLabel || 'Confirm');
	els.confirmDialog.classList.remove('hidden');

	return new Promise((resolve) => {
		pendingConfirmResolver = resolve;
	});
};

const ensureFloatingTooltipHost = () => {
	if (floatingTooltipHost) {
		return floatingTooltipHost;
	}

	floatingTooltipHost = document.createElement('div');
	floatingTooltipHost.className = 'custom-tooltip';
	floatingTooltipHost.setAttribute('role', 'tooltip');
	floatingTooltipHost.setAttribute('aria-hidden', 'true');
	document.body.appendChild(floatingTooltipHost);

	return floatingTooltipHost;
};

const placeFloatingTooltip = () => {
	if (!floatingTooltipHost || !floatingTooltipTarget) {
		return;
	}

	const targetRect = floatingTooltipTarget.getBoundingClientRect();
	const gap = 10;
	const edge = 8;

	floatingTooltipHost.style.left = '0px';
	floatingTooltipHost.style.top = '0px';

	const hostRect = floatingTooltipHost.getBoundingClientRect();
	let top = targetRect.top - hostRect.height - gap;
	let placement = 'top';

	if (top < edge) {
		top = targetRect.bottom + gap;
		placement = 'bottom';
	}

	let left = targetRect.left + targetRect.width / 2 - hostRect.width / 2;

	left = Math.max(edge, Math.min(left, window.innerWidth - hostRect.width - edge));

	floatingTooltipHost.dataset.placement = placement;
	floatingTooltipHost.style.left = `${Math.round(left)}px`;
	floatingTooltipHost.style.top = `${Math.round(top)}px`;
};

const showFloatingTooltip = (target) => {
	const text = String(target?.getAttribute('data-tooltip') || '').trim();

	if (!text) {
		return;
	}

	const host = ensureFloatingTooltipHost();

	floatingTooltipTarget = target;
	host.textContent = text;
	host.setAttribute('aria-hidden', 'false');
	host.classList.add('visible');
	placeFloatingTooltip();
};

const hideFloatingTooltip = () => {
	floatingTooltipTarget = null;

	if (!floatingTooltipHost) {
		return;
	}

	floatingTooltipHost.classList.remove('visible');
	floatingTooltipHost.setAttribute('aria-hidden', 'true');
};

const setupFloatingTooltips = () => {
	if (typeof document === 'undefined') {
		return;
	}

	document.addEventListener('mouseover', (event) => {
		const target = event.target.closest('[data-tooltip]');

		if (!target) {
			return;
		}

		const related = event.relatedTarget;

		if (related instanceof Element && target.contains(related)) {
			return;
		}

		showFloatingTooltip(target);
	});

	document.addEventListener('mouseout', (event) => {
		if (!floatingTooltipTarget) {
			return;
		}

		const leavingFrom = event.target.closest('[data-tooltip]');

		if (leavingFrom !== floatingTooltipTarget) {
			return;
		}

		const related = event.relatedTarget;

		if (related instanceof Element && floatingTooltipTarget.contains(related)) {
			return;
		}

		hideFloatingTooltip();
	});

	document.addEventListener('focusin', (event) => {
		const target = event.target.closest('[data-tooltip]');

		if (!target) {
			return;
		}

		showFloatingTooltip(target);
	});

	document.addEventListener('focusout', (event) => {
		if (!floatingTooltipTarget) {
			return;
		}

		const target = event.target.closest('[data-tooltip]');

		if (target === floatingTooltipTarget) {
			hideFloatingTooltip();
		}
	});

	document.addEventListener(
		'click',
		(event) => {
			if (!floatingTooltipTarget) {
				return;
			}

			if (event.target.closest('[data-tooltip]') === floatingTooltipTarget) {
				hideFloatingTooltip();
			}
		},
		true
	);

	document.addEventListener(
		'touchstart',
		() => {
			hideFloatingTooltip();
		},
		{ passive: true, capture: true }
	);

	window.addEventListener(
		'scroll',
		() => {
			placeFloatingTooltip();
		},
		true
	);

	window.addEventListener('resize', () => {
		placeFloatingTooltip();
	});
};

const ensureAuthorizedResponse = (response, fallbackMessage) => {
	if (response.status === 401) {
		redirectToLogin();
		const error = new Error('Unauthorized');

		error.status = 401;
		throw error;
	}

	if (!response.ok) {
		const error = new Error(fallbackMessage);

		error.status = response.status;
		throw error;
	}
};

const fmtBytes = (bytes) => {
	if (!bytes) {
		return '0 B';
	}

	const units = ['B', 'KB', 'MB', 'GB', 'TB'];
	let value = bytes;
	let index = 0;

	while (value >= 1024 && index < units.length - 1) {
		value /= 1024;
		index += 1;
	}

	return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
};

const fmtPercent = (value) => `${Number(value || 0).toFixed(2)}%`;

const normalizeInteger = (value, fallback, min, max) => {
	const parsed = Number.parseInt(String(value || ''), 10);
	const safe = Number.isFinite(parsed) ? parsed : fallback;

	return Math.min(max, Math.max(min, safe));
};

const normalizeDashboardSettings = (source = {}) => {
	const raw = source || {};

	return {
		statusRefreshMs: normalizeInteger(raw.statusRefreshMs, DEFAULT_DASHBOARD_SETTINGS.statusRefreshMs, 1000, 60000),
		logsRefreshMs: normalizeInteger(raw.logsRefreshMs, DEFAULT_DASHBOARD_SETTINGS.logsRefreshMs, 1000, 60000),
		auditRefreshMs: normalizeInteger(raw.auditRefreshMs, DEFAULT_DASHBOARD_SETTINGS.auditRefreshMs, 1000, 60000),
		dataRefreshMs: normalizeInteger(raw.dataRefreshMs, DEFAULT_DASHBOARD_SETTINGS.dataRefreshMs, 2000, 90000),
		chartHistoryLimit: normalizeInteger(raw.chartHistoryLimit, DEFAULT_DASHBOARD_SETTINGS.chartHistoryLimit, 20, 180),
		autosaveDelayMs: normalizeInteger(raw.autosaveDelayMs, DEFAULT_DASHBOARD_SETTINGS.autosaveDelayMs, 500, 30000)
	};
};

const saveDashboardSettings = () => {
	localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state.settings));
};

const updateSettingsSummary = () => {
	if (!els.settingsSummary) {
		return;
	}

	const activePalette = document.documentElement.getAttribute('data-palette') || DEFAULT_THEME_PALETTE;

	els.settingsSummary.textContent = `Palette ${activePalette}, Status ${state.settings.statusRefreshMs}ms, Logs ${state.settings.logsRefreshMs}ms, Audit ${state.settings.auditRefreshMs}ms, Data ${state.settings.dataRefreshMs}ms, History ${state.settings.chartHistoryLimit}, Autosave ${state.settings.autosaveDelayMs}ms`;
};

const syncSettingsInputs = () => {
	if (els.settingsStatusRefreshMs) {
		els.settingsStatusRefreshMs.value = String(state.settings.statusRefreshMs);
	}

	if (els.settingsLogsRefreshMs) {
		els.settingsLogsRefreshMs.value = String(state.settings.logsRefreshMs);
	}

	if (els.settingsAuditRefreshMs) {
		els.settingsAuditRefreshMs.value = String(state.settings.auditRefreshMs);
	}

	if (els.settingsDataRefreshMs) {
		els.settingsDataRefreshMs.value = String(state.settings.dataRefreshMs);
	}

	if (els.settingsChartHistoryLimit) {
		els.settingsChartHistoryLimit.value = String(state.settings.chartHistoryLimit);
	}

	if (els.settingsAutosaveDelayMs) {
		els.settingsAutosaveDelayMs.value = String(state.settings.autosaveDelayMs);
	}

	if (els.settingsThemePalette) {
		setCustomFilterValue(
			els.settingsThemePalette,
			document.documentElement.getAttribute('data-palette') || DEFAULT_THEME_PALETTE
		);
	}

	updateSettingsSummary();
};

const getSettingsFromInputs = () => {
	return normalizeDashboardSettings({
		statusRefreshMs: els.settingsStatusRefreshMs?.value,
		logsRefreshMs: els.settingsLogsRefreshMs?.value,
		auditRefreshMs: els.settingsAuditRefreshMs?.value,
		dataRefreshMs: els.settingsDataRefreshMs?.value,
		chartHistoryLimit: els.settingsChartHistoryLimit?.value,
		autosaveDelayMs: els.settingsAutosaveDelayMs?.value
	});
};

const trimMetricHistoryToLimit = () => {
	const limit = state.settings.chartHistoryLimit;

	for (const list of Object.values(state.metricHistory)) {
		if (Array.isArray(list) && list.length > limit) {
			list.splice(0, list.length - limit);
		}
	}
};

const applyDashboardSettings = (source, options = {}) => {
	const next = normalizeDashboardSettings(source);

	state.settings = next;
	syncSettingsInputs();

	if (options.persist !== false) {
		saveDashboardSettings();
	}
};

const loadDashboardSettings = () => {
	try {
		const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
		const parsed = JSON.parse(raw || '{}');

		applyDashboardSettings({ ...DEFAULT_DASHBOARD_SETTINGS, ...parsed }, { restartPolling: false, persist: false });
	} catch {
		applyDashboardSettings(DEFAULT_DASHBOARD_SETTINGS, { restartPolling: false, persist: false });
	}
};

const startThemeTransition = () => {
	if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		return;
	}

	document.documentElement.classList.add('theme-transitioning');

	if (themeTransitionTimer) {
		clearTimeout(themeTransitionTimer);
	}

	themeTransitionTimer = setTimeout(() => {
		document.documentElement.classList.remove('theme-transitioning');
		themeTransitionTimer = null;
	}, THEME_TRANSITION_MS);
};

const prefersReducedMotion = () =>
	typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const resolveThemeTransitionOrigin = () => {
	if (!els.themeToggle) {
		return { x: Math.round(window.innerWidth / 2), y: Math.round(window.innerHeight / 2) };
	}

	const rect = els.themeToggle.getBoundingClientRect();

	return {
		x: Math.round(rect.left + rect.width / 2),
		y: Math.round(rect.top + rect.height / 2)
	};
};

const startThemeIconMorph = () => {
	if (!els.themeToggle || prefersReducedMotion()) {
		return;
	}

	els.themeToggle.classList.remove('is-switching');
	void els.themeToggle.offsetWidth;
	els.themeToggle.classList.add('is-switching');

	if (themeIconMorphTimer) {
		clearTimeout(themeIconMorphTimer);
	}

	themeIconMorphTimer = setTimeout(() => {
		els.themeToggle?.classList.remove('is-switching');
		themeIconMorphTimer = null;
	}, THEME_ICON_MORPH_MS);
};

const applyTheme = (theme, options = {}) => {
	const safeTheme = theme === 'light' ? 'light' : 'dark';
	const shouldAnimate = options.animate === true;
	const canUseRadialTransition =
		shouldAnimate && typeof document.startViewTransition === 'function' && !prefersReducedMotion();

	const applyThemeState = () => {
		document.documentElement.setAttribute('data-theme', safeTheme);
		renderStatusCharts();

		if (els.themeToggle) {
			els.themeToggle.setAttribute('aria-label', `Switch to ${safeTheme === 'light' ? 'dark' : 'light'} mode`);
		}
	};

	if (canUseRadialTransition) {
		startThemeIconMorph();

		const origin = options.origin || resolveThemeTransitionOrigin();

		document.documentElement.style.setProperty('--theme-origin-x', `${origin.x}px`);
		document.documentElement.style.setProperty('--theme-origin-y', `${origin.y}px`);
		document.startViewTransition(() => {
			applyThemeState();
		});
		return;
	}

	if (shouldAnimate) {
		startThemeTransition();
		startThemeIconMorph();
	}

	applyThemeState();
};

const loadThemePreference = () => {
	try {
		const saved = localStorage.getItem(THEME_STORAGE_KEY);

		if (saved === 'light' || saved === 'dark') {
			applyTheme(saved, { animate: false });
			return;
		}
	} catch {
		// ignore storage read errors and fallback to system preference
	}

	const prefersLight = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches;

	applyTheme(prefersLight ? 'light' : 'dark', { animate: false });
};

const normalizeThemePalette = (palette) => {
	const safePalette = String(palette || '')
		.trim()
		.toLowerCase();

	if (THEME_PALETTES.includes(safePalette)) {
		return safePalette;
	}

	return DEFAULT_THEME_PALETTE;
};

const applyThemePalette = (palette, options = {}) => {
	const safePalette = normalizeThemePalette(palette);

	document.documentElement.setAttribute('data-palette', safePalette);

	if (els.settingsThemePalette) {
		setCustomFilterValue(els.settingsThemePalette, safePalette);
	}

	updateSettingsSummary();
	renderStatusCharts();

	if (options.persist !== false) {
		try {
			localStorage.setItem(THEME_PALETTE_STORAGE_KEY, safePalette);
		} catch {
			// ignore storage write errors
		}
	}
};

const loadThemePalettePreference = () => {
	try {
		const savedPalette = localStorage.getItem(THEME_PALETTE_STORAGE_KEY);

		if (savedPalette) {
			applyThemePalette(savedPalette, { persist: false });
			return;
		}
	} catch {
		// ignore storage read errors and fallback to default palette
	}

	applyThemePalette(DEFAULT_THEME_PALETTE, { persist: false });
};

const toggleThemePreference = () => {
	const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
	const next = current === 'light' ? 'dark' : 'light';

	applyTheme(next, { animate: true, origin: resolveThemeTransitionOrigin() });

	try {
		localStorage.setItem(THEME_STORAGE_KEY, next);
	} catch {
		// ignore storage write errors
	}
};

const clampPercent = (value) => Math.max(0, Math.min(100, Number(value || 0)));

const pushMetricPoint = (key, value) => {
	const list = state.metricHistory[key];

	if (!list) {
		return;
	}

	list.push(clampPercent(value));

	if (list.length > state.settings.chartHistoryLimit) {
		list.splice(0, list.length - state.settings.chartHistoryLimit);
	}
};

const ensureChartHoverTooltipHost = () => {
	if (chartHoverTooltipHost) {
		return chartHoverTooltipHost;
	}

	chartHoverTooltipHost = document.createElement('div');
	chartHoverTooltipHost.className = 'chart-hover-tooltip';
	chartHoverTooltipHost.setAttribute('role', 'status');
	chartHoverTooltipHost.setAttribute('aria-live', 'polite');
	chartHoverTooltipHost.setAttribute('aria-hidden', 'true');
	document.body.appendChild(chartHoverTooltipHost);

	return chartHoverTooltipHost;
};

const showChartHoverTooltip = ({ event, label, value }) => {
	const host = ensureChartHoverTooltipHost();

	host.textContent = `${label}: ${fmtPercent(clampPercent(value))}`;
	host.classList.add('visible');
	host.setAttribute('aria-hidden', 'false');

	const offset = 14;

	host.style.left = '0px';
	host.style.top = '0px';

	const rect = host.getBoundingClientRect();
	let left = event.clientX + offset;
	let top = event.clientY - rect.height - offset;

	if (left + rect.width > window.innerWidth - 8) {
		left = event.clientX - rect.width - offset;
	}

	if (top < 8) {
		top = event.clientY + offset;
	}

	host.style.left = `${Math.round(left)}px`;
	host.style.top = `${Math.round(top)}px`;
};

const hideChartHoverTooltip = () => {
	if (!chartHoverTooltipHost) {
		return;
	}

	chartHoverTooltipHost.classList.remove('visible');
	chartHoverTooltipHost.setAttribute('aria-hidden', 'true');
};

const clearAllChartHoverIndices = () => {
	let changed = false;

	for (const key of Object.keys(state.chartHoverIndices)) {
		if (state.chartHoverIndices[key] !== null) {
			state.chartHoverIndices[key] = null;
			changed = true;
		}
	}

	if (changed) {
		renderStatusCharts();
	}
};

const updateChartHoverIndex = (activeKey, nextIndex) => {
	let changed = false;

	for (const key of Object.keys(state.chartHoverIndices)) {
		const value = key === activeKey ? nextIndex : null;

		if (state.chartHoverIndices[key] !== value) {
			state.chartHoverIndices[key] = value;
			changed = true;
		}
	}

	if (changed) {
		renderStatusCharts();
	}
};

const drawMetricChart = (canvas, points, color, hoverIndex = null) => {
	if (!canvas) {
		return;
	}

	const rect = canvas.getBoundingClientRect();
	const width = Math.max(1, Math.floor(rect.width));
	const height = Math.max(1, Math.floor(rect.height));
	const ratio = window.devicePixelRatio || 1;

	canvas.width = Math.floor(width * ratio);
	canvas.height = Math.floor(height * ratio);

	const ctx = canvas.getContext('2d');
	const isLightTheme = document.documentElement.getAttribute('data-theme') === 'light';
	const baselineColor = isLightTheme ? 'rgba(17, 49, 58, 0.18)' : 'rgba(255, 255, 255, 0.1)';
	const midlineColor = isLightTheme ? 'rgba(17, 49, 58, 0.3)' : 'rgba(255, 255, 255, 0.16)';

	ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
	ctx.clearRect(0, 0, width, height);

	ctx.lineWidth = 1;
	ctx.strokeStyle = baselineColor;
	ctx.beginPath();
	ctx.moveTo(0, height - 0.5);
	ctx.lineTo(width, height - 0.5);
	ctx.stroke();

	ctx.strokeStyle = midlineColor;
	ctx.beginPath();
	ctx.moveTo(0, Math.round(height * 0.5) + 0.5);
	ctx.lineTo(width, Math.round(height * 0.5) + 0.5);
	ctx.stroke();

	if (!points.length) {
		return;
	}

	const gradient = ctx.createLinearGradient(0, 0, 0, height);

	gradient.addColorStop(0, toRgbaWithAlpha(color, 0.34));
	gradient.addColorStop(1, toRgbaWithAlpha(color, 0.02));

	ctx.beginPath();

	for (let i = 0; i < points.length; i += 1) {
		const x = points.length <= 1 ? 0 : (i / (points.length - 1)) * width;
		const y = height - (clampPercent(points[i]) / 100) * height;

		if (i === 0) {
			ctx.moveTo(x, y);
		} else {
			ctx.lineTo(x, y);
		}
	}

	ctx.lineTo(width, height);
	ctx.lineTo(0, height);
	ctx.closePath();
	ctx.fillStyle = gradient;
	ctx.fill();

	ctx.beginPath();

	for (let i = 0; i < points.length; i += 1) {
		const x = points.length <= 1 ? 0 : (i / (points.length - 1)) * width;
		const y = height - (clampPercent(points[i]) / 100) * height;

		if (i === 0) {
			ctx.moveTo(x, y);
		} else {
			ctx.lineTo(x, y);
		}
	}

	ctx.lineJoin = 'round';
	ctx.lineCap = 'round';

	ctx.lineWidth = 3.2;
	ctx.strokeStyle = toRgbaWithAlpha(color, 0.22);
	ctx.stroke();

	ctx.beginPath();

	for (let i = 0; i < points.length; i += 1) {
		const x = points.length <= 1 ? 0 : (i / (points.length - 1)) * width;
		const y = height - (clampPercent(points[i]) / 100) * height;

		if (i === 0) {
			ctx.moveTo(x, y);
		} else {
			ctx.lineTo(x, y);
		}
	}

	ctx.lineWidth = 2.2;
	ctx.strokeStyle = color;
	ctx.stroke();

	if (!Number.isInteger(hoverIndex) || hoverIndex < 0 || hoverIndex >= points.length) {
		return;
	}

	const hoverX = points.length <= 1 ? 0 : (hoverIndex / (points.length - 1)) * width;
	const hoverY = height - (clampPercent(points[hoverIndex]) / 100) * height;

	ctx.save();
	ctx.setLineDash([3, 3]);
	ctx.lineWidth = 1;
	ctx.strokeStyle = isLightTheme ? 'rgba(17, 49, 58, 0.28)' : 'rgba(255, 255, 255, 0.22)';
	ctx.beginPath();
	ctx.moveTo(hoverX + 0.5, 0);
	ctx.lineTo(hoverX + 0.5, height);
	ctx.stroke();
	ctx.restore();

	ctx.beginPath();
	ctx.arc(hoverX, hoverY, 3.6, 0, Math.PI * 2);
	ctx.fillStyle = color;
	ctx.fill();
	ctx.lineWidth = 1.6;
	ctx.strokeStyle = isLightTheme ? 'rgba(255, 255, 255, 0.95)' : 'rgba(7, 21, 26, 0.9)';
	ctx.stroke();
};

renderStatusCharts = () => {
	for (const [key, config] of Object.entries(STATUS_CHART_SERIES)) {
		const chartColor = resolveThemeSeriesColor(config.toneVar, config.fallbackColor);

		drawMetricChart(config.canvas(), state.metricHistory[key], chartColor, state.chartHoverIndices[key]);
	}
};

const setupStatusChartHover = () => {
	const entries = Object.entries(STATUS_CHART_SERIES);

	for (const [key, config] of entries) {
		const canvas = config.canvas();

		if (!canvas) {
			continue;
		}

		canvas.addEventListener('mousemove', (event) => {
			const points = state.metricHistory[key] || [];

			if (!points.length) {
				updateChartHoverIndex(key, null);
				hideChartHoverTooltip();
				return;
			}

			const rect = canvas.getBoundingClientRect();
			const relativeX = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
			const index = points.length <= 1 ? 0 : Math.round((relativeX / rect.width) * (points.length - 1));
			const safeIndex = Math.max(0, Math.min(index, points.length - 1));

			updateChartHoverIndex(key, safeIndex);
			showChartHoverTooltip({
				event,
				label: config.label,
				value: points[safeIndex]
			});
		});

		canvas.addEventListener('mouseleave', () => {
			clearAllChartHoverIndices();
			hideChartHoverTooltip();
		});
	}

	window.addEventListener('scroll', hideChartHoverTooltip, true);
	window.addEventListener('resize', hideChartHoverTooltip);
};

const setOnlineState = (online) => {
	els.connection.textContent = online ? 'live' : 'offline';
	els.connection.style.color = online ? 'var(--mint)' : 'var(--salmon)';

	if (els.statusDot) {
		els.statusDot.style.background = online ? 'var(--mint)' : 'var(--salmon)';
		els.statusDot.style.boxShadow = online ? '0 0 0 0 rgba(135, 240, 193, 0.5)' : '0 0 0 0 rgba(255, 142, 116, 0.5)';
		els.statusDot.style.animation = online ? 'pulse-online 2s infinite' : 'pulse-offline 2s infinite';
	}

	if (!online) {
		els.activeSessions.textContent = 'users: -';
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
	document.body.appendChild(cursor);
	document.body.appendChild(cursorText);
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
		const hoverTarget = event.target;

		setCursorVisibility(true);

		if (hoverTarget instanceof Element) {
			cursor.classList.toggle('is-picker-compact', Boolean(hoverTarget.closest('.clr-picker')));
		} else {
			cursor.classList.remove('is-picker-compact');
		}

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

			if (
				titleText.includes('.jpg') ||
				titleText.includes('.png') ||
				titleText.includes('.jpeg') ||
				titleText.includes('.webp')
			) {
				cursorText.style.backgroundImage = `url(${titleText})`;
				cursorText.innerHTML = '';
				cursorText.classList.add('image-view');
			} else {
				cursorText.style.backgroundImage = 'none';
				cursorText.classList.remove('image-view');
				cursorText.textContent = titleText;
			}
		} else {
			cursorText.style.scale = '0';
		}
	};

	const handleMouseEnterTarget = (event) => {
		const target = event.currentTarget;
		const isLogoutTarget = target === els.logoutButton || target === els.logoutConfirm;
		const isColorPickerTarget = target.closest('.clr-picker') instanceof Element;

		cursor.classList.add('blur-mini');
		cursor.classList.add('cursor-grow');
		cursor.classList.toggle('is-picker-compact', isColorPickerTarget);

		if (isLogoutTarget) {
			setZenCursorLogoutHoverState(true);
		}

		if (isColorPickerTarget) {
			updateTitle('');
			return;
		}

		updateTitle(target.getAttribute('data-title') || target.getAttribute('data-tooltip'));
	};

	const handleMouseLeaveTarget = (event) => {
		const target = event.currentTarget;
		const isLogoutTarget = target === els.logoutButton || target === els.logoutConfirm;

		cursor.classList.remove('blur-mini');
		cursor.classList.remove('cursor-grow');
		cursor.classList.remove('is-picker-compact');

		if (isLogoutTarget) {
			setZenCursorLogoutHoverState(false);
		}

		updateTitle('');
	};

	const handleMouseEnterChart = () => {
		cursor.classList.add('is-chart-compact');
		updateTitle('');
	};

	const handleMouseLeaveChart = () => {
		cursor.classList.remove('is-chart-compact');
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
	window.addEventListener('pointermove', moveCursor);
	window.addEventListener('mousedown', handleMouseDown);
	window.addEventListener('mouseup', handleMouseUp);
	window.addEventListener('blur', handleWindowBlur);
	window.addEventListener('focus', handleWindowFocus);
	document.addEventListener('visibilitychange', handleVisibilityChange);
	document.addEventListener('mouseout', handleDocumentMouseOut);
	document.addEventListener('mouseenter', handleDocumentMouseEnter);

	const cachedPointer = readCachedZenPointerPosition();

	if (cachedPointer) {
		moveCursor({
			clientX: cachedPointer.x,
			clientY: cachedPointer.y
		});
	}

	const attachListeners = () => {
		const targets = document.querySelectorAll('a, button, [data-title], [data-tooltip]');
		const chartTargets = document.querySelectorAll('.status-chart');

		targets.forEach((target) => {
			target.addEventListener('mouseenter', handleMouseEnterTarget);
			target.addEventListener('mouseleave', handleMouseLeaveTarget);
		});

		chartTargets.forEach((chart) => {
			chart.addEventListener('mouseenter', handleMouseEnterChart);
			chart.addEventListener('mouseleave', handleMouseLeaveChart);
		});

		return () => {
			targets.forEach((target) => {
				target.removeEventListener('mouseenter', handleMouseEnterTarget);
				target.removeEventListener('mouseleave', handleMouseLeaveTarget);
			});

			chartTargets.forEach((chart) => {
				chart.removeEventListener('mouseenter', handleMouseEnterChart);
				chart.removeEventListener('mouseleave', handleMouseLeaveChart);
			});
		};
	};

	let cleanupListeners = attachListeners();

	const observer = new MutationObserver(() => {
		cleanupListeners();
		cleanupListeners = attachListeners();
	});

	observer.observe(document.body, { childList: true, subtree: true });

	window.addEventListener('beforeunload', () => {
		window.removeEventListener('mousemove', moveCursor);
		window.removeEventListener('pointermove', moveCursor);
		window.removeEventListener('mousedown', handleMouseDown);
		window.removeEventListener('mouseup', handleMouseUp);
		window.removeEventListener('blur', handleWindowBlur);
		window.removeEventListener('focus', handleWindowFocus);
		document.removeEventListener('visibilitychange', handleVisibilityChange);
		document.removeEventListener('mouseout', handleDocumentMouseOut);
		document.removeEventListener('mouseenter', handleDocumentMouseEnter);
		cleanupListeners();
		observer.disconnect();
	});

	return true;
};

const getAlertSeverityRank = (severity) => {
	if (severity === 'critical') {
		return 3;
	}

	if (severity === 'warning') {
		return 2;
	}

	return 1;
};

const getRecentErrorSpikeCount = () => {
	const recent = [...state.botLogs, ...state.dashboardLogs]
		.sort((a, b) => Number(a?.timestamp || 0) - Number(b?.timestamp || 0))
		.slice(-ALERT_RULES.errorSpikeWindowSize);

	return recent.filter((entry) => {
		const message = String(entry?.message || '').replace(ansiRegex, '');

		return ERROR_SPIKE_PATTERN.test(message);
	}).length;
};

const buildActiveAlerts = () => {
	const alerts = [];
	const { sysCpu, procCpu, memoryPercent } = state.alertSnapshot;

	if (sysCpu >= ALERT_RULES.systemCpuWarn) {
		alerts.push({
			severity: sysCpu >= ALERT_RULES.systemCpuCritical ? 'critical' : 'warning',
			title: 'High System CPU',
			message: `System CPU is ${fmtPercent(sysCpu)} (threshold ${ALERT_RULES.systemCpuWarn}%).`
		});
	}

	if (procCpu >= ALERT_RULES.processCpuWarn) {
		alerts.push({
			severity: procCpu >= ALERT_RULES.processCpuCritical ? 'critical' : 'warning',
			title: 'High Process CPU',
			message: `Process CPU is ${fmtPercent(procCpu)} (threshold ${ALERT_RULES.processCpuWarn}%).`
		});
	}

	if (memoryPercent >= ALERT_RULES.memoryWarn) {
		alerts.push({
			severity: memoryPercent >= ALERT_RULES.memoryCritical ? 'critical' : 'warning',
			title: 'High Memory Usage',
			message: `Memory usage is ${fmtPercent(memoryPercent)} (threshold ${ALERT_RULES.memoryWarn}%).`
		});
	}

	const errorSpikeCount = getRecentErrorSpikeCount();

	if (errorSpikeCount >= ALERT_RULES.errorSpikeWarnCount) {
		alerts.push({
			severity: errorSpikeCount >= ALERT_RULES.errorSpikeCriticalCount ? 'critical' : 'warning',
			title: 'Error Spike Detected',
			message: `${errorSpikeCount} error-like logs in latest ${ALERT_RULES.errorSpikeWindowSize} entries.`
		});
	}

	return alerts.sort((a, b) => getAlertSeverityRank(b.severity) - getAlertSeverityRank(a.severity));
};

const renderHeaderAlerts = () => {
	if (!els.headerAlerts || !els.headerAlertTitle || !els.headerAlertMessage || !els.headerAlertMeta) {
		return;
	}

	const alerts = buildActiveAlerts();

	if (!alerts.length) {
		els.headerAlerts.className = 'header-alerts hidden';
		els.headerAlertTitle.textContent = 'System alert';
		els.headerAlertMessage.textContent = 'Threshold warning detected.';
		els.headerAlertMeta.textContent = 'No active alert.';
		return;
	}

	const topAlert = alerts[0];
	const additionalCount = Math.max(0, alerts.length - 1);
	const metaText =
		additionalCount > 0
			? `${additionalCount} additional alert${additionalCount === 1 ? '' : 's'} active.`
			: 'Monitoring active thresholds in realtime.';

	els.headerAlerts.className = `header-alerts header-alerts-${topAlert.severity}`;
	els.headerAlertTitle.textContent = topAlert.title;
	els.headerAlertMessage.textContent = topAlert.message;
	els.headerAlertMeta.textContent = metaText;
};

const setupAlertDebugHooks = () => {
	if (typeof window === 'undefined') {
		return;
	}

	const pushSyntheticSpikeLogs = (count) => {
		const now = Date.now();
		const entries = Array.from({ length: count }, (_, index) => ({
			id: now + index,
			timestamp: now + index,
			message: `ERROR [debug] synthetic spike event ${index + 1}`
		}));

		state.dashboardLogs = [...state.dashboardLogs, ...entries].slice(-500);
	};

	window.dashboardAlertDebug = {
		triggerWarningSpike() {
			state.alertSnapshot.sysCpu = ALERT_RULES.systemCpuWarn + 1;
			state.alertSnapshot.procCpu = 0;
			state.alertSnapshot.memoryPercent = 0;
			pushSyntheticSpikeLogs(ALERT_RULES.errorSpikeWarnCount);
			renderHeaderAlerts();
		},
		triggerCriticalSpike() {
			state.alertSnapshot.sysCpu = ALERT_RULES.systemCpuCritical + 1;
			state.alertSnapshot.procCpu = ALERT_RULES.processCpuCritical + 1;
			state.alertSnapshot.memoryPercent = ALERT_RULES.memoryCritical + 1;
			pushSyntheticSpikeLogs(ALERT_RULES.errorSpikeCriticalCount);
			renderHeaderAlerts();
		},
		clear() {
			state.alertSnapshot.sysCpu = 0;
			state.alertSnapshot.procCpu = 0;
			state.alertSnapshot.memoryPercent = 0;
			state.dashboardLogs = state.dashboardLogs.filter(
				(entry) => !String(entry?.message || '').includes('[debug] synthetic spike event')
			);
			renderHeaderAlerts();
		}
	};
};

const renderStatus = (payload) => {
	const now = new Date(payload.timestamp);

	els.clock.textContent = now.toLocaleString();

	const sysCpu = payload.system.cpuPercent;
	const procCpu = payload.process.cpuPercent;
	const usedMemory = payload.system.totalMemory - payload.system.freeMemory;
	const memoryPercent = (usedMemory / payload.system.totalMemory) * 100;

	els.sysCpu.textContent = fmtPercent(sysCpu);
	els.procCpu.textContent = fmtPercent(procCpu);
	els.memory.textContent = `${fmtBytes(usedMemory)} / ${fmtBytes(payload.system.totalMemory)}`;
	state.alertSnapshot.sysCpu = clampPercent(sysCpu);
	state.alertSnapshot.procCpu = clampPercent(procCpu);
	state.alertSnapshot.memoryPercent = clampPercent(memoryPercent);

	pushMetricPoint('sysCpu', sysCpu);
	pushMetricPoint('procCpu', procCpu);
	pushMetricPoint('memoryPercent', memoryPercent);
	renderStatusCharts();

	els.commandsCount.textContent = String(payload.commands.total);
	els.commandsSub.textContent = `enabled ${payload.commands.enabled}, disabled ${payload.commands.disabled}`;

	els.activeSessions.textContent = `users: ${Number(payload.sessions?.activeUsers || 0)}`;

	const versionLabel = payload.project?.version || 'unknown';

	if (els.projectVersionValue) {
		els.projectVersionValue.textContent = versionLabel;
	} else {
		els.projectVersion.textContent = `Version: ${versionLabel}`;
	}

	if (els.changelogMeta) {
		els.changelogMeta.textContent = `Latest updates from CHANGELOG.md | Current version ${versionLabel}`;
	}

	renderHeaderAlerts();
	renderSpotifyNowPlaying(payload.spotify);
};

const formatSpotifyTime = (value) => {
	const totalSeconds = Math.max(0, Math.floor(Number(value || 0) / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const getSpotifyLinkTargets = (data) => {
	const trackUri = String(data?.trackUri || '').trim();
	const trackUrl = String(data?.trackUrl || '').trim();

	if (trackUri) {
		return { primary: trackUri, fallback: trackUrl || '' };
	}

	if (trackUrl) {
		return { primary: trackUrl, fallback: '' };
	}

	return { primary: '', fallback: '' };
};

const applySpotifyLink = (element, data) => {
	if (!element) {
		return;
	}

	const { primary, fallback } = getSpotifyLinkTargets(data);
	const href = primary || fallback || '#';

	element.dataset.spotifyPrimary = primary;
	element.dataset.spotifyFallback = fallback;
	element.href = href;
	element.classList.toggle('is-disabled', href === '#');
	element.setAttribute('aria-disabled', href === '#' ? 'true' : 'false');
};

const updateSpotifyProgress = ({ force } = {}) => {
	if (!latestSpotify) {
		return;
	}

	const available = Boolean(latestSpotify.available);
	const isPlaying = Boolean(latestSpotify.isPlaying);
	const shouldShow = available && isPlaying;

	if (!shouldShow) {
		return;
	}

	const durationMs = Number(latestSpotify.durationMs || 0);
	const baseProgressMs = Number(latestSpotify.progressMs || 0);
	const now = Date.now();
	const elapsedMs = force ? 0 : Math.max(0, now - spotifyLastProgressAt);
	const nextProgressMs = durationMs > 0 ? Math.min(durationMs, baseProgressMs + elapsedMs) : baseProgressMs + elapsedMs;
	const ratio = durationMs > 0 ? Math.min(1, Math.max(0, nextProgressMs / durationMs)) : 0;
	const durationLabel = durationMs > 0 ? formatSpotifyTime(durationMs) : '--:--';
	const progressLabel = formatSpotifyTime(nextProgressMs);
	const fullDurationLabel = `${progressLabel} / ${durationLabel}`;

	latestSpotify.progressMs = nextProgressMs;
	spotifyLastProgressAt = now;

	if (els.spotifyProgress) {
		els.spotifyProgress.style.width = `${Math.round(ratio * 100)}%`;
		els.spotifyProgress.setAttribute('title', fullDurationLabel);
	}

	if (els.spotifyTimestamp) {
		els.spotifyTimestamp.textContent = fullDurationLabel;
	}

	if (els.spotifyPopupTimestamp) {
		els.spotifyPopupTimestamp.textContent = fullDurationLabel;
	}
};

const startSpotifyProgressTicker = () => {
	if (spotifyProgressTimer) {
		return;
	}

	spotifyProgressTimer = setInterval(() => {
		updateSpotifyProgress();
	}, 1000);
};

const applySpotifyCoverColor = (img, container) => {
	if (!img || !container) {
		return;
	}

	const extract = async () => {
		try {
			if (!window.Vibrant || !img.complete || img.naturalWidth === 0) {
				return;
			}

			const palette = await window.Vibrant.from(img).getPalette();

			const vibrant = palette.Vibrant || palette.LightVibrant || palette.Muted;
			const dark = palette.DarkVibrant || palette.DarkMuted || vibrant;

			if (!vibrant) {
				return;
			}

			const [r1, g1, b1] = vibrant.rgb.map(Math.round);
			const [r2, g2, b2] = dark.rgb.map(Math.round);

			container.style.setProperty('--spotify-cover-color', `rgb(${r1},${g1},${b1})`);
			container.style.setProperty('--spotify-cover-color-2', `rgb(${r2},${g2},${b2})`);

			const waveSvg = encodeURIComponent(
				`<svg xmlns='http://www.w3.org/2000/svg' width='40' height='12' viewBox='0 0 40 12'>
					<path d='M0 6 C7.33 1,12.67 1,20 6 C27.33 11,32.67 11,40 6' fill='none' stroke='rgb(${r1},${g1},${b1})' stroke-width='2.5' stroke-linecap='round'/>
				</svg>`
			);
			const pausedSvg = encodeURIComponent(
				`<svg xmlns='http://www.w3.org/2000/svg' width='40' height='12' viewBox='0 0 40 12'>
					<path d='M0 6 L40 6' fill='none' stroke='rgb(${r1},${g1},${b1})' stroke-opacity='0.42' stroke-width='2.5' stroke-linecap='round'/>
				</svg>`
			);

			container.style.setProperty('--spotify-wave-image', `url("data:image/svg+xml,${waveSvg}")`);
			container.style.setProperty('--spotify-paused-image', `url("data:image/svg+xml,${pausedSvg}")`);
		} catch {
			// CORS or Vibrant decode error — keep CSS defaults
		}
	};

	if (img.complete && img.naturalWidth > 0) {
		extract();
	} else {
		img.addEventListener('load', extract, { once: true });
	}
};

const renderSpotifyNowPlaying = (payload) => {
	if (!els.spotifyNowPlaying) {
		return;
	}

	const data = payload || {};
	const available = Boolean(data.available);
	const isPlaying = Boolean(data.isPlaying);
	const trackTitle = String(data.trackTitle || '').trim() + (available && !isPlaying ? ' (Paused)' : '');
	const artists = String(data.artists || '').trim();
	const message = String(data.message || '').trim();
	const durationMs = Number(data.durationMs || 0);
	const progressMs = Number(data.progressMs || 0);
	const coverUrl = String(data.coverUrl || '').trim();

	latestSpotify = {
		...data,
		available,
		isPlaying,
		durationMs,
		progressMs
	};
	spotifyLastProgressAt = Date.now();

	els.spotifyNowPlaying.classList.toggle('is-playing', isPlaying);
	els.spotifyNowPlaying.classList.toggle('is-idle', available && !isPlaying);
	els.spotifyNowPlaying.classList.toggle('is-unavailable', !available);

	els.spotifyNowPlaying.classList.toggle('hidden', !available);

	if (!available) {
		closeSpotifyPopup();
		return;
	}

	if (els.spotifyTrack) {
		els.spotifyTrack.textContent = trackTitle || message || 'Spotify idle';
	}

	if (els.spotifyArtist) {
		els.spotifyArtist.textContent = artists || '-';
	}

	if (isPlaying) {
		updateSpotifyProgress({ force: true });
	} else {
		const durationLabel = durationMs > 0 ? formatSpotifyTime(durationMs) : '--:--';
		const pausedLabel = `${formatSpotifyTime(progressMs)} / ${durationLabel}`;
		const ratio = durationMs > 0 ? Math.min(1, Math.max(0, progressMs / durationMs)) : 0;

		if (els.spotifyProgress) {
			els.spotifyProgress.style.width = `${Math.round(ratio * 100)}%`;
			els.spotifyProgress.setAttribute('title', pausedLabel);
		}

		if (els.spotifyTimestamp) {
			els.spotifyTimestamp.textContent = pausedLabel;
		}

		if (els.spotifyPopupTimestamp) {
			els.spotifyPopupTimestamp.textContent = pausedLabel;
		}
	}

	if (els.spotifyCover) {
		if (coverUrl) {
			const currentCover = els.spotifyCover.dataset.coverUrl || '';

			if (currentCover !== coverUrl) {
				els.spotifyCover.dataset.coverUrl = coverUrl;
				els.spotifyCover.crossOrigin = 'anonymous';
				els.spotifyCover.src = coverUrl;
				applySpotifyCoverColor(els.spotifyCover, els.spotifyNowPlaying);
			}

			els.spotifyCover.removeAttribute('aria-hidden');
			els.spotifyCover.alt = `${trackTitle} cover`;
		} else {
			els.spotifyCover.removeAttribute('src');
			els.spotifyCover.dataset.coverUrl = '';
			els.spotifyCover.setAttribute('aria-hidden', 'true');
			els.spotifyNowPlaying?.style.removeProperty('--spotify-cover-color');
			els.spotifyNowPlaying?.style.removeProperty('--spotify-cover-color-2');
		}
	}

	applySpotifyLink(els.spotifyLink, data);
	applySpotifyLink(els.spotifyPopupLink, data);

	if (els.spotifyPopupTrack) {
		els.spotifyPopupTrack.textContent = trackTitle || message || 'Spotify idle';
	}

	if (els.spotifyPopupArtist) {
		els.spotifyPopupArtist.textContent = artists || '-';
	}

	if (els.spotifyPopupCover) {
		if (coverUrl) {
			const currentCover = els.spotifyPopupCover.dataset.coverUrl || '';

			if (currentCover !== coverUrl) {
				els.spotifyPopupCover.dataset.coverUrl = coverUrl;
				els.spotifyPopupCover.src = coverUrl;
			}

			els.spotifyPopupCover.removeAttribute('aria-hidden');
			els.spotifyPopupCover.alt = `${trackTitle} cover`;
		} else {
			els.spotifyPopupCover.removeAttribute('src');
			els.spotifyPopupCover.dataset.coverUrl = '';
			els.spotifyPopupCover.setAttribute('aria-hidden', 'true');
		}
	}
};

const closeSpotifyPopup = () => {
	els.spotifyPopup?.classList.add('hidden');
};

const openSpotifyPopup = () => {
	if (!els.spotifyPopup || !latestSpotify?.isPlaying) {
		return;
	}

	els.spotifyPopup.classList.remove('hidden');
};

const handleSpotifyLinkClick = (event) => {
	const link = event.currentTarget;

	if (!link) {
		return;
	}

	const primary = link.dataset.spotifyPrimary || '';
	const fallback = link.dataset.spotifyFallback || '';

	if (!primary) {
		event.preventDefault();
		return;
	}

	if (primary.startsWith('spotify:') && fallback) {
		event.preventDefault();
		window.open(primary, '_blank', 'noopener,noreferrer');
	}
};

const fetchSpotifyStatus = async () => {
	try {
		const response = await fetch('/api/dashboard/spotify', { cache: 'no-store' });

		if (!response.ok) {
			throw new Error('Spotify unavailable');
		}

		const payload = await response.json();

		renderSpotifyNowPlaying(payload.spotify || payload);
	} catch {
		renderSpotifyNowPlaying({ available: false, message: 'Spotify unavailable' });
	}
};

const startSpotifyPolling = () => {
	if (spotifyPollTimer) {
		return;
	}

	void fetchSpotifyStatus();
	spotifyPollTimer = setInterval(() => {
		void fetchSpotifyStatus();
	}, 1000);
};

const renderUsersKpi = () => {
	const users = Array.isArray(state.users) ? state.users : [];
	const total = users.length;
	const premium = users.filter((user) => Boolean(user?.premium)).length;
	const banned = users.filter((user) => Boolean(user?.banned)).length;
	const blocked = users.filter((user) => Boolean(user?.blocked)).length;
	const lowLimit = users.filter((user) => Math.max(0, Number.parseInt(user?.limit, 10) || 0) <= 5).length;

	if (els.usersKpiTotal) {
		els.usersKpiTotal.textContent = String(total);
	}

	if (els.usersKpiPremium) {
		els.usersKpiPremium.textContent = String(premium);
	}

	if (els.usersKpiBanned) {
		els.usersKpiBanned.textContent = String(banned);
	}

	if (els.usersKpiBlocked) {
		els.usersKpiBlocked.textContent = String(blocked);
	}

	if (els.usersKpiLowLimit) {
		els.usersKpiLowLimit.textContent = String(lowLimit);
	}
};

const renderLogs = () => {
	if (!state.canEdit) {
		els.logsPanel?.classList.add('hidden');
		return;
	}

	els.logsPanel?.classList.remove('hidden');

	if (state.sectionStates.logs.kind === 'loading' || state.sectionStates.logs.kind === 'error') {
		setSectionContentVisibility('logs', false);
		renderSectionState('logs');
		return;
	}

	setSectionContentVisibility('logs', true);

	if (!state.dashboardLogs.length && !state.botLogs.length) {
		setSectionState('logs', 'empty', 'No live logs yet. New log entries will appear here automatically.');
		renderSectionState('logs');

		if (els.dashboardLoggerConsole) {
			els.dashboardLoggerConsole.textContent = '';
		}

		if (els.botLoggerConsole) {
			els.botLoggerConsole.textContent = '';
		}

		return;
	}

	setSectionState('logs', 'idle');
	renderSectionState('logs');

	const formatLogsText = (entries) =>
		(entries || [])
			.slice(-300)
			.map(
				(entry) => `[${new Date(entry.timestamp).toLocaleTimeString()}] ${String(entry.message || '').replace(ansiRegex, '')}`
			)
			.join('\n');

	if (els.dashboardLoggerConsole) {
		els.dashboardLoggerConsole.textContent = formatLogsText(state.dashboardLogs);
		els.dashboardLoggerConsole.scrollTop = els.dashboardLoggerConsole.scrollHeight;
	}

	if (els.botLoggerConsole) {
		els.botLoggerConsole.textContent = formatLogsText(state.botLogs);
		els.botLoggerConsole.scrollTop = els.botLoggerConsole.scrollHeight;
	}

	renderHeaderAlerts();
};

const appendRealtimeLogs = ({ target, incoming, limit = 500 } = {}) => {
	if (!Array.isArray(target) || !Array.isArray(incoming) || !incoming.length) {
		return;
	}

	const seenIds = new Set(target.map((entry) => Number(entry?.id || 0)).filter((id) => id > 0));

	for (const entry of incoming) {
		const entryId = Number(entry?.id || 0);

		if (entryId > 0 && seenIds.has(entryId)) {
			continue;
		}

		target.push(entry);

		if (entryId > 0) {
			seenIds.add(entryId);
		}
	}

	if (target.length > limit) {
		target.splice(0, target.length - limit);
	}
};

const renderAudit = () => {
	if (!els.auditList) {
		return;
	}

	if (!state.canEdit) {
		els.auditPanel?.classList.add('hidden');
		return;
	}

	els.auditPanel?.classList.remove('hidden');

	if (state.sectionStates.audit.kind === 'loading' || state.sectionStates.audit.kind === 'error') {
		setSectionContentVisibility('audit', false);
		renderSectionState('audit');
		return;
	}

	setSectionContentVisibility('audit', true);

	if (!state.auditLogs.length) {
		setSectionState('audit', 'empty', 'No activity found for the current filters.');
		setSectionContentVisibility('audit', false);
		renderSectionState('audit');
		els.auditList.innerHTML = '';
		return;
	}

	setSectionState('audit', 'idle');
	renderSectionState('audit');

	els.auditList.innerHTML = state.auditLogs
		.slice()
		.reverse()
		.map((entry) => {
			const when = new Date(entry.timestamp || Date.now()).toLocaleString();
			const role = escapeHtml(entry.actorRole || 'system');
			const actor = escapeHtml(entry.actor || 'system');
			const action = escapeHtml(entry.action || 'unknown');
			const target = entry.target
				? `<span class="target">${escapeHtml(entry.target)}</span>`
				: '<span class="target">-</span>';
			const status = entry.status === 'failed' ? 'failed' : 'ok';
			const message = entry.message ? `<p class="audit-message">${escapeHtml(entry.message)}</p>` : '';

			return `
				<li class="audit-item ${status}">
					<div class="audit-topline">
						<span>${escapeHtml(when)}</span>
						<span class="audit-role ${role}">${role}</span>
						<span>${actor}</span>
					</div>
					<p class="audit-main">
						<strong>${action}</strong>
						<span>-> ${target}</span>
						<span class="status ${status}">(${status})</span>
					</p>
					${message}
				</li>
			`;
		})
		.join('');
};

const commandCardMarkup = (command, keyword = '') => {
	const aliases = command.aliases.length ? command.aliases.join(', ') : '-';
	const statusClass = command.enabled ? 'enabled' : 'disabled';
	const commandTitle = state.canEdit
		? command.enabled
			? `Disable command ${escapeHtml(command.name)}`
			: `Enable command ${escapeHtml(command.name)}`
		: command.enabled
			? `Command ${escapeHtml(command.name)} is enabled`
			: `Command ${escapeHtml(command.name)} is disabled`;
	const highlightedName = highlightMatch(command.name, keyword);
	const highlightedAliases = highlightMatch(aliases, keyword);
	const usageCount = Number(command.usageCount || 0).toLocaleString();

	const actionMarkup = state.canEdit
		? `<button class="toggle-btn ios-toggle ${command.enabled ? 'is-on' : 'is-off'}" data-command="${command.name}" data-enabled="${String(!command.enabled)}" data-tooltip="${commandTitle}" role="switch" aria-checked="${command.enabled ? 'true' : 'false'}" aria-label="${commandTitle}"><span class="ios-toggle-track" aria-hidden="true"><span class="ios-toggle-thumb"></span></span></button>`
		: `<button class="toggle-btn ios-toggle ${command.enabled ? 'is-on' : 'is-off'} inactive" data-command="${command.name}" data-enabled="${String(!command.enabled)}" data-tooltip="${commandTitle}" role="switch" aria-checked="${command.enabled ? 'true' : 'false'}" aria-label="${commandTitle}"><span class="ios-toggle-track" aria-hidden="true"><span class="ios-toggle-thumb"></span></span></button>`;

	return `
		<article class="command-card ${statusClass}">
			<div class="command-card-head">
				<strong class="command-name">${highlightedName}</strong>
				${actionMarkup}
			</div>
			<p class="command-aliases"><span>Aliases:</span> ${highlightedAliases}</p>
			<div class="command-meta">
				<span>Cooldown: ${command.cooldown}s</span>
				<span>Limit: ${command.limit}</span>
				<span>Used: ${usageCount}</span>
			</div>
		</article>
	`;
};

const getCategoryKey = (category) => encodeURIComponent(category);

const loadCollapsedCategories = () => {
	try {
		const raw = localStorage.getItem(COLLAPSE_STORAGE_KEY);
		const parsed = JSON.parse(raw || '[]');

		if (!Array.isArray(parsed)) {
			return;
		}

		state.collapsedCategories = new Set(parsed.map((value) => String(value)));
	} catch {
		state.collapsedCategories = new Set();
	}
};

const saveCollapsedCategories = () => {
	localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify(Array.from(state.collapsedCategories)));
};

const loadActiveFolder = () => {
	try {
		const value = localStorage.getItem(ACTIVE_FOLDER_STORAGE_KEY);

		if (value === 'commands' || value === 'flags' || value === 'users' || value === 'editor') {
			state.activeFolder = value;
		}
	} catch {
		state.activeFolder = 'commands';
	}
};

const setActiveFolder = (folderName) => {
	const nextFolder = ['commands', 'flags', 'users', 'editor'].includes(folderName) ? folderName : 'commands';

	state.activeFolder = nextFolder === 'editor' && !state.canEdit ? 'commands' : nextFolder;
	const isCommands = state.activeFolder === 'commands';
	const isFlags = state.activeFolder === 'flags';
	const isUsers = state.activeFolder === 'users';
	const isEditor = state.activeFolder === 'editor';

	els.commandsView.classList.toggle('hidden', !isCommands);
	els.flagsView.classList.toggle('hidden', !isFlags);
	els.usersView.classList.toggle('hidden', !isUsers);
	els.editorView?.classList.toggle('hidden', !isEditor);

	const toggles = els.folderSwitcher.querySelectorAll('button[data-folder-toggle]');

	for (const toggle of toggles) {
		const isActive = toggle.getAttribute('data-folder-toggle') === state.activeFolder;

		toggle.classList.toggle('is-active', isActive);
		toggle.setAttribute('aria-selected', isActive ? 'true' : 'false');
	}

	if (els.controlsSearch) {
		els.controlsSearch.placeholder = SEARCH_PLACEHOLDERS[state.activeFolder] || SEARCH_PLACEHOLDERS.commands;
		els.controlsSearch.value = state.searchByFolder[state.activeFolder] || '';
	}

	if (els.controlsCommandFilter) {
		els.controlsCommandFilter.classList.toggle('hidden', state.activeFolder !== 'commands');
		setCustomFilterValue(els.controlsCommandFilter, state.searchFilters.commandsState);

		if (state.activeFolder !== 'commands') {
			closeCustomFilter(els.controlsCommandFilter);
		}
	}

	if (els.controlsCommandSort) {
		els.controlsCommandSort.classList.toggle('hidden', state.activeFolder !== 'commands');
		setCustomFilterValue(els.controlsCommandSort, state.searchFilters.commandsSort);

		if (state.activeFolder !== 'commands') {
			closeCustomFilter(els.controlsCommandSort);
		}
	}

	if (els.controlsFlagFilter) {
		els.controlsFlagFilter.classList.toggle('hidden', state.activeFolder !== 'flags');
		setCustomFilterValue(els.controlsFlagFilter, state.searchFilters.flagsState);

		if (state.activeFolder !== 'flags') {
			closeCustomFilter(els.controlsFlagFilter);
		}
	}

	if (els.controlsUserRoleFilter) {
		els.controlsUserRoleFilter.classList.toggle('hidden', state.activeFolder !== 'users');
		setCustomFilterValue(els.controlsUserRoleFilter, state.searchFilters.usersRole);

		if (state.activeFolder !== 'users') {
			closeCustomFilter(els.controlsUserRoleFilter);
		}
	}

	if (els.controlsUserStatusFilter) {
		els.controlsUserStatusFilter.classList.toggle('hidden', state.activeFolder !== 'users');
		setCustomFilterValue(els.controlsUserStatusFilter, state.searchFilters.usersStatus);

		if (state.activeFolder !== 'users') {
			closeCustomFilter(els.controlsUserStatusFilter);
		}
	}

	if (isEditor) {
		void ensureEditorReady();
	}

	localStorage.setItem(ACTIVE_FOLDER_STORAGE_KEY, state.activeFolder);
};

const categoryGroupMarkup = (category, commands, keyword = '') => {
	const enabled = commands.filter((command) => command.enabled).length;
	const disabled = commands.length - enabled;
	const cards = commands.map((command) => commandCardMarkup(command, state.searchByFolder.commands || '')).join('');
	const highlightedCategory = keyword ? highlightMatch(category, keyword) : escapeHtml(category);
	const categoryKey = getCategoryKey(category);
	const collapsed = state.collapsedCategories.has(categoryKey);
	const collapseClass = collapsed ? 'collapsed' : '';
	const ariaExpanded = collapsed ? 'false' : 'true';

	return `
		<section class="category-group ${collapseClass}">
			<header class="category-head">
				<button class="category-toggle" type="button" data-category-toggle="${categoryKey}" aria-expanded="${ariaExpanded}">
					<i class="category-caret nf ${collapsed ? 'nf-fa-chevron_right' : 'nf-fa-chevron_down'}"></i>
					<strong>${highlightedCategory}</strong>
					<span>${commands.length} commands</span>
					<span>${enabled} ON</span>
					<span>${disabled} OFF</span>
				</button>
			</header>
			<div class="commands-grid">
				${cards}
			</div>
		</section>
	`;
};

const groupCommandsByCategory = (commands) => {
	const grouped = commands.reduce((acc, command) => {
		const category = command.category || 'Uncategorized';

		if (!acc[category]) {
			acc[category] = [];
		}

		acc[category].push(command);
		return acc;
	}, {});

	return Object.entries(grouped)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([category, categoryCommands]) => {
			return [category, categoryCommands];
		});
};

const renderCommands = () => {
	if (state.sectionStates.commands.kind === 'loading' || state.sectionStates.commands.kind === 'error') {
		setSectionContentVisibility('commands', false);
		renderSectionState('commands');
		return;
	}

	setSectionContentVisibility('commands', true);

	const keyword = (state.searchByFolder.commands || '').trim().toLowerCase();
	const stateFilter = state.searchFilters.commandsState;

	const filtered = state.commands.filter((command) => {
		if (stateFilter === 'enabled' && !command.enabled) {
			return false;
		}

		if (stateFilter === 'disabled' && command.enabled) {
			return false;
		}

		if (!keyword) {
			return true;
		}

		const name = String(command.name || '').toLowerCase();
		const category = String(command.category || '').toLowerCase();
		const aliases = Array.isArray(command.aliases) ? command.aliases.join(',').toLowerCase() : '';

		return name.includes(keyword) || category.includes(keyword) || aliases.includes(keyword);
	});

	const sorted = filtered.slice();
	const sortMode = state.searchFilters.commandsSort || 'name-asc';
	const sortByName = (a, b) => a.name.localeCompare(b.name);
	const sortByNumber = (value) => Number(value) || 0;

	sorted.sort((a, b) => {
		switch (sortMode) {
			case 'name-desc':
				return sortByName(b, a);
			case 'usage-asc':
				return sortByNumber(a.usageCount) - sortByNumber(b.usageCount) || sortByName(a, b);
			case 'usage-desc':
				return sortByNumber(b.usageCount) - sortByNumber(a.usageCount) || sortByName(a, b);
			case 'limit-asc':
				return sortByNumber(a.limit) - sortByNumber(b.limit) || sortByName(a, b);
			case 'limit-desc':
				return sortByNumber(b.limit) - sortByNumber(a.limit) || sortByName(a, b);
			case 'cooldown-asc':
				return sortByNumber(a.cooldown) - sortByNumber(b.cooldown) || sortByName(a, b);
			case 'cooldown-desc':
				return sortByNumber(b.cooldown) - sortByNumber(a.cooldown) || sortByName(a, b);
			case 'name-asc':
			default:
				return sortByName(a, b);
		}
	});

	if (!sorted.length) {
		setSectionContentVisibility('commands', false);
		setSectionState('commands', 'empty', keyword ? 'No command matched your search.' : 'No commands available right now.');
		renderSectionState('commands');
		els.commandsGroups.innerHTML = '';
		return;
	}

	setSectionState('commands', 'idle');
	renderSectionState('commands');

	const grouped = groupCommandsByCategory(sorted);

	els.commandsGroups.innerHTML = grouped
		.map(([category, commands]) => categoryGroupMarkup(category, commands, keyword))
		.join('');
};

const flagCardMarkup = (flag, keyword = '') => {
	const statusClass = flag.enabled ? 'enabled' : 'disabled';
	const flagTitle = flag.enabled ? `Disable flag ${escapeHtml(flag.name)}` : `Enable flag ${escapeHtml(flag.name)}`;
	const highlightedName = highlightMatch(flag.name, keyword);

	const actionMarkup = state.canEdit
		? `<button class="toggle-btn ios-toggle ${flag.enabled ? 'is-on' : 'is-off'}" data-flag="${flag.name}" data-enabled="${String(!flag.enabled)}" data-tooltip="${flagTitle}" role="switch" aria-checked="${flag.enabled ? 'true' : 'false'}" aria-label="${flagTitle}"><span class="ios-toggle-track" aria-hidden="true"><span class="ios-toggle-thumb"></span></span></button>`
		: '<span class="readonly-chip">Read-only</span>';

	return `
		<article class="command-card ${statusClass}">
			<div class="command-card-head">
				<strong class="command-name">${highlightedName}</strong>
				${actionMarkup}
			</div>
		</article>
	`;
};

const renderFlags = () => {
	if (state.sectionStates.flags.kind === 'loading' || state.sectionStates.flags.kind === 'error') {
		setSectionContentVisibility('flags', false);
		renderSectionState('flags');
		return;
	}

	setSectionContentVisibility('flags', true);

	const keyword = (state.searchByFolder.flags || '').trim().toLowerCase();
	const stateFilter = state.searchFilters.flagsState;

	const filtered = state.flags.filter((flag) => {
		if (stateFilter === 'enabled' && !flag.enabled) {
			return false;
		}

		if (stateFilter === 'disabled' && flag.enabled) {
			return false;
		}

		if (!keyword) {
			return true;
		}

		return fuzzyIncludes(flag.name, keyword);
	});

	if (!filtered.length) {
		setSectionState('flags', 'empty', keyword ? 'No flag matched your search.' : 'No runtime flags available.');
		renderSectionState('flags');
		els.flagsGroups.innerHTML = '';
		return;
	}

	setSectionState('flags', 'idle');
	renderSectionState('flags');

	els.flagsGroups.innerHTML = `<div class="commands-grid">${filtered.map((flag) => flagCardMarkup(flag, keyword)).join('')}</div>`;
};

const updateUserLimitDisplay = (userId, limit) => {
	const display = els.usersGroups.querySelector(`span[data-user-limit-display="${userId}"]`);

	if (!display) {
		return;
	}

	display.textContent = `Total Limit: ${Math.max(0, Number.parseInt(limit, 10) || 0)}`;
};

const cancelPendingUserLimitSave = (userId) => {
	if (!userId) {
		return;
	}

	const timer = userLimitSaveTimers.get(userId);

	if (timer) {
		clearTimeout(timer);
		userLimitSaveTimers.delete(userId);
	}

	state.userLimitDrafts.delete(userId);
	state.userLimitSaveVersions.set(userId, (state.userLimitSaveVersions.get(userId) || 0) + 1);
};

const getFilteredUsers = () => {
	const keyword = (state.searchByFolder.users || '').trim().toLowerCase();
	const roleFilter = state.searchFilters.usersRole;
	const statusFilter = state.searchFilters.usersStatus;

	return state.users.filter((user) => {
		if (roleFilter === 'premium' && !user.premium) {
			return false;
		}

		if (roleFilter === 'free' && user.premium) {
			return false;
		}

		if (statusFilter === 'clean' && (user.banned || user.blocked)) {
			return false;
		}

		if (statusFilter === 'banned' && !user.banned) {
			return false;
		}

		if (statusFilter === 'blocked' && !user.blocked) {
			return false;
		}

		if (!keyword) {
			return true;
		}

		return fuzzyIncludes(
			[user.id, user.premium ? 'premium' : 'free', user.banned ? 'banned' : '', user.blocked ? 'blocked' : ''].join(' '),
			keyword
		);
	});
};

const getSelectedUsers = () => {
	const userMap = new Map(state.users.map((user) => [user.id, user]));

	return Array.from(state.selectedUserIds)
		.map((id) => userMap.get(id))
		.filter(Boolean);
};

const updateUsersBulkToolbar = () => {
	if (!els.usersBulkToolbar) {
		return;
	}

	const filteredUsers = getFilteredUsers();
	const filteredIds = new Set(filteredUsers.map((user) => user.id));
	let selectedVisible = 0;

	for (const id of state.selectedUserIds) {
		if (filteredIds.has(id)) {
			selectedVisible += 1;
		}
	}

	const selectedCount = state.selectedUserIds.size;

	if (els.usersBulkSelectedCount) {
		els.usersBulkSelectedCount.textContent = `${selectedCount} selected`;
	}

	if (els.usersBulkSelectVisible) {
		const allVisibleSelected = filteredUsers.length > 0 && selectedVisible === filteredUsers.length;

		els.usersBulkSelectVisible.textContent = allVisibleSelected ? 'Unselect Visible' : 'Select Visible';
		els.usersBulkSelectVisible.disabled = !state.canEdit || !filteredUsers.length || state.bulkUsersBusy;
	}

	if (els.usersBulkClear) {
		els.usersBulkClear.disabled = !state.canEdit || !selectedCount || state.bulkUsersBusy;
	}

	const actionButtons = Array.from(els.usersBulkToolbar.querySelectorAll('button[data-bulk-user-action]'));

	for (const button of actionButtons) {
		button.disabled = !state.canEdit || !selectedCount || state.bulkUsersBusy;
	}

	if (els.usersBulkLimitValue) {
		els.usersBulkLimitValue.disabled = !state.canEdit || state.bulkUsersBusy;
	}
};

const pruneSelectedUsers = () => {
	const allUserIds = new Set(state.users.map((user) => user.id));

	for (const id of Array.from(state.selectedUserIds)) {
		if (!allUserIds.has(id)) {
			state.selectedUserIds.delete(id);
		}
	}
};

const runBulkUserAction = async ({ actionLabel, confirmConfig = null, operation, onComplete = null }) => {
	const selectedUsers = getSelectedUsers();

	if (!selectedUsers.length) {
		showToast('Select at least one user first.', 'warning');
		return;
	}

	if (confirmConfig) {
		const approved = await confirmRiskAction(confirmConfig);

		if (!approved) {
			return;
		}
	}

	state.bulkUsersBusy = true;
	updateUsersBulkToolbar();

	for (const user of selectedUsers) {
		cancelPendingUserLimitSave(user.id);
	}

	let successCount = 0;
	let failedCount = 0;

	for (const user of selectedUsers) {
		try {
			await operation(user);
			successCount += 1;
		} catch (error) {
			failedCount += 1;
			console.error(error);
		}
	}

	state.bulkUsersBusy = false;

	if (typeof onComplete === 'function') {
		await onComplete();
	}

	if (failedCount === 0) {
		showToast(`${actionLabel} completed for ${successCount} user${successCount === 1 ? '' : 's'}.`, 'success');
		return;
	}

	if (successCount > 0) {
		showToast(`${actionLabel}: ${successCount} succeeded, ${failedCount} failed.`, 'warning');
		return;
	}

	showToast(`${actionLabel} failed for all selected users.`, 'error');
};

async function setUserLimit(userId, limit) {
	const response = await fetch(`/api/dashboard/users/${encodeURIComponent(userId)}/limit`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ limit })
	});

	ensureAuthorizedResponse(response, `Failed updating limit for ${userId}`);

	return response.json();
}

const scheduleUserLimitSave = (userId, limit) => {
	if (!userId) {
		return;
	}

	const normalizedLimit = Math.max(0, Number.parseInt(limit, 10) || 0);

	state.userLimitDrafts.set(userId, normalizedLimit);

	const nextVersion = (state.userLimitSaveVersions.get(userId) || 0) + 1;

	state.userLimitSaveVersions.set(userId, nextVersion);

	if (userLimitSaveTimers.has(userId)) {
		clearTimeout(userLimitSaveTimers.get(userId));
	}

	const timer = setTimeout(async () => {
		const versionAtStart = nextVersion;

		try {
			const payload = await setUserLimit(userId, normalizedLimit);

			for (const user of state.users) {
				if (user.id === userId) {
					user.limit = normalizedLimit;
					break;
				}
			}

			if (state.userLimitSaveVersions.get(userId) === versionAtStart) {
				state.userLimitDrafts.delete(userId);
			}

			showUndoToast({
				message: `Limit saved: ${normalizedLimit}`,
				undo: payload?.undo || null
			});
		} catch (error) {
			console.error(error);
			showToast(error?.message || 'Failed updating user limit.', 'error');
		} finally {
			if (state.userLimitSaveVersions.get(userId) === versionAtStart) {
				userLimitSaveTimers.delete(userId);
			}
		}
	}, state.settings.autosaveDelayMs);

	userLimitSaveTimers.set(userId, timer);
};

const userCardMarkup = (user, keyword = '') => {
	const displayLimit = state.userLimitDrafts.has(user.id) ? state.userLimitDrafts.get(user.id) : Number(user.limit || 0);
	const isSelected = state.selectedUserIds.has(user.id);
	const roleLabel = user.premium ? 'PREMIUM' : 'FREE';
	const userNum = user.id.split('@')[0];
	const premiumBtn = user.premium ? 'Remove Premium' : 'Make Premium';
	const bannedBtn = user.banned ? 'Unban' : 'Ban';
	const blockedBtn = user.blocked ? 'Unblock' : 'Block';
	const safeUser = escapeHtml(userNum);
	const highlightedUser = highlightMatch(userNum, keyword);
	const premiumTitle = user.premium ? `Remove premium role from ${safeUser}` : `Grant premium role to ${safeUser}`;
	const bannedTitle = user.banned ? `Unban ${safeUser}` : `Ban ${safeUser}`;
	const blockedTitle = user.blocked ? `Unblock ${safeUser}` : `Block ${safeUser}`;

	const actions = state.canEdit
		? `
			<div class="user-limit-row">
				<button class="toggle-btn user-limit-step" data-user-step="-10" data-user-id="${user.id}" data-tooltip="Decrease ${safeUser} limit by 10">-10</button>
				<button class="toggle-btn user-limit-step" data-user-step="-1" data-user-id="${user.id}" data-tooltip="Decrease ${safeUser} limit by 1">-1</button>
				<input class="user-limit-input" type="number" min="0" step="1" value="${displayLimit}" data-user-limit="${user.id}" data-user-id="${user.id}" data-tooltip="Edit ${safeUser} daily command limit" />
				<button class="toggle-btn user-limit-step" data-user-step="1" data-user-id="${user.id}" data-tooltip="Increase ${safeUser} limit by 1">+1</button>
				<button class="toggle-btn user-limit-step" data-user-step="10" data-user-id="${user.id}" data-tooltip="Increase ${safeUser} limit by 10">+10</button>
			</div>
			<div class="user-toggle-row">
				<button class="toggle-btn" data-user-premium="${user.id}" data-enabled="${String(!user.premium)}" data-tooltip="${premiumTitle}">${premiumBtn}</button>
				<button class="toggle-btn" data-user-banned="${user.id}" data-enabled="${String(!user.banned)}" data-tooltip="${bannedTitle}">${bannedBtn}</button>
				<button class="toggle-btn" data-user-blocked="${user.id}" data-enabled="${String(!user.blocked)}" data-tooltip="${blockedTitle}">${blockedBtn}</button>
			</div>
		`
		: '<span class="readonly-chip">Read-only</span>';

	const selectMarkup = state.canEdit
		? `<label class="user-select-row"><input type="checkbox" data-user-select="${user.id}" ${isSelected ? 'checked' : ''} />Select</label>`
		: '';

	return `
		<article class="command-card ${user.banned || user.blocked ? 'disabled' : 'enabled'} ${isSelected ? 'selected' : ''}">
			<div class="command-card-head">
				<strong class="command-name">${highlightedUser}</strong>
				<div class="user-head-actions">
					${selectMarkup}
					<span class="status-pill ${user.premium ? 'enabled' : 'disabled'}">${roleLabel}</span>
				</div>
			</div>
			<div class="command-meta">
				<span data-user-limit-display="${user.id}">Total Limit: ${displayLimit}</span>
				<span>Banned: ${user.banned ? 'Yes' : 'No'}</span>
				<span>Blocked: ${user.blocked ? 'Yes' : 'No'}</span>
			</div>
			<div class="command-actions user-actions">${actions}</div>
		</article>
	`;
};

const renderUsers = () => {
	if (state.sectionStates.users.kind === 'loading' || state.sectionStates.users.kind === 'error') {
		els.usersBulkToolbar?.classList.add('hidden');
		els.usersWrap?.classList.add('hidden');
		renderSectionState('users');
		updateUsersBulkToolbar();
		return;
	}

	if (!state.canEdit) {
		els.usersBulkToolbar?.classList.add('hidden');
	}

	const filtered = getFilteredUsers();
	const keyword = (state.searchByFolder.users || '').trim().toLowerCase();

	if (!filtered.length) {
		setSectionState('users', 'empty', 'No user found for this search/filter.');
		els.usersBulkToolbar?.classList.add('hidden');
		els.usersWrap?.classList.add('hidden');
		renderSectionState('users');
		els.usersGroups.innerHTML = '';
		updateUsersBulkToolbar();
		return;
	}

	setSectionState('users', 'idle');

	if (state.canEdit) {
		els.usersBulkToolbar?.classList.remove('hidden');
	} else {
		els.usersBulkToolbar?.classList.add('hidden');
	}

	els.usersWrap?.classList.remove('hidden');
	renderSectionState('users');

	els.usersGroups.innerHTML = `<div class="commands-grid users-grid">${filtered.map((user) => userCardMarkup(user, keyword)).join('')}</div>`;
	updateUsersBulkToolbar();
};

const loadEditorModules = async () => {
	if (editorModules) {
		return editorModules;
	}

	const esm = (pkg) => `https://esm.sh/${pkg}`;

	const [
		stateModule,
		viewModule,
		commandsModule,
		languageModule,
		jsModule,
		jsonModule,
		htmlModule,
		cssModule,
		mdModule,
		highlightModule,
		lintModule,
		acornLooseModule
	] = await Promise.all([
		import(esm('@codemirror/state')),
		import(esm('@codemirror/view')),
		import(esm('@codemirror/commands')),
		import(esm('@codemirror/language')),
		import(esm('@codemirror/lang-javascript')),
		import(esm('@codemirror/lang-json')),
		import(esm('@codemirror/lang-html')),
		import(esm('@codemirror/lang-css')),
		import(esm('@codemirror/lang-markdown')),
		import(esm('@lezer/highlight')),
		import(esm('@codemirror/lint')),
		import(esm('acorn-loose'))
	]);

	editorModules = {
		EditorState: stateModule.EditorState,
		EditorView: viewModule.EditorView,
		Compartment: stateModule.Compartment,
		undo: commandsModule.undo,
		keymap: viewModule.keymap,
		lineNumbers: viewModule.lineNumbers,
		highlightActiveLineGutter: viewModule.highlightActiveLineGutter,
		highlightSpecialChars: viewModule.highlightSpecialChars,
		drawSelection: viewModule.drawSelection,
		dropCursor: viewModule.dropCursor,
		rectangularSelection: viewModule.rectangularSelection,
		crosshairCursor: viewModule.crosshairCursor,
		highlightActiveLine: viewModule.highlightActiveLine,
		defaultKeymap: commandsModule.defaultKeymap,
		historyKeymap: commandsModule.historyKeymap,
		indentWithTab: commandsModule.indentWithTab,
		history: commandsModule.history,
		bracketMatching: languageModule.bracketMatching,
		syntaxHighlighting: languageModule.syntaxHighlighting,
		HighlightStyle: languageModule.HighlightStyle,
		tags: highlightModule.tags,
		defaultHighlightStyle: languageModule.defaultHighlightStyle,
		linter: lintModule.linter,
		javascript: jsModule.javascript,
		json: jsonModule.json,
		html: htmlModule.html,
		css: cssModule.css,
		markdown: mdModule.markdown,
		acornLoose: acornLooseModule
	};

	const { EditorView, HighlightStyle, syntaxHighlighting, tags } = editorModules;

	const draculaChrome = EditorView.theme(
		{
			'&': { backgroundColor: '#282a36', color: '#f8f8f2' },
			'.cm-content': { caretColor: '#f8f8f2' },
			'.cm-cursor, .cm-dropCursor': { borderLeftColor: '#f8f8f2' },
			'&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': { backgroundColor: '#44475a' },
			'.cm-gutters': { backgroundColor: '#282a36', color: '#6272a4', borderRight: '1px solid #44475a' },
			'.cm-activeLineGutter': { backgroundColor: '#44475a' },
			'.cm-activeLine': { backgroundColor: '#44475a55' }
		},
		{ dark: true }
	);
	const draculaHighlight = HighlightStyle.define([
		{ tag: tags.keyword, color: '#ff79c6' },
		{ tag: [tags.name, tags.deleted, tags.character, tags.macroName], color: '#f8f8f2' },
		{ tag: [tags.function(tags.variableName)], color: '#50fa7b' },
		{ tag: [tags.labelName], color: '#ff79c6' },
		{ tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)], color: '#bd93f9' },
		{ tag: [tags.definition(tags.name), tags.separator], color: '#f8f8f2' },
		{
			tag: [
				tags.typeName,
				tags.className,
				tags.number,
				tags.changed,
				tags.annotation,
				tags.modifier,
				tags.self,
				tags.namespace
			],
			color: '#bd93f9'
		},
		{
			tag: [tags.operator, tags.operatorKeyword, tags.url, tags.escape, tags.regexp, tags.special(tags.string)],
			color: '#ff79c6'
		},
		{ tag: [tags.meta, tags.comment], color: '#6272a4' },
		{ tag: tags.strong, fontWeight: 'bold' },
		{ tag: tags.emphasis, fontStyle: 'italic' },
		{ tag: tags.strikethrough, textDecoration: 'line-through' },
		{ tag: tags.link, color: '#8be9fd', textDecoration: 'underline' },
		{ tag: tags.heading, fontWeight: 'bold', color: '#bd93f9' },
		{ tag: [tags.atom, tags.bool, tags.special(tags.variableName)], color: '#bd93f9' },
		{ tag: [tags.processingInstruction, tags.string, tags.inserted], color: '#f1fa8c' },
		{ tag: tags.invalid, color: '#ff5555' }
	]);

	const cityLightsChrome = EditorView.theme(
		{
			'&': { backgroundColor: '#1d252c', color: '#b7c5d3' },
			'.cm-content': { caretColor: '#b7c5d3' },
			'.cm-cursor, .cm-dropCursor': { borderLeftColor: '#b7c5d3' },
			'&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': { backgroundColor: '#28323b' },
			'.cm-gutters': { backgroundColor: '#1d252c', color: '#41505e', borderRight: '1px solid #28323b' },
			'.cm-activeLineGutter': { backgroundColor: '#28323b' },
			'.cm-activeLine': { backgroundColor: '#28323b55' }
		},
		{ dark: true }
	);
	const cityLightsHighlight = HighlightStyle.define([
		{ tag: tags.keyword, color: '#e27e8d' },
		{ tag: [tags.name, tags.deleted, tags.character, tags.macroName], color: '#b7c5d3' },
		{ tag: [tags.function(tags.variableName)], color: '#5ec4ff' },
		{ tag: [tags.labelName], color: '#e27e8d' },
		{ tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)], color: '#e27e8d' },
		{ tag: [tags.definition(tags.name), tags.separator], color: '#b7c5d3' },
		{
			tag: [tags.typeName, tags.className, tags.changed, tags.annotation, tags.modifier, tags.self, tags.namespace],
			color: '#70e1e8'
		},
		{ tag: [tags.number], color: '#e27e8d' },
		{
			tag: [tags.operator, tags.operatorKeyword, tags.url, tags.escape, tags.regexp, tags.special(tags.string)],
			color: '#5ec4ff'
		},
		{ tag: [tags.meta, tags.comment], color: '#41505e' },
		{ tag: tags.strong, fontWeight: 'bold' },
		{ tag: tags.emphasis, fontStyle: 'italic' },
		{ tag: tags.link, color: '#70e1e8', textDecoration: 'underline' },
		{ tag: tags.heading, fontWeight: 'bold', color: '#5ec4ff' },
		{ tag: [tags.atom, tags.bool, tags.special(tags.variableName)], color: '#e27e8d' },
		{ tag: [tags.processingInstruction, tags.string, tags.inserted], color: '#68a1f0' },
		{ tag: tags.invalid, color: '#d95468' }
	]);

	const catppuccinChrome = EditorView.theme(
		{
			'&': { backgroundColor: '#1e1e2e', color: '#cdd6f4' },
			'.cm-content': { caretColor: '#cdd6f4' },
			'.cm-cursor, .cm-dropCursor': { borderLeftColor: '#cdd6f4' },
			'&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': { backgroundColor: '#45475a' },
			'.cm-gutters': { backgroundColor: '#1e1e2e', color: '#6c7086', borderRight: '1px solid #45475a' },
			'.cm-activeLineGutter': { backgroundColor: '#45475a' },
			'.cm-activeLine': { backgroundColor: '#45475a55' }
		},
		{ dark: true }
	);
	const catppuccinHighlight = HighlightStyle.define([
		{ tag: tags.keyword, color: '#cba6f7' },
		{ tag: [tags.name, tags.deleted, tags.character, tags.macroName], color: '#cdd6f4' },
		{ tag: [tags.function(tags.variableName)], color: '#89b4fa' },
		{ tag: [tags.labelName], color: '#f38ba8' },
		{ tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)], color: '#fab387' },
		{ tag: [tags.definition(tags.name), tags.separator], color: '#cdd6f4' },
		{
			tag: [tags.typeName, tags.className, tags.changed, tags.annotation, tags.modifier, tags.self, tags.namespace],
			color: '#f9e2af'
		},
		{ tag: [tags.number], color: '#fab387' },
		{ tag: [tags.operator, tags.operatorKeyword], color: '#89dceb' },
		{ tag: [tags.url, tags.escape, tags.regexp, tags.special(tags.string)], color: '#f5c2e7' },
		{ tag: [tags.meta, tags.comment], color: '#6c7086' },
		{ tag: tags.strong, fontWeight: 'bold' },
		{ tag: tags.emphasis, fontStyle: 'italic' },
		{ tag: tags.link, color: '#89b4fa', textDecoration: 'underline' },
		{ tag: tags.heading, fontWeight: 'bold', color: '#cba6f7' },
		{ tag: [tags.atom, tags.bool, tags.special(tags.variableName)], color: '#fab387' },
		{ tag: [tags.processingInstruction, tags.string, tags.inserted], color: '#a6e3a1' },
		{ tag: tags.invalid, color: '#f38ba8' }
	]);

	const tokyoNightChrome = EditorView.theme(
		{
			'&': { backgroundColor: '#1a1b26', color: '#a9b1d6' },
			'.cm-content': { caretColor: '#a9b1d6' },
			'.cm-cursor, .cm-dropCursor': { borderLeftColor: '#a9b1d6' },
			'&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': { backgroundColor: '#283457' },
			'.cm-gutters': { backgroundColor: '#1a1b26', color: '#3b4261', borderRight: '1px solid #283457' },
			'.cm-activeLineGutter': { backgroundColor: '#283457' },
			'.cm-activeLine': { backgroundColor: '#28345755' }
		},
		{ dark: true }
	);
	const tokyoNightHighlight = HighlightStyle.define([
		{ tag: tags.keyword, color: '#bb9af7' },
		{ tag: [tags.name, tags.deleted, tags.character, tags.macroName], color: '#a9b1d6' },
		{ tag: [tags.function(tags.variableName)], color: '#7aa2f7' },
		{ tag: [tags.labelName], color: '#e0af68' },
		{ tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)], color: '#ff9e64' },
		{ tag: [tags.definition(tags.name), tags.separator], color: '#a9b1d6' },
		{
			tag: [tags.typeName, tags.className, tags.changed, tags.annotation, tags.modifier, tags.self, tags.namespace],
			color: '#2ac3de'
		},
		{ tag: [tags.number], color: '#ff9e64' },
		{ tag: [tags.operator, tags.operatorKeyword], color: '#89ddff' },
		{ tag: [tags.url, tags.escape, tags.regexp, tags.special(tags.string)], color: '#b4f9f8' },
		{ tag: [tags.meta, tags.comment], color: '#565f89' },
		{ tag: tags.strong, fontWeight: 'bold' },
		{ tag: tags.emphasis, fontStyle: 'italic' },
		{ tag: tags.link, color: '#7aa2f7', textDecoration: 'underline' },
		{ tag: tags.heading, fontWeight: 'bold', color: '#bb9af7' },
		{ tag: [tags.atom, tags.bool, tags.special(tags.variableName)], color: '#ff9e64' },
		{ tag: [tags.processingInstruction, tags.string, tags.inserted], color: '#9ece6a' },
		{ tag: tags.invalid, color: '#f7768e' }
	]);

	editorModules.themes = {
		dracula: [draculaChrome, syntaxHighlighting(draculaHighlight)],
		'city-lights': [cityLightsChrome, syntaxHighlighting(cityLightsHighlight)],
		catppuccin: [catppuccinChrome, syntaxHighlighting(catppuccinHighlight)],
		'tokyo-night': [tokyoNightChrome, syntaxHighlighting(tokyoNightHighlight)]
	};

	editorModules.themeCompartment = new editorModules.Compartment();

	const savedTheme = (() => {
		try {
			return localStorage.getItem(EDITOR_THEME_STORAGE_KEY) || 'dracula';
		} catch {
			return 'dracula';
		}
	})();

	if (editorModules.themes[savedTheme]) {
		editorActiveTheme = savedTheme;
	}

	editorModules.baseExtensions = [
		editorModules.lineNumbers(),
		editorModules.highlightActiveLineGutter(),
		editorModules.highlightSpecialChars(),
		editorModules.drawSelection(),
		editorModules.dropCursor(),
		editorModules.rectangularSelection(),
		editorModules.crosshairCursor(),
		editorModules.highlightActiveLine(),
		editorModules.history(),
		editorModules.bracketMatching(),
		editorModules.themeCompartment.of(editorModules.themes[editorActiveTheme] || editorModules.themes.dracula),
		editorModules.keymap.of([...editorModules.defaultKeymap, ...editorModules.historyKeymap, editorModules.indentWithTab])
	];

	if (els.editorThemeSelect) {
		setCustomFilterValue(els.editorThemeSelect, editorActiveTheme);
	}

	return editorModules;
};

const setEditorTheme = (themeKey) => {
	if (!editorModules || !editorModules.themes[themeKey]) {
		return;
	}

	editorActiveTheme = themeKey;

	try {
		localStorage.setItem(EDITOR_THEME_STORAGE_KEY, themeKey);
	} catch {
		// Ignore storage errors.
	}

	if (editorView && editorModules.themeCompartment) {
		editorView.dispatch({
			effects: editorModules.themeCompartment.reconfigure(editorModules.themes[themeKey])
		});
	}
};

const getEditorLanguage = (filePath, modules) => {
	const ext = String(filePath || '')
		.trim()
		.toLowerCase()
		.split('.')
		.pop();

	if (ext === 'json') {
		return modules.json();
	}

	if (ext === 'html' || ext === 'htm') {
		return modules.html();
	}

	if (ext === 'css') {
		return modules.css();
	}

	if (ext === 'md') {
		return modules.markdown();
	}

	return modules.javascript();
};

const isEditorSyntaxCheckable = (pathValue) => {
	const ext = String(pathValue || '')
		.trim()
		.toLowerCase()
		.split('.')
		.pop();

	return ['js', 'mjs', 'cjs'].includes(ext);
};

const getEditorSyntaxErrors = (content, pathValue, modules) => {
	if (!modules?.acornLoose || !isEditorSyntaxCheckable(pathValue)) {
		return [];
	}

	const parseFn = modules.acornLoose?.parse || modules.acornLoose?.default?.parse || modules.acornLoose?.default || null;
	const isDummyFn = modules.acornLoose?.isDummy || modules.acornLoose?.default?.isDummy || null;

	if (typeof parseFn !== 'function') {
		return [];
	}

	const errors = [];
	const isDummyNode = (node) => {
		if (!node || typeof node !== 'object') {
			return false;
		}

		if (typeof isDummyFn === 'function') {
			return isDummyFn(node);
		}

		if (node.type === 'Identifier') {
			return node.name === '✖';
		}

		if (node.type === 'Literal') {
			return node.raw === '✖' || node.value === '✖';
		}

		return false;
	};

	const visitNode = (node) => {
		if (!node || typeof node !== 'object') {
			return;
		}

		if (isDummyNode(node)) {
			errors.push({
				message: 'Invalid syntax.',
				loc: node.loc?.start || null
			});
		}

		for (const value of Object.values(node)) {
			if (!value) {
				continue;
			}

			if (Array.isArray(value)) {
				value.forEach((entry) => {
					if (entry && typeof entry === 'object' && entry.type) {
						visitNode(entry);
					}
				});
				continue;
			}

			if (value && typeof value === 'object' && value.type) {
				visitNode(value);
			}
		}
	};

	try {
		const ast = parseFn(String(content || ''), {
			ecmaVersion: 'latest',
			sourceType: 'module',
			locations: true,
			allowHashBang: true
		});

		visitNode(ast);

		return errors;
	} catch (error) {
		return error ? [error] : [];
	}
};

const buildEditorSyntaxLintExtension = (pathValue, modules) => {
	if (!modules?.linter || !modules?.acornLoose || !isEditorSyntaxCheckable(pathValue)) {
		return [];
	}

	return modules.linter(
		(view) => {
			const content = view.state.doc.toString();
			const errors = getEditorSyntaxErrors(content, pathValue, modules);

			if (!errors.length) {
				return [];
			}

			return errors.map((error) => {
				const loc = error?.loc || {};
				const line = Number(loc.line || 1);
				const column = Number(loc.column || 0);
				const docLine = view.state.doc.line(Math.max(1, Math.min(line, view.state.doc.lines)));
				const from = Math.min(docLine.from + Math.max(0, column), docLine.to);
				const to = Math.min(from + 1, docLine.to || view.state.doc.length);

				return {
					from,
					to,
					severity: 'error',
					message: error?.message || 'Invalid syntax.'
				};
			});
		},
		{ delay: 250 }
	);
};

const clearEditorSyntaxError = (pathValue) => {
	if (pathValue) {
		editorSyntaxErrors.delete(pathValue);
	}

	if (els.editorSyntaxError) {
		els.editorSyntaxError.classList.add('hidden');
		els.editorSyntaxError.textContent = '';
	}
};

const renderEditorSyntaxError = (pathValue) => {
	if (!els.editorSyntaxError) {
		return;
	}

	const error = editorSyntaxErrors.get(pathValue);

	if (!error) {
		els.editorSyntaxError.classList.add('hidden');
		els.editorSyntaxError.textContent = '';
		return;
	}

	const line = Number(error.line || error.lineNumber || 0);
	const column = Number(error.column || error.col || 0);
	const location = line > 0 && column > 0 ? `Line ${line}, column ${column}` : line > 0 ? `Line ${line}` : 'Syntax error';

	els.editorSyntaxError.textContent = `${location}: ${error.message || 'Invalid syntax.'}`;
	els.editorSyntaxError.classList.remove('hidden');
};

const runEditorSyntaxCheck = (pathValue, content) => {
	if (!editorModules?.acornLoose || !isEditorSyntaxCheckable(pathValue)) {
		clearEditorSyntaxError(pathValue);
		return;
	}

	const errors = getEditorSyntaxErrors(String(content || ''), pathValue, editorModules);

	if (!errors.length) {
		clearEditorSyntaxError(pathValue);
		return;
	}

	editorSyntaxErrors.set(pathValue, errors[0]);

	if (pathValue === editorActivePath) {
		renderEditorSyntaxError(pathValue);
	}
};

const scheduleEditorSyntaxCheck = (pathValue, content) => {
	if (!pathValue) {
		return;
	}

	const previous = editorSyntaxTimers.get(pathValue);

	if (previous) {
		clearTimeout(previous);
	}

	const timer = setTimeout(() => {
		editorSyntaxTimers.delete(pathValue);
		runEditorSyntaxCheck(pathValue, content);
	}, 350);

	editorSyntaxTimers.set(pathValue, timer);
};

const bindEditorCursorHover = () => {
	if (editorCursorBound || !els.editorCanvas) {
		return;
	}

	editorCursorBound = true;

	const setCompact = (isCompact) => {
		const cursor = getZenCursorElement();

		if (!cursor) {
			return;
		}

		cursor.classList.toggle('is-editor-compact', isCompact);
	};

	const setSystemCursor = (isActive) => {
		els.editorCanvas?.classList.toggle('is-system-cursor', isActive);

		const cursor = getZenCursorElement();
		const cursorText = document.getElementById('zen-cursor-text');

		cursor?.classList.toggle('is-hidden', isActive);
		cursorText?.classList.toggle('is-hidden', isActive);
	};

	els.editorCanvas.addEventListener('pointerenter', () => {
		setCompact(true);
		setSystemCursor(true);
	});
	els.editorCanvas.addEventListener('pointerleave', () => {
		setCompact(false);
		setSystemCursor(false);
	});
	els.editorCanvas.addEventListener('mouseenter', () => {
		setCompact(true);
		setSystemCursor(true);
	});
	els.editorCanvas.addEventListener('mouseleave', () => {
		setCompact(false);
		setSystemCursor(false);
	});
};

const setEditorLoadingState = (isLoading) => {
	if (!els.editorLoading) {
		return;
	}

	els.editorLoading.classList.toggle('hidden', !isLoading);
};

const getActiveEditorTab = () => (editorActivePath ? editorTabs.get(editorActivePath) : null);

const updateEditorMeta = () => {
	const activeTab = getActiveEditorTab();

	if (!els.editorFilePath || !els.editorLineCount) {
		return;
	}

	if (!activeTab) {
		els.editorFilePath.textContent = 'No file selected';
		els.editorLineCount.textContent = '0 lines';
		return;
	}

	els.editorFilePath.textContent = activeTab.path;
	els.editorLineCount.textContent = `${activeTab.lineCount} lines`;
};

const updateEditorButtons = () => {
	const activeTab = getActiveEditorTab();
	const hasTab = Boolean(activeTab);

	if (els.editorSave) {
		els.editorSave.disabled = !hasTab || !activeTab.dirty;
	}

	if (els.editorUndo) {
		els.editorUndo.disabled = !hasTab;
	}

	if (els.editorFormat) {
		els.editorFormat.disabled = !hasTab;
	}
};

const updateEditorShellState = () => {
	const hasTabs = editorTabs.size > 0;

	els.editorShell?.classList.toggle('is-idle', !hasTabs);
	els.editorCanvas?.classList.toggle('is-empty', !hasTabs);

	if (!hasTabs) {
		editorActivePath = '';

		if (els.editorEmpty) {
			els.editorEmpty.classList.remove('hidden');
		}

		clearEditorSyntaxError();
		updateEditorMeta();
		updateEditorButtons();
	}
};

const renderEditorTabs = () => {
	if (!els.editorTabs) {
		return;
	}

	const tabs = Array.from(editorTabs.values());

	if (!tabs.length) {
		els.editorTabs.innerHTML = '';
		updateEditorShellState();
		return;
	}

	els.editorTabs.innerHTML = tabs
		.map((tab) => {
			const isActive = tab.path === editorActivePath;
			const classes = ['editor-tab'];

			if (isActive) {
				classes.push('is-active');
			}

			if (tab.dirty) {
				classes.push('is-dirty');
			}

			return `
				<div class="${classes.join(' ')}" role="presentation">
					<button
						type="button"
						class="editor-tab-label"
						data-editor-tab="${escapeHtml(tab.path)}"
						role="tab"
						aria-selected="${isActive ? 'true' : 'false'}">
						${escapeHtml(tab.name)}
					</button>
					<button
						type="button"
						class="editor-tab-close"
						data-editor-close="${escapeHtml(tab.path)}"
						aria-label="Close ${escapeHtml(tab.name)}">
						x
					</button>
				</div>
			`;
		})
		.join('');

	updateEditorShellState();
};

const ensureEditorView = async (tab) => {
	if (!els.editorCanvas) {
		return;
	}

	const modules = await loadEditorModules();

	if (!editorView) {
		editorView = new modules.EditorView({
			state:
				tab?.state ||
				modules.EditorState.create({
					doc: '',
					extensions: [...modules.baseExtensions, modules.EditorView.lineWrapping]
				}),
			parent: els.editorCanvas
		});
	}

	bindEditorCursorHover();
};

const setActiveEditorTab = async (pathValue) => {
	const tab = editorTabs.get(pathValue);

	if (!tab) {
		return;
	}

	editorActivePath = tab.path;

	await ensureEditorView(tab);

	if (editorView) {
		editorView.setState(tab.state);
		editorView.focus();
	}

	if (els.editorEmpty) {
		els.editorEmpty.classList.add('hidden');
	}

	updateEditorMeta();
	updateEditorButtons();
	renderEditorTabs();
	renderEditorTree();

	if (!editorSyntaxErrors.has(tab.path)) {
		runEditorSyntaxCheck(tab.path, tab.state.doc.toString());
	}

	renderEditorSyntaxError(tab.path);
};

const createEditorState = (pathValue, content, modules) => {
	const languageExtension = getEditorLanguage(pathValue, modules);
	const lintExtension = buildEditorSyntaxLintExtension(pathValue, modules);

	const updateListener = modules.EditorView.updateListener.of((update) => {
		if (!update.docChanged) {
			return;
		}

		const tab = editorTabs.get(pathValue);

		if (!tab) {
			return;
		}

		tab.state = update.state;
		tab.lineCount = update.state.doc.lines;
		tab.dirty = update.state.doc.toString() !== tab.savedContent;
		scheduleEditorSyntaxCheck(pathValue, update.state.doc.toString());

		if (pathValue === editorActivePath) {
			updateEditorMeta();
			updateEditorButtons();
		}

		renderEditorTabs();
	});

	return modules.EditorState.create({
		doc: content,
		extensions: [...modules.baseExtensions, modules.EditorView.lineWrapping, languageExtension, lintExtension, updateListener]
	});
};

const openEditorFile = async (pathValue) => {
	if (!pathValue || !state.canEdit) {
		return;
	}

	if (editorTabs.has(pathValue)) {
		await setActiveEditorTab(pathValue);
		return;
	}

	setSectionContentVisibility('editor', true);
	setSectionState('editor', 'idle');
	renderSectionState('editor');
	setEditorLoadingState(true);

	renderSectionState('editor');

	try {
		const response = await fetch(`/api/dashboard/editor/file?path=${encodeURIComponent(pathValue)}`);

		ensureAuthorizedResponse(response, 'Failed opening command file.');

		const payload = await response.json();
		const content = String(payload?.content || '');
		const modules = await loadEditorModules();
		const stateValue = createEditorState(pathValue, content, modules);
		const tab = {
			path: pathValue,
			name: pathValue.split('/').pop() || pathValue,
			state: stateValue,
			savedContent: content,
			dirty: false,
			lineCount: stateValue.doc.lines
		};

		editorTabs.set(pathValue, tab);
		setSectionState('editor', 'idle');
		setSectionContentVisibility('editor', true);
		renderSectionState('editor');
		renderEditorTabs();
		runEditorSyntaxCheck(pathValue, content);
		await setActiveEditorTab(pathValue);
	} catch (error) {
		setSectionState('editor', 'error', error?.message || 'Unable to open file.');
		setSectionContentVisibility('editor', false);
		renderSectionState('editor');
	} finally {
		setEditorLoadingState(false);
	}
};

const setEditorTreeCount = (count) => {
	if (!els.editorTreeCount) {
		return;
	}

	const safeCount = Math.max(0, Number(count) || 0);

	els.editorTreeCount.textContent = `${safeCount} file${safeCount === 1 ? '' : 's'}`;
};

const countEditorFiles = (node) => {
	if (!node) {
		return 0;
	}

	if (node.type === 'file') {
		return 1;
	}

	return (node.children || []).reduce((sum, child) => sum + countEditorFiles(child), 0);
};

const filterEditorTree = (node, query) => {
	if (!node) {
		return null;
	}

	if (!query) {
		return node;
	}

	const nameMatch = node.name.toLowerCase().includes(query);

	if (node.type === 'file') {
		return nameMatch ? node : null;
	}

	const children = (node.children || []).map((child) => filterEditorTree(child, query)).filter(Boolean);

	if (nameMatch || children.length) {
		return {
			...node,
			children
		};
	}

	return null;
};

const buildEditorTreeChevronMarkup = (isExpanded) => {
	const chevronClass = isExpanded ? 'nf nf-fa-chevron_down' : 'nf nf-fa-chevron_right';

	return `<span class="editor-tree-icon editor-tree-chevron ${chevronClass}" aria-hidden="true"></span>`;
};

const buildEditorTreeFolderMarkup = (isExpanded) => {
	const folderClass = isExpanded ? 'nf nf-fa-folder_open' : 'nf nf-fa-folder';

	return `<span class="editor-tree-icon editor-tree-folder-icon ${folderClass}" aria-hidden="true"></span>`;
};

const buildEditorTreeFileMarkup = () =>
	'<span class="editor-tree-icon editor-tree-file-icon nf nf-fa-file" aria-hidden="true"></span>';

const buildEditorTreeMarkup = (node, depth, query) => {
	if (!node) {
		return '';
	}

	const safeDepth = Math.max(0, depth || 0);

	if (node.type === 'file') {
		const isActive = node.path === editorActivePath;
		const rowClass = ['editor-tree-row', 'editor-tree-indent'];

		if (isActive) {
			rowClass.push('is-active');
		}

		return `
			<button
				type="button"
				class="${rowClass.join(' ')}"
				data-editor-file="${escapeHtml(node.path)}"
				style="--depth: ${safeDepth}"
				role="treeitem">
				${buildEditorTreeFileMarkup()}
				<span>${escapeHtml(node.name)}</span>
			</button>
		`;
	}

	const isExpanded = query ? true : editorTreeExpanded.has(node.path);
	const childrenMarkup = (node.children || []).map((child) => buildEditorTreeMarkup(child, safeDepth + 1, query)).join('');

	return `
		<div class="editor-tree-node ${isExpanded ? 'is-open' : ''}">
			<button
				type="button"
				class="editor-tree-row editor-tree-indent"
				data-editor-toggle="${escapeHtml(node.path)}"
				style="--depth: ${safeDepth}"
				role="treeitem"
				aria-expanded="${isExpanded ? 'true' : 'false'}">
				${buildEditorTreeChevronMarkup(isExpanded)}
				${buildEditorTreeFolderMarkup(isExpanded)}
				<span>${escapeHtml(node.name)}</span>
			</button>
			<div class="editor-tree-children" role="group">
				${childrenMarkup}
			</div>
		</div>
	`;
};

const renderEditorTree = () => {
	if (!els.editorTree) {
		return;
	}

	if (!editorTreeSnapshot) {
		els.editorTree.innerHTML = '<p class="muted">No command files loaded.</p>';
		return;
	}

	const query = (state.searchByFolder.editor || '').trim().toLowerCase();
	const filtered = filterEditorTree(editorTreeSnapshot, query);

	if (!filtered) {
		els.editorTree.innerHTML = '<p class="muted">No command matched this search.</p>';
		return;
	}

	const fileCount = countEditorFiles(filtered);

	setEditorTreeCount(fileCount);
	els.editorTree.innerHTML = buildEditorTreeMarkup(filtered, 0, query);
};

const ensureEditorReady = async () => {
	if (!state.canEdit || editorLoading) {
		return;
	}

	if (editorTreeSnapshot) {
		renderEditorTree();
		updateEditorMeta();
		updateEditorButtons();
		updateEditorShellState();
		return;
	}

	editorLoading = true;
	setSectionState('editor', 'loading', 'Loading command file tree...');
	setSectionContentVisibility('editor', false);
	renderSectionState('editor');

	try {
		const response = await fetch('/api/dashboard/editor/tree');

		ensureAuthorizedResponse(response, 'Failed loading command tree.');

		const payload = await response.json();

		editorTreeSnapshot = payload?.root || null;
		editorTreeExpanded = new Set(['']);
		setSectionState('editor', 'idle');
		setSectionContentVisibility('editor', true);
		renderSectionState('editor');
		renderEditorTree();
		updateEditorMeta();
		updateEditorButtons();
		updateEditorShellState();
	} catch (error) {
		setSectionState('editor', 'error', error?.message || 'Unable to load command tree.');
		setSectionContentVisibility('editor', false);
		renderSectionState('editor');
	} finally {
		editorLoading = false;
	}
};

const saveEditorTab = async (tab) => {
	if (!tab) {
		return false;
	}

	if (els.editorSave && tab.path === editorActivePath) {
		els.editorSave.disabled = true;
	}

	try {
		const content = tab.state?.doc?.toString() || '';
		const response = await fetch('/api/dashboard/editor/file', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				path: tab.path,
				content
			})
		});

		ensureAuthorizedResponse(response, 'Failed saving file.');

		tab.savedContent = content;
		tab.dirty = false;
		updateEditorButtons();
		renderEditorTabs();
		showToast('File saved.', 'success');
		return true;
	} catch (error) {
		showToast(error?.message || 'Unable to save file.', 'error');
		return false;
	} finally {
		if (els.editorSave && tab.path === editorActivePath) {
			els.editorSave.disabled = !tab?.dirty;
		}
	}
};

const saveEditorFile = async () => {
	const activeTab = getActiveEditorTab();

	if (!activeTab) {
		return;
	}

	await saveEditorTab(activeTab);
};

const closeEditorTab = async (pathValue) => {
	const tab = editorTabs.get(pathValue);

	if (!tab) {
		return;
	}

	if (tab.dirty) {
		const choice = await openEditorCloseDialog({ fileName: tab.name });

		if (choice === 'cancel') {
			return;
		}

		if (choice === 'save') {
			const saved = await saveEditorTab(tab);

			if (!saved) {
				return;
			}
		}
	}

	const paths = Array.from(editorTabs.keys());
	const index = paths.indexOf(pathValue);

	editorTabs.delete(pathValue);
	editorSyntaxErrors.delete(pathValue);

	if (pathValue === editorActivePath) {
		const remaining = Array.from(editorTabs.keys());
		const nextIndex = index < 0 ? 0 : Math.min(index, remaining.length - 1);
		const nextPath = remaining[nextIndex] || '';

		if (nextPath) {
			await setActiveEditorTab(nextPath);
		} else {
			editorActivePath = '';

			if (editorView) {
				editorView.destroy();
				editorView = null;
			}

			els.editorCanvas?.querySelector('.cm-editor')?.remove();

			clearEditorSyntaxError();
			updateEditorMeta();
			updateEditorButtons();
			renderEditorTabs();
			renderEditorTree();

			if (els.editorEmpty) {
				els.editorEmpty.classList.remove('hidden');
			}
		}
	} else {
		renderEditorTabs();
	}

	updateEditorShellState();
};

const formatEditorFile = async () => {
	const activeTab = getActiveEditorTab();

	if (!activeTab || !editorView) {
		return;
	}

	if (els.editorFormat) {
		els.editorFormat.disabled = true;
	}

	try {
		const configJson = String(els.editorConfigInput?.value || '').trim();
		const content = editorView.state.doc.toString();
		const response = await fetch('/api/dashboard/editor/format', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				path: activeTab.path,
				content,
				configJson: configJson || null
			})
		});

		ensureAuthorizedResponse(response, 'Failed formatting file.');

		const payload = await response.json();
		const formatted = String(payload?.content || '');
		const docLength = editorView.state.doc.length;

		editorView.dispatch({
			changes: { from: 0, to: docLength, insert: formatted }
		});
		showToast('Formatted with Prettier.', 'success');
	} catch (error) {
		showToast(error?.message || 'Unable to format file.', 'error');
	} finally {
		if (els.editorFormat) {
			els.editorFormat.disabled = false;
		}
	}
};

const undoEditorChange = async () => {
	const activeTab = getActiveEditorTab();

	if (!activeTab || !editorView) {
		return;
	}

	const modules = await loadEditorModules();

	modules.undo(editorView);
};

const getFilteredProfilePictures = () => {
	const keyword = (state.searchByFolder.profilePictures || '').trim().toLowerCase();

	if (!keyword) {
		return state.profilePictures;
	}

	return state.profilePictures.filter((picture) => {
		return fuzzyIncludes([picture.timestamp, picture.url].join(' '), keyword);
	});
};

const getSafeProfilePictureUrl = (value) => {
	const normalized = String(value || '').trim();

	if (!/^https?:\/\//i.test(normalized)) {
		return '';
	}

	return normalized;
};

const getProfilePictureImageVariants = (images) => {
	if (!images || typeof images !== 'object') {
		return [];
	}

	const variants = [];

	for (const [key, value] of Object.entries(images)) {
		const url = getSafeProfilePictureUrl(value?.url || value);

		if (!url) {
			continue;
		}

		const width = Number(value?.width || String(key).match(/(\d+)x/i)?.[1] || 0);
		const height = Number(value?.height || String(key).match(/x(\d+)/i)?.[1] || 0);

		variants.push({
			url,
			width: Number.isFinite(width) ? width : 0,
			height: Number.isFinite(height) ? height : 0
		});
	}

	return variants;
};

const getProfilePictureImageUrls = (picture) => {
	const variants = getProfilePictureImageVariants(picture?.images);
	const sortedByArea = [...variants].sort((a, b) => b.width * b.height - a.width * a.height);

	const originalUrl =
		getSafeProfilePictureUrl(picture?.original?.url) ||
		getSafeProfilePictureUrl(picture?.url) ||
		getSafeProfilePictureUrl(picture?.original) ||
		getSafeProfilePictureUrl(picture?.image_url) ||
		getSafeProfilePictureUrl(picture?.image) ||
		getSafeProfilePictureUrl(picture?.images?.orig?.url) ||
		sortedByArea[0]?.url ||
		'';

	const previewUrl =
		getSafeProfilePictureUrl(picture?.thumbnail?.url) ||
		getSafeProfilePictureUrl(picture?.previewUrl) ||
		getSafeProfilePictureUrl(picture?.thumbnail) ||
		getSafeProfilePictureUrl(picture?.images?.['474x']?.url) ||
		getSafeProfilePictureUrl(picture?.images?.['236x']?.url) ||
		sortedByArea.at(-1)?.url ||
		originalUrl;

	return {
		originalUrl,
		previewUrl: previewUrl || originalUrl
	};
};

const getProfilePictureOriginalUrl = (picture) => getProfilePictureImageUrls(picture).originalUrl;

const getProfilePicturePreviewUrl = (picture) => getProfilePictureImageUrls(picture).previewUrl;

const getProfilePictureIdentityKey = (picture) => {
	const timestamp = String(picture?.timestamp || '').trim();
	const originalUrl = getProfilePictureOriginalUrl(picture);

	return `${timestamp}|${originalUrl}`;
};

const getProfilePicturesSignature = (pictures) =>
	(Array.isArray(pictures) ? pictures : [])
		.map((picture) => {
			const identityKey = getProfilePictureIdentityKey(picture);
			const previewUrl = getProfilePicturePreviewUrl(picture);

			return `${identityKey}|${previewUrl}`;
		})
		.join('\n');

const normalizeRealtimeProfilePicture = (picture) => {
	const { originalUrl, previewUrl } = getProfilePictureImageUrls(picture);

	if (!originalUrl) {
		return null;
	}

	const timestamp = String(
		picture?.timestamp || picture?.createdAt || picture?.created_at || picture?.id || originalUrl
	).trim();

	return {
		...picture,
		timestamp,
		url: originalUrl,
		previewUrl,
		original: {
			...(picture?.original && typeof picture.original === 'object' ? picture.original : {}),
			url: originalUrl
		},
		thumbnail: {
			...(picture?.thumbnail && typeof picture.thumbnail === 'object' ? picture.thumbnail : {}),
			url: previewUrl
		}
	};
};

const normalizeProfilePicturesCollection = (pictures) =>
	clampProfilePictures(
		(Array.isArray(pictures) ? pictures : []).map((picture) => normalizeRealtimeProfilePicture(picture)).filter(Boolean)
	);

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

const getProfilePictureGridUrl = (picture) => {
	const originalUrl = getProfilePictureOriginalUrl(picture);
	const previewUrl = getProfilePicturePreviewUrl(picture);

	if (isGifMediaUrl(originalUrl)) {
		return originalUrl;
	}

	return previewUrl || originalUrl;
};

const getRenderableProfilePictures = () =>
	state.profilePictures.filter((picture) => Boolean(getProfilePictureOriginalUrl(picture)));

const profilePictureCardMarkup = (picture, index) => {
	const originalUrl = getProfilePictureOriginalUrl(picture);

	if (!originalUrl) {
		return '';
	}

	return `
		<article class="album-image-card">
			<img
				src="${getProfilePictureGridUrl(picture)}"
				alt="Profile picture"
				class="album-image is-loaded"
				loading="lazy"
				decoding="async"
				fetchpriority="low"
				referrerpolicy="no-referrer"
				data-profile-index="${index}"
			/>
		</article>
	`;
};

const wrapProfilePicturesIndex = (index, total) => ((index % total) + total) % total;

const getProfilePicturesCarouselSlotClass = (offset) => {
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

const closeProfilePicturesActionMenu = () => {
	if (els.profilePicturesLightboxMenuPanel) {
		els.profilePicturesLightboxMenuPanel.classList.add('hidden');
	}

	if (els.profilePicturesLightboxMenuToggle) {
		els.profilePicturesLightboxMenuToggle.setAttribute('aria-expanded', 'false');
	}
};

const setProfilePicturesActionMenuOwnerState = () => {
	if (!els.profilePicturesLightboxMenuDelete) {
		return;
	}

	els.profilePicturesLightboxMenuDelete.classList.toggle('hidden', !state.canEdit);
};

const updateProfilePicturesActionMenuVisibility = () => {
	if (!els.profilePicturesLightboxMenu) {
		return;
	}

	const shouldShow =
		!els.profilePicturesLightbox?.classList.contains('hidden') &&
		profilePicturesCarouselIndex >= 0 &&
		profilePicturesCarouselItems.length > 0;

	els.profilePicturesLightboxMenu.classList.toggle('hidden', !shouldShow);
	setProfilePicturesActionMenuOwnerState();
};

const getCurrentProfilePicture = () => {
	const total = profilePicturesCarouselItems.length;

	if (!total || profilePicturesCarouselIndex < 0) {
		return null;
	}

	const safeIndex = wrapProfilePicturesIndex(profilePicturesCarouselIndex, total);

	return profilePicturesCarouselItems[safeIndex] || null;
};

const downloadCurrentProfilePicture = async () => {
	const picture = getCurrentProfilePicture();
	const originalUrl = getProfilePictureOriginalUrl(picture);

	if (!originalUrl) {
		return;
	}

	const downloadUrl = new URL('/api/dashboard/profile-pictures/download', window.location.origin);

	downloadUrl.searchParams.set('url', originalUrl);

	if (picture?.timestamp) {
		downloadUrl.searchParams.set('timestamp', picture.timestamp);
	}

	showToast(`Downloading ${String(picture?.timestamp || 'image')}...`, 'info', {
		duration: 2000
	});

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
			: plainMatch?.[1] || `album-${picture?.timestamp || Date.now()}.jpg`;
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

const deleteCurrentProfilePicture = async () => {
	const current = getCurrentProfilePicture();

	if (!current) {
		return;
	}

	if (!state.canEdit) {
		showToast('Only owner can delete images.', 'error');
		return;
	}

	const deleteButton = els.profilePicturesLightboxMenuDelete;

	deleteButton?.setAttribute('disabled', 'disabled');

	const currentUrl = getProfilePictureOriginalUrl(current);
	const currentTimestamp = String(current?.timestamp || '');
	const previousIndex = profilePicturesCarouselIndex;

	try {
		const response = await fetch('/api/dashboard/profile-pictures', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				timestamp: currentTimestamp,
				url: currentUrl
			})
		});

		ensureAuthorizedResponse(response, 'Failed deleting profile picture');

		const payload = await response.json().catch(() => ({}));

		if (!response.ok || payload?.ok === false) {
			throw new Error(payload?.message || 'Failed deleting profile picture');
		}

		const nextPictures = Array.isArray(payload?.pictures) ? payload.pictures : null;

		if (nextPictures) {
			state.profilePictures = clampProfilePictures(nextPictures);
		} else {
			state.profilePictures = state.profilePictures.filter((picture) => {
				const pictureUrl = getProfilePictureOriginalUrl(picture);
				const pictureTimestamp = String(picture?.timestamp || '');

				return !(pictureTimestamp === currentTimestamp && pictureUrl === currentUrl);
			});
		}

		persistSharedProfilePicturesCache(state.profilePictures);
		renderProfilePictures();

		if (!profilePicturesCarouselItems.length) {
			closeProfilePicturesCarousel();
			showToast('Profile picture deleted.', 'success');
			return;
		}

		if (els.profilePicturesLightbox && !els.profilePicturesLightbox.classList.contains('hidden')) {
			profilePicturesCarouselIndex = Math.min(Math.max(previousIndex, 0), profilePicturesCarouselItems.length - 1);
			renderProfilePicturesCarousel();
		}

		showToast('Profile picture deleted.', 'success');
	} catch (error) {
		if (error?.message !== 'Unauthorized') {
			showToast(error?.message || 'Unable to delete image right now.', 'error');
		}
	} finally {
		deleteButton?.removeAttribute('disabled');
	}
};

const triggerProfilePicturesCycleAnimation = (direction) => {
	if (!els.profilePicturesLightboxContent) {
		return;
	}

	const className = direction < 0 ? 'is-cycling-left' : 'is-cycling-right';

	els.profilePicturesLightboxContent.classList.remove('is-cycling-left', 'is-cycling-right');
	void els.profilePicturesLightboxContent.offsetWidth;
	els.profilePicturesLightboxContent.classList.add(className);

	if (profilePicturesCycleTimer) {
		clearTimeout(profilePicturesCycleTimer);
	}

	profilePicturesCycleTimer = setTimeout(() => {
		els.profilePicturesLightboxContent?.classList.remove('is-cycling-left', 'is-cycling-right');
		profilePicturesCycleTimer = null;
	}, CYCLE_ANIMATION_MS);
};

const resetProfilePicturesTouchState = () => {
	profilePicturesTouchStartX = null;
	profilePicturesTouchStartY = null;
	profilePicturesTouchLastX = null;
	profilePicturesTouchLastY = null;
	profilePicturesTouchTrackingActive = false;
	profilePicturesTouchSwipeTriggered = false;
};

const handleProfilePicturesLightboxTouchStart = (event) => {
	if (
		!els.profilePicturesLightbox ||
		els.profilePicturesLightbox.classList.contains('hidden') ||
		profilePicturesCarouselItems.length < 2
	) {
		resetProfilePicturesTouchState();
		return;
	}

	if (event.touches.length !== 1) {
		resetProfilePicturesTouchState();
		return;
	}

	const touch = event.touches[0];

	profilePicturesTouchStartX = touch.clientX;
	profilePicturesTouchStartY = touch.clientY;
	profilePicturesTouchLastX = touch.clientX;
	profilePicturesTouchLastY = touch.clientY;
	profilePicturesTouchTrackingActive = true;
	profilePicturesTouchSwipeTriggered = false;
};

const handleProfilePicturesLightboxTouchMove = (event) => {
	if (!profilePicturesTouchTrackingActive || profilePicturesTouchSwipeTriggered || event.touches.length !== 1) {
		return;
	}

	const touch = event.touches[0];

	profilePicturesTouchLastX = touch.clientX;
	profilePicturesTouchLastY = touch.clientY;

	if (!Number.isFinite(profilePicturesTouchStartX) || !Number.isFinite(profilePicturesTouchStartY)) {
		return;
	}

	const deltaX = touch.clientX - profilePicturesTouchStartX;
	const deltaY = touch.clientY - profilePicturesTouchStartY;

	if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > LIGHTBOX_TOUCH_MAX_VERTICAL_DRIFT_PX) {
		resetProfilePicturesTouchState();
		return;
	}
};

const handleProfilePicturesLightboxTouchEnd = () => {
	if (!profilePicturesTouchTrackingActive || profilePicturesTouchSwipeTriggered) {
		resetProfilePicturesTouchState();
		return;
	}

	if (!Number.isFinite(profilePicturesTouchStartX) || !Number.isFinite(profilePicturesTouchLastX)) {
		resetProfilePicturesTouchState();
		return;
	}

	const deltaX = profilePicturesTouchLastX - profilePicturesTouchStartX;
	const deltaY =
		Number.isFinite(profilePicturesTouchStartY) && Number.isFinite(profilePicturesTouchLastY)
			? profilePicturesTouchLastY - profilePicturesTouchStartY
			: 0;

	if (Math.abs(deltaX) >= LIGHTBOX_TOUCH_SWIPE_THRESHOLD_PX && Math.abs(deltaY) <= LIGHTBOX_TOUCH_MAX_VERTICAL_DRIFT_PX) {
		profilePicturesTouchSwipeTriggered = true;
		moveProfilePicturesCarousel(deltaX < 0 ? 1 : -1);
	}

	resetProfilePicturesTouchState();
};

const renderProfilePicturesCarousel = () => {
	if (!els.profilePicturesLightboxTrack || !profilePicturesCarouselItems.length) {
		return;
	}

	const total = profilePicturesCarouselItems.length;
	const safeIndex = wrapProfilePicturesIndex(profilePicturesCarouselIndex, total);

	profilePicturesCarouselIndex = safeIndex;

	els.profilePicturesLightboxTrack.innerHTML = PROFILE_PICTURES_CAROUSEL_OFFSETS.map((offset) => {
		const targetIndex = wrapProfilePicturesIndex(safeIndex + offset, total);
		const picture = profilePicturesCarouselItems[targetIndex] || null;
		const originalUrl = getProfilePictureOriginalUrl(picture);
		const slotClass = getProfilePicturesCarouselSlotClass(offset);
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
				<img src="${originalUrl}" alt="Carousel image ${targetIndex + 1}" class="albums-carousel-image" loading="${loadingValue}" fetchpriority="${fetchPriority}" decoding="async" referrerpolicy="no-referrer" />
			</button>
		`;
	}).join('');

	if (els.profilePicturesLightboxMeta) {
		els.profilePicturesLightboxMeta.textContent = `${safeIndex + 1} / ${total}`;
	}

	const centerCard = els.profilePicturesLightboxTrack.querySelector('.albums-carousel-item.is-center');

	if (centerCard instanceof HTMLElement) {
		if (els.profilePicturesLightboxMeta) {
			centerCard.appendChild(els.profilePicturesLightboxMeta);
		}

		if (els.profilePicturesLightboxMenu) {
			centerCard.appendChild(els.profilePicturesLightboxMenu);
		}
	}

	updateProfilePicturesActionMenuVisibility();
	closeProfilePicturesActionMenu();
};

const openProfilePicturesCarousel = (index) => {
	if (!els.profilePicturesLightbox || !profilePicturesCarouselItems.length) {
		return;
	}

	profilePicturesCarouselIndex = Number.isFinite(index) ? index : 0;
	profilePicturesWheelDeltaAccumulator = 0;
	profilePicturesWheelLastInputAt = 0;
	profilePicturesWheelNavigationLockUntil = 0;
	renderProfilePicturesCarousel();
	els.profilePicturesLightbox.classList.remove('hidden');
	els.profilePicturesLightbox.classList.remove('is-closing');

	requestAnimationFrame(() => {
		els.profilePicturesLightbox?.classList.add('is-open');
	});

	updateProfilePicturesActionMenuVisibility();
};

const closeProfilePicturesCarousel = () => {
	if (!els.profilePicturesLightbox) {
		return;
	}

	els.profilePicturesLightbox.classList.remove('is-open');
	els.profilePicturesLightbox.classList.add('is-closing');

	window.setTimeout(() => {
		els.profilePicturesLightbox?.classList.add('hidden');
		els.profilePicturesLightbox?.classList.remove('is-closing');

		if (els.profilePicturesLightboxTrack) {
			els.profilePicturesLightboxTrack.innerHTML = '';
		}

		if (els.profilePicturesLightboxMeta) {
			els.profilePicturesLightboxMeta.textContent = '';
		}

		closeProfilePicturesActionMenu();
		updateProfilePicturesActionMenuVisibility();
		els.profilePicturesLightboxContent?.classList.remove('is-cycling-left', 'is-cycling-right');

		if (profilePicturesCycleTimer) {
			clearTimeout(profilePicturesCycleTimer);
			profilePicturesCycleTimer = null;
		}

		profilePicturesWheelDeltaAccumulator = 0;
		profilePicturesWheelLastInputAt = 0;
		profilePicturesWheelNavigationLockUntil = 0;
		resetProfilePicturesTouchState();
	}, 220);
};

const moveProfilePicturesCarousel = (step) => {
	if (
		!profilePicturesCarouselItems.length ||
		!els.profilePicturesLightbox ||
		els.profilePicturesLightbox.classList.contains('hidden')
	) {
		return;
	}

	profilePicturesCarouselIndex += step;
	renderProfilePicturesCarousel();
	triggerProfilePicturesCycleAnimation(step);
	closeProfilePicturesActionMenu();
};

const handleProfilePicturesLightboxWheel = (event) => {
	if (!els.profilePicturesLightbox || els.profilePicturesLightbox.classList.contains('hidden')) {
		return;
	}

	event.preventDefault();

	if (profilePicturesCarouselItems.length < 2 || event.ctrlKey) {
		return;
	}

	const primaryDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;

	if (!Number.isFinite(primaryDelta) || Math.abs(primaryDelta) < 1) {
		return;
	}

	const now = Date.now();

	if (now - profilePicturesWheelLastInputAt > WHEEL_GESTURE_RESET_MS) {
		profilePicturesWheelDeltaAccumulator = 0;
	}

	profilePicturesWheelDeltaAccumulator += primaryDelta;
	profilePicturesWheelLastInputAt = now;

	if (now < profilePicturesWheelNavigationLockUntil) {
		return;
	}

	const stepsFromDelta = Math.trunc(Math.abs(profilePicturesWheelDeltaAccumulator) / WHEEL_DELTA_PER_IMAGE);

	if (stepsFromDelta < 1) {
		return;
	}

	const direction = profilePicturesWheelDeltaAccumulator > 0 ? 1 : -1;

	profilePicturesWheelDeltaAccumulator -= direction * WHEEL_DELTA_PER_IMAGE;

	if (Math.abs(profilePicturesWheelDeltaAccumulator) < WHEEL_DELTA_PER_IMAGE * 0.35) {
		profilePicturesWheelDeltaAccumulator = 0;
	}

	profilePicturesWheelNavigationLockUntil = now + WHEEL_NAV_LOCK_BASE_MS;
	moveProfilePicturesCarousel(direction);
};

const renderSeamlessAlbumsPage = () => {
	if (!els.albumsSeamlessGrid || !els.albumsSeamlessState) {
		return;
	}

	if (state.sectionStates.profilePictures.kind === 'loading') {
		seamlessAlbumsRenderedSignature = '';
		els.albumsSeamlessState.textContent = 'Loading images...';
		els.albumsSeamlessState.classList.remove('hidden');
		els.albumsSeamlessGrid.classList.add('hidden');
		els.albumsSeamlessGrid.innerHTML = '';
		return;
	}

	if (state.sectionStates.profilePictures.kind === 'error') {
		seamlessAlbumsRenderedSignature = '';
		els.albumsSeamlessState.textContent = state.sectionStates.profilePictures.message || 'Could not load album right now.';
		els.albumsSeamlessState.classList.remove('hidden');
		els.albumsSeamlessGrid.classList.add('hidden');
		els.albumsSeamlessGrid.innerHTML = '';
		return;
	}

	const pictures = getRenderableProfilePictures();

	if (!pictures.length) {
		seamlessAlbumsRenderedSignature = '';
		els.albumsSeamlessState.textContent = getSeamlessAlbumsNoPicturesMessage();
		els.albumsSeamlessState.classList.remove('hidden');
		els.albumsSeamlessGrid.classList.add('hidden');
		els.albumsSeamlessGrid.innerHTML = '';
		return;
	}

	profilePicturesCarouselItems = pictures;
	els.albumsSeamlessState.classList.add('hidden');
	els.albumsSeamlessGrid.classList.remove('hidden');

	const nextSignature = getProfilePicturesSignature(pictures);

	if (nextSignature === seamlessAlbumsRenderedSignature) {
		return;
	}

	seamlessAlbumsRenderedSignature = nextSignature;
	els.albumsSeamlessGrid.innerHTML = pictures.map((picture, index) => profilePictureCardMarkup(picture, index)).join('');
};

const openSeamlessAlbumsPage = ({ updateHistory = false } = {}) => {
	if (!els.dashboardMain || !els.albumsSeamlessPage) {
		return;
	}

	document.documentElement.classList.remove('albums-route-preload');

	seamlessAlbumsOpen = true;
	els.dashboardMain.classList.add('hidden');
	els.albumsSeamlessPage.classList.remove('hidden');
	document.body.classList.add('albums-page');
	renderSeamlessAlbumsPage();

	if (!state.profilePictures.length && state.sectionStates.profilePictures.kind !== 'loading') {
		void runSafe(fetchProfilePictures);
	}

	if (updateHistory && typeof window !== 'undefined' && window.location.pathname !== ALBUMS_ROUTE_PATH) {
		window.history.pushState({ view: 'albums' }, '', ALBUMS_ROUTE_PATH);
	}
};

const closeSeamlessAlbumsPage = ({ updateHistory = false, replaceHistory = false } = {}) => {
	if (!els.dashboardMain || !els.albumsSeamlessPage) {
		return;
	}

	document.documentElement.classList.remove('albums-route-preload');

	seamlessAlbumsOpen = false;
	closeProfilePicturesCarousel();
	els.albumsSeamlessPage.classList.add('hidden');
	els.dashboardMain.classList.remove('hidden');
	document.body.classList.remove('albums-page');

	if (!updateHistory || typeof window === 'undefined' || window.location.pathname !== ALBUMS_ROUTE_PATH) {
		return;
	}

	if (replaceHistory) {
		window.history.replaceState({ view: 'dashboard' }, '', lastDashboardRouteHref || DASHBOARD_ROUTE_PATH);
		return;
	}

	window.history.pushState({ view: 'dashboard' }, '', lastDashboardRouteHref || DASHBOARD_ROUTE_PATH);
};

const handleAlbumsBackNavigation = () => {
	if (typeof window === 'undefined') {
		closeSeamlessAlbumsPage({ updateHistory: false });
		return;
	}

	closeSeamlessAlbumsPage({
		updateHistory: true,
		replaceHistory: true
	});
};

const renderProfilePictures = () => {
	if (state.sectionStates.profilePictures.kind === 'loading' || state.sectionStates.profilePictures.kind === 'error') {
		renderSeamlessAlbumsPage();
		return;
	}

	const keyword = (state.searchByFolder.profilePictures || '').trim().toLowerCase();
	const filtered = getFilteredProfilePictures();

	if (!filtered.length) {
		setSectionState(
			'profilePictures',
			'empty',
			keyword ? 'No profile picture matched your search.' : 'No profile pictures have been captured yet.'
		);
		profilePicturesCarouselItems = [];
		renderSeamlessAlbumsPage();
		return;
	}

	setSectionState('profilePictures', 'idle');
	profilePicturesCarouselItems = filtered;
	renderSeamlessAlbumsPage();
};

const emitRealtimeAuditFilters = () => {
	if (!dashboardSocket || !realtimeConnected || !state.canEdit) {
		return;
	}

	const actionValues = getActiveAuditFilterValues(els.auditActionChips, 'data-audit-action');
	const roleValues = getActiveAuditFilterValues(els.auditRoleChips, 'data-audit-role');
	const queryValue = els.auditSearch?.value?.trim() || '';

	dashboardSocket.emit('dashboard:audit-filters', {
		action: actionValues.join(','),
		role: roleValues.join(','),
		query: queryValue,
		limit: 300
	});
};

const setupRealtime = () => {
	if (typeof window === 'undefined' || typeof window.io !== 'function') {
		renderSpotifyNowPlaying({ available: false, message: 'Spotify unavailable' });
		startSpotifyPolling();
		return;
	}

	dashboardSocket = window.io({
		path: '/socket.io',
		transports: ['websocket', 'polling'],
		withCredentials: true
	});

	dashboardSocket.on('connect', () => {
		realtimeConnected = true;
		setOnlineState(true);
		emitRealtimeAuditFilters();
	});

	dashboardSocket.on('disconnect', () => {
		realtimeConnected = false;
	});

	dashboardSocket.on('connect_error', () => {
		realtimeConnected = false;
		renderSpotifyNowPlaying({ available: false, message: 'Spotify unavailable' });
		startSpotifyPolling();
	});

	dashboardSocket.on('dashboard:status', (payload) => {
		if (!payload || typeof payload !== 'object') {
			return;
		}

		renderStatus(payload);
		setOnlineState(true);
		// renderSpotifyNowPlaying(payload.spotify || { available: false, message: 'Spotify unavailable' });
	});

	dashboardSocket.on('dashboard:logs', (payload) => {
		if (!state.canEdit || !payload || typeof payload !== 'object') {
			return;
		}

		state.lastDashboardLogId = Number(payload.lastId || state.lastDashboardLogId || 0);
		appendRealtimeLogs({
			target: state.dashboardLogs,
			incoming: payload.logs,
			limit: 500
		});

		botLogsBridgeWarningShown = false;
		setSectionState('logs', 'idle');
		renderLogs();
	});

	dashboardSocket.on('dashboard:bot-logs', (payload) => {
		if (!state.canEdit || !payload || typeof payload !== 'object') {
			return;
		}

		if (payload.ok === false) {
			if (!botLogsBridgeWarningShown) {
				botLogsBridgeWarningShown = true;
				showToast(payload.message || 'Bot log stream is not reachable right now.', 'warning');
			}

			return;
		}

		state.lastBotLogId = Number(payload.lastId || state.lastBotLogId || 0);
		appendRealtimeLogs({
			target: state.botLogs,
			incoming: payload.logs,
			limit: 500
		});

		botLogsBridgeWarningShown = false;

		setSectionState('logs', 'idle');
		renderLogs();
	});

	dashboardSocket.on('dashboard:audit', (payload) => {
		if (!state.canEdit || !payload || typeof payload !== 'object') {
			return;
		}

		const nextLogs = Array.isArray(payload.logs) ? payload.logs : [];
		const payloadLastId = Number(payload.lastId || 0);

		if (nextLogs.length === 0) {
			if (payloadLastId > 0) {
				void runSafe(fetchAudit);
				return;
			}

			if (state.auditLogs.length > 0) {
				return;
			}
		}

		const firstId = Number(nextLogs[0]?.id || 0);
		const lastId = Number(nextLogs.at(-1)?.id || 0);
		const nextSignature = `${payloadLastId}|${nextLogs.length}|${firstId}|${lastId}`;

		if (
			nextSignature === auditRenderSignature &&
			state.sectionStates.audit.kind === 'idle' &&
			nextLogs.length > 0 &&
			nextLogs.length === state.auditLogs.length
		) {
			return;
		}

		auditRenderSignature = nextSignature;
		state.lastAuditId = Number(payload.lastId || state.lastAuditId || 0);
		state.auditLogs = nextLogs;
		setSectionState('audit', 'idle');
		renderAuditChipCounts(state.auditLogs);
		renderAudit();
	});

	dashboardSocket.on('dashboard:commands', (payload) => {
		if (!payload || typeof payload !== 'object') {
			return;
		}

		state.commands = Array.isArray(payload.commands) ? payload.commands : [];
		setSectionState('commands', 'idle');
		renderCommands();
	});

	dashboardSocket.on('dashboard:flags', (payload) => {
		if (!payload || typeof payload !== 'object') {
			return;
		}

		state.flags = Array.isArray(payload.flags) ? payload.flags : [];
		setSectionState('flags', 'idle');
		renderFlags();
	});

	dashboardSocket.on('dashboard:users', (payload) => {
		if (!payload || typeof payload !== 'object') {
			return;
		}

		state.users = (Array.isArray(payload.users) ? payload.users : []).map((user) => {
			const draft = state.userLimitDrafts.get(user.id);

			if (typeof draft === 'number') {
				return {
					...user,
					limit: draft
				};
			}

			return user;
		});

		pruneSelectedUsers();
		setSectionState('users', 'idle');
		renderUsersKpi();
		renderUsers();
	});

	dashboardSocket.on('dashboard:profile-pictures', (payload) => {
		if (!payload || typeof payload !== 'object') {
			return;
		}

		if (hasActiveSeamlessAlbumsColorFilter()) {
			void runSafe(fetchProfilePictures);
			return;
		}

		let nextPictures = state.profilePictures;
		let hasChanges = false;
		const previousSignature = getProfilePicturesSignature(state.profilePictures);
		const wasIdle = state.sectionStates.profilePictures.kind === 'idle';

		if (payload.deleted) {
			const deletedTimestamp = String(payload.deleted?.timestamp || '').trim();
			const deletedUrl = getProfilePictureOriginalUrl(payload.deleted);

			if (deletedTimestamp || deletedUrl) {
				nextPictures = nextPictures.filter((picture) => {
					const sameTimestamp = deletedTimestamp ? String(picture?.timestamp || '').trim() === deletedTimestamp : true;
					const sameUrl = deletedUrl ? getProfilePictureOriginalUrl(picture) === deletedUrl : true;

					return !(sameTimestamp && sameUrl);
				});
				hasChanges = true;
			}
		}

		if (payload.picture) {
			const normalizedLatest = normalizeRealtimeProfilePicture(payload.picture);

			if (normalizedLatest) {
				const latestKey = getProfilePictureIdentityKey(normalizedLatest);

				nextPictures = [
					normalizedLatest,
					...nextPictures.filter((picture) => getProfilePictureIdentityKey(picture) !== latestKey)
				];
				hasChanges = true;
			}
		}

		if (Object.prototype.hasOwnProperty.call(payload, 'pictures')) {
			nextPictures = normalizeProfilePicturesCollection(payload.pictures);
			hasChanges = true;
		}

		if (!hasChanges) {
			return;
		}

		const normalizedPictures = normalizeProfilePicturesCollection(nextPictures);
		const nextSignature = getProfilePicturesSignature(normalizedPictures);

		if (nextSignature === previousSignature && wasIdle) {
			return;
		}

		if (nextSignature !== previousSignature) {
			state.profilePictures = normalizedPictures;
			persistSharedProfilePicturesCache(state.profilePictures);
		}

		setSectionState('profilePictures', 'idle');
		renderProfilePictures();
		renderSeamlessAlbumsPage();
	});
};

const fetchStatus = async () => {
	const response = await fetch('/api/dashboard/status');

	ensureAuthorizedResponse(response, 'Failed fetching status');

	const payload = await response.json();

	renderStatus(payload);
};

const fetchSession = async () => {
	const response = await fetch('/api/dashboard/auth/session');

	ensureAuthorizedResponse(response, 'Failed fetching session');

	const payload = await response.json();

	if (!payload.authenticated) {
		redirectToLogin();
		return;
	}

	state.role = payload.role || 'viewer';
	state.canEdit = state.role === 'owner';
	const settingsPanel = document.querySelector('.settings-panel');
	const ownerOnlyItems = Array.from(document.querySelectorAll('.owner-only'));
	const showEditor = state.canEdit;

	for (const item of ownerOnlyItems) {
		item.classList.toggle('hidden', !showEditor);
	}

	if (!showEditor && state.activeFolder === 'editor') {
		setActiveFolder('commands');
	}

	if (!state.canEdit) {
		els.clearConsole.disabled = true;
		els.editorView?.classList.add('hidden');
		editorRouteIntent = false;

		if (els.restartBot) {
			els.restartBot.disabled = true;
		}

		els.logsPanel?.classList.add('hidden');
		els.auditPanel?.classList.add('hidden');
		els.usersBulkToolbar?.classList.add('hidden');
		settingsPanel?.classList.add('hidden');

		if (els.auditActionChips) {
			els.auditActionChips.classList.add('is-disabled');
			els.auditActionChips.classList.add('hidden');
		}

		if (els.auditRoleChips) {
			els.auditRoleChips.classList.add('is-disabled');
			els.auditRoleChips.classList.add('hidden');
		}

		if (els.auditSearch) {
			els.auditSearch.disabled = true;
			els.auditSearch.classList.add('hidden');
		}

		if (els.auditClearFilters) {
			els.auditClearFilters.disabled = true;
			els.auditClearFilters.classList.add('hidden');
		}

		renderAuditChipCounts([]);

		renderAudit();
	} else {
		els.clearConsole.disabled = false;

		if (els.restartBot) {
			els.restartBot.disabled = false;
		}

		els.logsPanel?.classList.remove('hidden');
		els.auditPanel?.classList.remove('hidden');
		settingsPanel?.classList.remove('hidden');

		if (els.auditActionChips) {
			els.auditActionChips.classList.remove('is-disabled');
			els.auditActionChips.classList.remove('hidden');
		}

		if (els.auditRoleChips) {
			els.auditRoleChips.classList.remove('is-disabled');
			els.auditRoleChips.classList.remove('hidden');
		}

		if (els.auditSearch) {
			els.auditSearch.disabled = false;
			els.auditSearch.classList.remove('hidden');
		}

		if (els.auditClearFilters) {
			els.auditClearFilters.disabled = false;
			els.auditClearFilters.classList.remove('hidden');
		}

		if (editorRouteIntent) {
			setActiveFolder('editor');
			editorRouteIntent = false;
		}
	}
};

const fetchLogs = async () => {
	if (!state.canEdit) {
		return;
	}

	if (!state.dashboardLogs.length && !state.botLogs.length) {
		setSectionState('logs', 'loading', 'Fetching the latest logger output and building your console view.');
		setSectionContentVisibility('logs', false);
		renderSectionState('logs');
	}

	try {
		const [dashboardResponse, botResponse] = await Promise.allSettled([
			fetch(`/api/dashboard/logs/dashboard?since=${state.lastDashboardLogId}&limit=250`),
			fetch(`/api/dashboard/logs/bot?since=${state.lastBotLogId}&limit=250`)
		]);

		if (dashboardResponse.status === 'rejected') {
			throw dashboardResponse.reason;
		}

		ensureAuthorizedResponse(dashboardResponse.value, 'Failed fetching dashboard logs');

		const dashboardPayload = await dashboardResponse.value.json();

		state.lastDashboardLogId = Number(dashboardPayload.lastId || state.lastDashboardLogId || 0);

		if (Array.isArray(dashboardPayload.logs) && dashboardPayload.logs.length) {
			state.dashboardLogs.push(...dashboardPayload.logs);

			if (state.dashboardLogs.length > 500) {
				state.dashboardLogs.splice(0, state.dashboardLogs.length - 500);
			}
		}

		if (botResponse.status === 'fulfilled') {
			if (botResponse.value.ok) {
				const botPayload = await botResponse.value.json();

				state.lastBotLogId = Number(botPayload.lastId || state.lastBotLogId || 0);

				if (Array.isArray(botPayload.logs) && botPayload.logs.length) {
					state.botLogs.push(...botPayload.logs);

					if (state.botLogs.length > 500) {
						state.botLogs.splice(0, state.botLogs.length - 500);
					}
				}

				botLogsBridgeWarningShown = false;
			} else if (!botLogsBridgeWarningShown) {
				botLogsBridgeWarningShown = true;
				showToast('Bot log stream is not reachable right now.', 'warning');
			}
		} else if (!botLogsBridgeWarningShown) {
			botLogsBridgeWarningShown = true;
			showToast('Bot log stream is not reachable right now.', 'warning');
		}

		setSectionState('logs', 'idle');
		renderLogs();
	} catch (error) {
		setSectionState('logs', 'error', error?.message || 'Could not fetch logger output.');
		setSectionContentVisibility('logs', false);
		renderSectionState('logs');
		throw error;
	}
};

const restartBot = async () => {
	const approved = await confirmRiskAction({
		title: 'Restart Bot Runtime?',
		message: 'Bot process will restart via PM2. Dashboard will stay online.',
		confirmLabel: 'Restart Bot'
	});

	if (!approved) {
		return;
	}

	if (els.restartBot) {
		els.restartBot.disabled = true;
	}

	try {
		const response = await fetch('/api/dashboard/bot/restart', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		ensureAuthorizedResponse(response, 'Failed to restart bot');
		showToast('Restart signal sent. Bot should reconnect shortly.', 'warning');

		setTimeout(() => {
			void runSafe(fetchStatus);
			void runSafe(fetchLogs);
		}, 1800);
	} catch (error) {
		showToast(error?.message || 'Failed restarting bot.', 'error');
	} finally {
		if (els.restartBot) {
			els.restartBot.disabled = false;
		}
	}
};

async function fetchAudit() {
	if (!state.canEdit) {
		return;
	}

	if (!state.auditLogs.length) {
		setSectionState('audit', 'loading', 'Collecting recent activity entries and applying your selected filters.');
		setSectionContentVisibility('audit', false);
		renderSectionState('audit');
	}

	const actionValues = getActiveAuditFilterValues(els.auditActionChips, 'data-audit-action');
	const roleValues = getActiveAuditFilterValues(els.auditRoleChips, 'data-audit-role');
	const queryValue = els.auditSearch?.value?.trim() || '';

	const params = new URLSearchParams({
		limit: '300',
		action: actionValues.join(','),
		role: roleValues.join(','),
		query: queryValue
	});
	const hasDimensionFilters = actionValues.length > 0 || roleValues.length > 0;

	try {
		const response = await fetch(`/api/dashboard/audit?${params.toString()}`);

		ensureAuthorizedResponse(response, 'Failed fetching audit timeline');

		let countPayload = null;

		if (hasDimensionFilters) {
			const countParams = new URLSearchParams({
				limit: '300',
				query: queryValue
			});
			const countResponse = await fetch(`/api/dashboard/audit?${countParams.toString()}`);

			ensureAuthorizedResponse(countResponse, 'Failed fetching audit counters');
			countPayload = await countResponse.json();
		}

		const payload = await response.json();
		const incomingLogs = Array.isArray(payload?.logs) ? payload.logs : [];
		const hasQueryFilter = Boolean(queryValue);

		if (!hasDimensionFilters && !hasQueryFilter && realtimeConnected && state.auditLogs.length && !incomingLogs.length) {
			setSectionState('audit', 'idle');
			renderAuditChipCounts(state.auditLogs);
			renderAudit();
			return;
		}

		state.lastAuditId = Number(payload?.lastId || 0);
		state.auditLogs = incomingLogs;

		const firstId = Number(state.auditLogs[0]?.id || 0);
		const lastId = Number(state.auditLogs.at(-1)?.id || 0);

		auditRenderSignature = `${state.lastAuditId}|${state.auditLogs.length}|${firstId}|${lastId}`;

		const countLogs = Array.isArray(countPayload?.logs) ? countPayload.logs : state.auditLogs;

		setSectionState('audit', 'idle');
		renderAuditChipCounts(countLogs);
		renderAudit();
	} catch (error) {
		setSectionState('audit', 'error', error?.message || 'Could not fetch activity timeline.');
		setSectionContentVisibility('audit', false);
		renderSectionState('audit');
		throw error;
	}
}

const fetchCommands = async () => {
	if (!state.commands.length) {
		setSectionState('commands', 'loading', 'Loading command states, categories, and moderation actions.');
		setSectionContentVisibility('commands', false);
		renderSectionState('commands');
	}

	try {
		const response = await fetch('/api/dashboard/commands');

		ensureAuthorizedResponse(response, 'Failed fetching commands');

		const payload = await response.json();

		state.commands = payload.commands || [];
		setSectionState('commands', 'idle');
		renderCommands();
	} catch (error) {
		setSectionState('commands', 'error', error?.message || 'Could not fetch command controls.');
		setSectionContentVisibility('commands', false);
		renderSectionState('commands');
		throw error;
	}
};

const fetchFlags = async () => {
	if (!state.flags.length) {
		setSectionState('flags', 'loading', 'Loading runtime flag states and available toggle actions.');
		setSectionContentVisibility('flags', false);
		renderSectionState('flags');
	}

	try {
		const response = await fetch('/api/dashboard/flags');

		ensureAuthorizedResponse(response, 'Failed fetching flags');

		const payload = await response.json();

		state.flags = payload.flags || [];
		setSectionState('flags', 'idle');
		renderFlags();
	} catch (error) {
		setSectionState('flags', 'error', error?.message || 'Could not fetch bot flags.');
		setSectionContentVisibility('flags', false);
		renderSectionState('flags');
		throw error;
	}
};

async function fetchUsers() {
	if (!state.users.length) {
		setSectionState('users', 'loading', 'Loading users, limits, and moderation status for this panel.');
		els.usersBulkToolbar?.classList.add('hidden');
		els.usersWrap?.classList.add('hidden');
		renderSectionState('users');
	}

	try {
		const response = await fetch('/api/dashboard/users');

		ensureAuthorizedResponse(response, 'Failed fetching users');

		const payload = await response.json();

		state.users = (payload.users || []).map((user) => {
			const draft = state.userLimitDrafts.get(user.id);

			if (typeof draft === 'number') {
				return {
					...user,
					limit: draft
				};
			}

			return user;
		});
		pruneSelectedUsers();
		setSectionState('users', 'idle');
		renderUsersKpi();
		renderUsers();
	} catch (error) {
		setSectionState('users', 'error', error?.message || 'Could not fetch users section.');
		els.usersBulkToolbar?.classList.add('hidden');
		els.usersWrap?.classList.add('hidden');
		renderSectionState('users');
		throw error;
	}
}

const fetchProfilePictures = async () => {
	if (!state.profilePictures.length) {
		setSectionState('profilePictures', 'loading', 'Loading Pinterest profile picture history and building album cards.');
		renderSeamlessAlbumsPage();
	}

	try {
		const response = await fetch(buildProfilePicturesRequestUrl(), {
			cache: 'no-store'
		});

		ensureAuthorizedResponse(response, 'Failed fetching profile picture album');

		const payload = await response.json();
		const normalizedPictures = normalizeProfilePicturesCollection(payload.pictures);
		const previousSignature = getProfilePicturesSignature(state.profilePictures);
		const nextSignature = getProfilePicturesSignature(normalizedPictures);
		const wasIdle = state.sectionStates.profilePictures.kind === 'idle';

		if (nextSignature !== previousSignature) {
			state.profilePictures = normalizedPictures;
			persistSharedProfilePicturesCache(state.profilePictures);
		}

		setSectionState('profilePictures', 'idle');

		if (nextSignature === previousSignature && wasIdle) {
			return;
		}

		renderProfilePictures();
		renderSeamlessAlbumsPage();
	} catch (error) {
		setSectionState('profilePictures', 'error', error?.message || 'Could not fetch profile pictures section.');
		renderSeamlessAlbumsPage();
		throw error;
	}
};

const setCommandState = async (name, enabled) => {
	const response = await fetch(`/api/dashboard/commands/${encodeURIComponent(name)}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ enabled })
	});

	ensureAuthorizedResponse(response, `Failed toggling ${name}`);

	return response.json();
};

const setFlagState = async (name, enabled) => {
	const response = await fetch(`/api/dashboard/flags/${encodeURIComponent(name)}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ enabled })
	});

	ensureAuthorizedResponse(response, `Failed toggling ${name}`);

	return response.json();
};

const setUserPremium = async (userId, enabled) => {
	const response = await fetch(`/api/dashboard/users/${encodeURIComponent(userId)}/premium`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ enabled })
	});

	ensureAuthorizedResponse(response, `Failed updating premium state for ${userId}`);

	return response.json();
};

const setUserBanned = async (userId, enabled) => {
	const response = await fetch(`/api/dashboard/users/${encodeURIComponent(userId)}/banned`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ enabled })
	});

	ensureAuthorizedResponse(response, `Failed updating banned state for ${userId}`);

	return response.json();
};

const setUserBlocked = async (userId, enabled) => {
	const response = await fetch(`/api/dashboard/users/${encodeURIComponent(userId)}/blocked`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ enabled })
	});

	ensureAuthorizedResponse(response, `Failed updating blocked state for ${userId}`);

	return response.json();
};

const runSafe = async (fn) => {
	try {
		await fn();
		setOnlineState(true);
	} catch {
		setOnlineState(false);
	}
};

function startPollingLoops() {
	for (const key of Object.keys(pollingTimers)) {
		if (pollingTimers[key]) {
			clearInterval(pollingTimers[key]);
			pollingTimers[key] = null;
		}
	}

	pollingTimers.status = setInterval(() => {
		if (realtimeConnected) {
			return;
		}

		void runSafe(fetchStatus);
	}, state.settings.statusRefreshMs);

	pollingTimers.logs = setInterval(() => {
		if (realtimeConnected) {
			return;
		}

		if (state.canEdit) {
			void runSafe(fetchLogs);
		}
	}, state.settings.logsRefreshMs);

	pollingTimers.audit = setInterval(() => {
		if (realtimeConnected) {
			return;
		}

		if (state.canEdit) {
			void runSafe(fetchAudit);
		}
	}, state.settings.auditRefreshMs);

	pollingTimers.commands = setInterval(() => {
		if (realtimeConnected) {
			return;
		}

		void runSafe(fetchCommands);
	}, state.settings.dataRefreshMs);

	pollingTimers.flags = setInterval(() => {
		if (realtimeConnected) {
			return;
		}

		void runSafe(fetchFlags);
	}, state.settings.dataRefreshMs);

	pollingTimers.users = setInterval(() => {
		if (realtimeConnected) {
			return;
		}

		void runSafe(fetchUsers);
	}, state.settings.dataRefreshMs);

	pollingTimers.profilePictures = setInterval(() => {
		if (realtimeConnected) {
			return;
		}

		void runSafe(fetchProfilePictures);
	}, state.settings.dataRefreshMs);
}

const resetAuditFilters = () => {
	setAuditChipValues(els.auditActionChips, 'data-audit-action', []);
	setAuditChipValues(els.auditRoleChips, 'data-audit-role', []);

	if (els.auditSearch) {
		els.auditSearch.value = '';
	}

	syncAuditFiltersToUrl();
	void runSafe(fetchAudit);
	showToast('Audit filters cleared.', 'success');
};

const setAuditActionCollapsed = (collapsed, options = {}) => {
	state.auditActionCollapsed = Boolean(collapsed);

	if (els.auditActionChips) {
		els.auditActionChips.classList.toggle('is-collapsed', state.auditActionCollapsed);
	}

	if (els.auditActionSeparator) {
		els.auditActionSeparator.classList.add('nf');
		els.auditActionSeparator.classList.add(state.auditActionCollapsed ? 'nf-fa-chevron_right' : 'nf-fa-ellipsis_vertical');
		els.auditActionSeparator.setAttribute('aria-expanded', state.auditActionCollapsed ? 'false' : 'true');
		els.auditActionSeparator.setAttribute(
			'data-tooltip',
			state.auditActionCollapsed ? 'Show individual action chips' : 'Hide individual action chips'
		);
	}

	if (options.persist !== false) {
		try {
			localStorage.setItem(AUDIT_ACTIONS_COLLAPSED_KEY, state.auditActionCollapsed ? '1' : '0');
		} catch {
			// ignore storage write errors
		}
	}
};

const loadAuditActionCollapsed = () => {
	try {
		const raw = localStorage.getItem(AUDIT_ACTIONS_COLLAPSED_KEY);

		if (raw === '1' || raw === '0') {
			setAuditActionCollapsed(raw === '1', { persist: false });
			return;
		}
	} catch {
		// ignore storage read errors and fallback to expanded
	}

	setAuditActionCollapsed(false, { persist: false });
};

const setAuditRoleCollapsed = (collapsed, options = {}) => {
	state.auditRoleCollapsed = Boolean(collapsed);

	if (els.auditRoleChips) {
		els.auditRoleChips.classList.toggle('is-collapsed', state.auditRoleCollapsed);
	}

	if (els.auditRoleSeparator) {
		els.auditRoleSeparator.classList.add('nf');
		els.auditRoleSeparator.classList.add(state.auditRoleCollapsed ? 'nf-fa-chevron_right' : 'nf-fa-ellipsis_vertical');
		els.auditRoleSeparator.setAttribute('aria-expanded', state.auditRoleCollapsed ? 'false' : 'true');
		els.auditRoleSeparator.setAttribute(
			'data-tooltip',
			state.auditRoleCollapsed ? 'Show individual role chips' : 'Hide individual role chips'
		);
	}

	if (options.persist !== false) {
		try {
			localStorage.setItem(AUDIT_ROLES_COLLAPSED_KEY, state.auditRoleCollapsed ? '1' : '0');
		} catch {
			// ignore storage write errors
		}
	}
};

const loadAuditRoleCollapsed = () => {
	try {
		const raw = localStorage.getItem(AUDIT_ROLES_COLLAPSED_KEY);

		if (raw === '1' || raw === '0') {
			setAuditRoleCollapsed(raw === '1', { persist: false });
			return;
		}
	} catch {
		// ignore storage read errors and fallback to expanded
	}

	setAuditRoleCollapsed(false, { persist: false });
};

const bindEvents = () => {
	els.confirmCancel?.addEventListener('click', () => {
		closeConfirmDialog(false);
	});

	els.confirmAccept?.addEventListener('click', () => {
		closeConfirmDialog(true);
	});

	els.editorCloseCancel?.addEventListener('click', () => {
		closeEditorCloseDialog('cancel');
	});

	els.editorCloseDiscard?.addEventListener('click', () => {
		closeEditorCloseDialog('discard');
	});

	els.editorCloseSave?.addEventListener('click', () => {
		closeEditorCloseDialog('save');
	});

	els.confirmDialog?.addEventListener('click', (event) => {
		if (event.target === els.confirmDialog) {
			closeConfirmDialog(false);
		}
	});

	els.editorCloseDialog?.addEventListener('click', (event) => {
		if (event.target === els.editorCloseDialog) {
			closeEditorCloseDialog('cancel');
		}
	});

	els.openChangelog?.addEventListener('click', () => {
		openChangelogDialog();
	});

	els.openContributors?.addEventListener('click', () => {
		openContributorsDialog();
	});

	els.spotifyCoverButton?.addEventListener('click', () => {
		openSpotifyPopup();
	});

	els.spotifyPopup?.addEventListener('click', (event) => {
		if (event.target === els.spotifyPopup) {
			closeSpotifyPopup();
		}
	});

	els.spotifyLink?.addEventListener('click', handleSpotifyLinkClick);
	els.spotifyPopupLink?.addEventListener('click', handleSpotifyLinkClick);

	els.openAlbums?.addEventListener('pointerdown', (event) => {
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
			return;
		}

		persistZenPointerFromEvent(event);
	});

	els.openAlbums?.addEventListener('click', (event) => {
		event.preventDefault();
		persistZenPointerFromEvent(event);
		navigateToAlbums();
	});

	els.albumsSeamlessBack?.addEventListener('click', (event) => {
		persistZenPointerFromEvent(event);
		handleAlbumsBackNavigation();
	});

	els.albumsSeamlessColorTrigger?.addEventListener('click', (event) => {
		event.preventDefault();
		event.stopPropagation();
		toggleSeamlessAlbumsColorPicker();
	});

	els.albumsSeamlessColorClear?.addEventListener('click', () => {
		if (!hasActiveSeamlessAlbumsColorFilter()) {
			return;
		}

		seamlessAlbumsColorFilterHex = '';
		seamlessAlbumsColorisPickerDraftHex = '';
		updateSeamlessAlbumsColorFilterUi();
		void runSafe(fetchProfilePictures);
	});

	els.openAlbums?.addEventListener('pointerenter', () => {
		prefetchRoute('/albums');
	});

	els.openAlbums?.addEventListener('focus', () => {
		prefetchRoute('/albums');
	});

	els.albumsSeamlessGrid?.addEventListener('click', (event) => {
		const image = event.target.closest('.album-image[data-profile-index]');

		if (!(image instanceof HTMLImageElement)) {
			return;
		}

		const index = Number.parseInt(image.getAttribute('data-profile-index') || '', 10);

		if (!Number.isFinite(index)) {
			return;
		}

		openProfilePicturesCarousel(index);
	});

	els.profilePicturesLightboxBackdrop?.addEventListener('click', closeProfilePicturesCarousel);
	els.profilePicturesLightbox?.addEventListener('click', (event) => {
		const target = event.target;

		if (!(target instanceof Element)) {
			return;
		}

		const selectedCard = target.closest('.albums-carousel-item');

		if (selectedCard instanceof HTMLElement) {
			if (selectedCard.classList.contains('is-center')) {
				return;
			}

			const targetIndex = Number.parseInt(String(selectedCard.dataset.targetIndex || ''), 10);

			if (Number.isFinite(targetIndex) && profilePicturesCarouselItems.length > 1) {
				const total = profilePicturesCarouselItems.length;
				const current = wrapProfilePicturesIndex(profilePicturesCarouselIndex, total);
				const next = wrapProfilePicturesIndex(targetIndex, total);

				if (next !== current) {
					const forward = (next - current + total) % total;
					const backward = (current - next + total) % total;

					profilePicturesCarouselIndex = next;
					renderProfilePicturesCarousel();
					triggerProfilePicturesCycleAnimation(forward <= backward ? 1 : -1);
				}
			}

			return;
		}

		if (!target.closest('.albums-lightbox-menu')) {
			closeProfilePicturesActionMenu();
		}

		if (target.closest('.albums-lightbox-menu, .albums-lightbox-content')) {
			if (target.closest('.albums-lightbox-menu')) {
				return;
			}

			const centerCard = els.profilePicturesLightboxTrack?.querySelector('.albums-carousel-item.is-center');

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

			closeProfilePicturesCarousel();
			return;
		}

		closeProfilePicturesCarousel();
	});
	els.profilePicturesLightboxMenuToggle?.addEventListener('click', (event) => {
		event.preventDefault();
		event.stopPropagation();

		if (!els.profilePicturesLightboxMenuPanel || !els.profilePicturesLightboxMenuToggle) {
			return;
		}

		const shouldOpen = els.profilePicturesLightboxMenuPanel.classList.contains('hidden');

		els.profilePicturesLightboxMenuPanel.classList.toggle('hidden', !shouldOpen);
		els.profilePicturesLightboxMenuToggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
	});
	els.profilePicturesLightboxMenuDownload?.addEventListener('click', (event) => {
		event.preventDefault();
		event.stopPropagation();
		void downloadCurrentProfilePicture();
		closeProfilePicturesActionMenu();
	});
	els.profilePicturesLightboxMenuDelete?.addEventListener('click', (event) => {
		event.preventDefault();
		event.stopPropagation();
		void deleteCurrentProfilePicture();
		closeProfilePicturesActionMenu();
	});
	els.profilePicturesLightbox?.addEventListener('wheel', handleProfilePicturesLightboxWheel, {
		passive: false
	});
	els.profilePicturesLightbox?.addEventListener('touchstart', handleProfilePicturesLightboxTouchStart, {
		passive: true
	});
	els.profilePicturesLightbox?.addEventListener('touchmove', handleProfilePicturesLightboxTouchMove, {
		passive: true
	});
	els.profilePicturesLightbox?.addEventListener('touchend', handleProfilePicturesLightboxTouchEnd, {
		passive: true
	});
	els.profilePicturesLightbox?.addEventListener('touchcancel', resetProfilePicturesTouchState, {
		passive: true
	});

	els.changelogClose?.addEventListener('click', () => {
		closeChangelogDialog();
	});

	els.changelogDialog?.addEventListener('click', (event) => {
		if (event.target === els.changelogDialog) {
			closeChangelogDialog();
		}
	});

	els.contributorsClose?.addEventListener('click', () => {
		closeContributorsDialog();
	});

	els.contributorsDialog?.addEventListener('click', (event) => {
		if (event.target === els.contributorsDialog) {
			closeContributorsDialog();
		}
	});

	els.logoutCancel?.addEventListener('click', () => {
		closeLogoutDialog();
	});

	els.logoutConfirm?.addEventListener('click', () => {
		void logoutDashboard();
	});

	els.logoutDialog?.addEventListener('click', (event) => {
		if (event.target === els.logoutDialog) {
			closeLogoutDialog();
		}
	});

	document.addEventListener('keydown', (event) => {
		if (event.key !== 'Escape') {
			return;
		}

		closeSpotifyPopup();
		closeAllCustomFilters();

		if (!els.changelogDialog?.classList.contains('hidden')) {
			closeChangelogDialog();
			return;
		}

		if (!els.contributorsDialog?.classList.contains('hidden')) {
			closeContributorsDialog();
			return;
		}

		if (!els.confirmDialog?.classList.contains('hidden')) {
			closeConfirmDialog(false);
			return;
		}

		if (!els.logoutDialog?.classList.contains('hidden')) {
			closeLogoutDialog();
		}
	});

	document.addEventListener('keydown', (event) => {
		if (!(event.ctrlKey || event.metaKey)) {
			return;
		}

		if (event.key.toLowerCase() !== 's') {
			return;
		}

		if (state.activeFolder !== 'editor') {
			return;
		}

		event.preventDefault();
		void saveEditorFile();
	});

	document.addEventListener('click', (event) => {
		if (!event.target.closest('.custom-select')) {
			closeAllCustomFilters();
		}
	});

	els.clearConsole.addEventListener('click', () => {
		state.dashboardLogs = [];
		state.botLogs = [];
		state.lastDashboardLogId = 0;
		state.lastBotLogId = 0;

		if (els.dashboardLoggerConsole) {
			els.dashboardLoggerConsole.textContent = '';
		}

		if (els.botLoggerConsole) {
			els.botLoggerConsole.textContent = '';
		}
	});

	els.restartBot?.addEventListener('click', () => {
		void restartBot();
	});

	document.addEventListener('click', (event) => {
		const retryButton = event.target.closest('button[data-section-retry]');

		if (!retryButton) {
			return;
		}

		const section = retryButton.getAttribute('data-section-retry') || '';

		if (section === 'logs') {
			void runSafe(fetchLogs);
			return;
		}

		if (section === 'audit') {
			void runSafe(fetchAudit);
			return;
		}

		if (section === 'commands') {
			void runSafe(fetchCommands);
			return;
		}

		if (section === 'flags') {
			void runSafe(fetchFlags);
			return;
		}

		if (section === 'users') {
			void runSafe(fetchUsers);
			return;
		}

		if (section === 'profilePictures') {
			void runSafe(fetchProfilePictures);
		}
	});

	els.auditActionChips?.addEventListener('click', (event) => {
		const separator = event.target.closest('#audit-action-separator');

		if (separator) {
			setAuditActionCollapsed(!state.auditActionCollapsed);
			return;
		}

		const chip = event.target.closest('button.audit-chip[data-audit-action]');

		if (!chip || !state.canEdit) {
			return;
		}

		toggleAuditChip(els.auditActionChips, 'data-audit-action', chip);
		syncAuditFiltersToUrl();
		emitRealtimeAuditFilters();
		void runSafe(fetchAudit);
	});

	els.auditRoleChips?.addEventListener('click', (event) => {
		const separator = event.target.closest('#audit-role-separator');

		if (separator) {
			setAuditRoleCollapsed(!state.auditRoleCollapsed);
			return;
		}

		const chip = event.target.closest('button.audit-chip[data-audit-role]');

		if (!chip || !state.canEdit) {
			return;
		}

		toggleAuditChip(els.auditRoleChips, 'data-audit-role', chip);
		syncAuditFiltersToUrl();
		emitRealtimeAuditFilters();
		void runSafe(fetchAudit);
	});

	els.auditSearch?.addEventListener('input', () => {
		syncAuditFiltersToUrl();
		emitRealtimeAuditFilters();
		void runSafe(fetchAudit);
	});

	els.auditClearFilters?.addEventListener('click', () => {
		if (!state.canEdit) {
			return;
		}

		resetAuditFilters();
	});

	const onSeparatorKeydown = (event, onToggle) => {
		if (event.key !== 'Enter' && event.key !== ' ') {
			return;
		}

		event.preventDefault();
		onToggle();
	};

	els.auditActionSeparator?.addEventListener('keydown', (event) => {
		onSeparatorKeydown(event, () => setAuditActionCollapsed(!state.auditActionCollapsed));
	});

	els.auditRoleSeparator?.addEventListener('keydown', (event) => {
		onSeparatorKeydown(event, () => setAuditRoleCollapsed(!state.auditRoleCollapsed));
	});

	els.themeToggle?.addEventListener('click', () => {
		toggleThemePreference();
	});

	els.settingsThemePalette?.addEventListener('click', (event) => {
		const option = event.target.closest('.custom-select-option');

		if (option) {
			const selectedValue = setCustomFilterValue(
				els.settingsThemePalette,
				option.getAttribute('data-value') || DEFAULT_THEME_PALETTE
			);
			const currentPalette = document.documentElement.getAttribute('data-palette') || DEFAULT_THEME_PALETTE;

			closeCustomFilter(els.settingsThemePalette);

			if (selectedValue !== currentPalette) {
				applyThemePalette(selectedValue);
				showToast('Theme palette updated.', 'success');
			}

			return;
		}

		const trigger = event.target.closest('.custom-select-trigger');

		if (trigger) {
			toggleCustomFilter(els.settingsThemePalette);
		}
	});

	setupStatusChartHover();

	els.settingsSave?.addEventListener('click', () => {
		const nextSettings = getSettingsFromInputs();

		applyDashboardSettings(nextSettings);
		trimMetricHistoryToLimit();
		renderStatusCharts();
		startPollingLoops();
		showToast('Dashboard settings saved.', 'success');
	});

	els.settingsReset?.addEventListener('click', () => {
		applyDashboardSettings(DEFAULT_DASHBOARD_SETTINGS);
		applyThemePalette(DEFAULT_THEME_PALETTE);
		trimMetricHistoryToLimit();
		renderStatusCharts();
		startPollingLoops();
		showToast('Dashboard settings reset to defaults.', 'info');
	});

	els.controlsSearch.addEventListener('input', () => {
		state.searchByFolder[state.activeFolder] = els.controlsSearch.value;

		if (state.activeFolder === 'commands') {
			renderCommands();
			return;
		}

		if (state.activeFolder === 'flags') {
			renderFlags();
			return;
		}

		if (state.activeFolder === 'editor') {
			renderEditorTree();
			return;
		}

		renderUsers();
	});

	els.logoutButton.addEventListener('click', () => {
		openLogoutDialog();
	});

	els.folderSwitcher.addEventListener('click', (event) => {
		const filterTrigger = event.target.closest('.custom-select-trigger');

		if (filterTrigger) {
			toggleCustomFilter(filterTrigger.closest('.custom-select'));
			return;
		}

		const filterOption = event.target.closest('.custom-select-option');

		if (filterOption) {
			const filterElement = filterOption.closest('.custom-select');
			const selectedValue = setCustomFilterValue(filterElement, filterOption.getAttribute('data-value') || '');

			closeCustomFilter(filterElement);

			if (filterElement === els.controlsCommandFilter) {
				state.searchFilters.commandsState = selectedValue || 'all';

				if (state.activeFolder === 'commands') {
					renderCommands();
				}

				return;
			}

			if (filterElement === els.controlsCommandSort) {
				state.searchFilters.commandsSort = selectedValue || 'name-asc';

				if (state.activeFolder === 'commands') {
					renderCommands();
				}

				return;
			}

			if (filterElement === els.controlsFlagFilter) {
				state.searchFilters.flagsState = selectedValue || 'all';

				if (state.activeFolder === 'flags') {
					renderFlags();
				}

				return;
			}

			if (filterElement === els.controlsUserRoleFilter) {
				state.searchFilters.usersRole = selectedValue || 'all';

				if (state.activeFolder === 'users') {
					renderUsers();
				}

				return;
			}

			if (filterElement === els.controlsUserStatusFilter) {
				state.searchFilters.usersStatus = selectedValue || 'all';

				if (state.activeFolder === 'users') {
					renderUsers();
				}
			}

			return;
		}

		const folderToggle = event.target.closest('button[data-folder-toggle]');

		if (!folderToggle) {
			return;
		}

		setActiveFolder(folderToggle.getAttribute('data-folder-toggle'));
	});

	els.editorRefreshTree?.addEventListener('click', () => {
		editorTreeSnapshot = null;
		editorTreeExpanded = new Set(['']);
		void ensureEditorReady();
	});

	els.editorThemeSelect?.querySelector('.custom-select-trigger')?.addEventListener('click', () => {
		toggleCustomFilter(els.editorThemeSelect);
	});

	els.editorThemeSelect?.querySelector('.custom-select-menu')?.addEventListener('click', (event) => {
		const option = event.target.closest('.custom-select-option');

		if (!option) {
			return;
		}

		const value = option.getAttribute('data-value') || '';

		setCustomFilterValue(els.editorThemeSelect, value);
		closeCustomFilter(els.editorThemeSelect);
		setEditorTheme(value);
	});

	els.editorTree?.addEventListener('click', (event) => {
		const toggle = event.target.closest('[data-editor-toggle]');

		if (toggle) {
			const pathValue = toggle.getAttribute('data-editor-toggle') || '';

			if (editorTreeExpanded.has(pathValue)) {
				editorTreeExpanded.delete(pathValue);
			} else {
				editorTreeExpanded.add(pathValue);
			}

			renderEditorTree();
			return;
		}

		const file = event.target.closest('[data-editor-file]');

		if (!file) {
			return;
		}

		const pathValue = file.getAttribute('data-editor-file') || '';

		void openEditorFile(pathValue);
	});

	els.editorTabs?.addEventListener('click', (event) => {
		const closeButton = event.target.closest('[data-editor-close]');

		if (closeButton) {
			const pathValue = closeButton.getAttribute('data-editor-close') || '';

			void closeEditorTab(pathValue);
			return;
		}

		const tab = event.target.closest('[data-editor-tab]');

		if (!tab) {
			return;
		}

		const pathValue = tab.getAttribute('data-editor-tab') || '';

		void setActiveEditorTab(pathValue);
	});

	els.editorSave?.addEventListener('click', () => {
		void saveEditorFile();
	});

	els.editorUndo?.addEventListener('click', () => {
		void undoEditorChange();
	});

	els.editorFormat?.addEventListener('click', () => {
		void formatEditorFile();
	});

	els.editorConfigClear?.addEventListener('click', () => {
		if (els.editorConfigInput) {
			els.editorConfigInput.value = '';
		}

		showToast('Using default Prettier config.', 'info');
	});

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && els.editorCloseDialog && !els.editorCloseDialog.classList.contains('hidden')) {
			closeEditorCloseDialog('cancel');
			return;
		}

		if (event.key === 'Escape' && els.profilePicturesLightbox && !els.profilePicturesLightbox.classList.contains('hidden')) {
			closeProfilePicturesCarousel();
			return;
		}

		if (event.key === 'Escape' && seamlessAlbumsOpen) {
			handleAlbumsBackNavigation();
			return;
		}

		if (event.key === 'ArrowLeft') {
			moveProfilePicturesCarousel(-1);
			return;
		}

		if (event.key === 'ArrowRight') {
			moveProfilePicturesCarousel(1);
		}
	});

	window.addEventListener('popstate', () => {
		if (typeof window === 'undefined') {
			return;
		}

		if (window.location.pathname === ALBUMS_ROUTE_PATH) {
			openSeamlessAlbumsPage({ updateHistory: false });
			return;
		}

		if (seamlessAlbumsOpen) {
			closeSeamlessAlbumsPage({ updateHistory: false });
		}
	});

	els.commandsGroups.addEventListener('click', async (event) => {
		const categoryToggle = event.target.closest('button[data-category-toggle]');

		if (categoryToggle) {
			const categoryKey = categoryToggle.getAttribute('data-category-toggle');

			if (state.collapsedCategories.has(categoryKey)) {
				state.collapsedCategories.delete(categoryKey);
			} else {
				state.collapsedCategories.add(categoryKey);
			}

			saveCollapsedCategories();
			renderCommands();
			return;
		}

		const button = event.target.closest('button[data-command]');

		if (!button || !state.canEdit) {
			return;
		}

		const commandName = button.getAttribute('data-command');
		const enabled = button.getAttribute('data-enabled') === 'true';

		button.disabled = true;

		try {
			const payload = await setCommandState(commandName, enabled);

			await fetchCommands();

			showUndoToast({
				message: enabled ? `Command enabled: ${commandName}` : `Command disabled: ${commandName}`,
				undo: payload?.undo || null,
				onAfterUndo: async () => {
					await fetchCommands();
				}
			});
		} catch (error) {
			console.error(error);
		} finally {
			button.disabled = false;
		}
	});

	els.flagsGroups.addEventListener('click', async (event) => {
		const button = event.target.closest('button[data-flag]');

		if (!button || !state.canEdit) {
			return;
		}

		const flagName = button.getAttribute('data-flag');
		const enabled = button.getAttribute('data-enabled') === 'true';

		button.disabled = true;

		try {
			const payload = await setFlagState(flagName, enabled);

			await fetchFlags();

			showUndoToast({
				message: enabled ? `Flag enabled: ${flagName}` : `Flag disabled: ${flagName}`,
				undo: payload?.undo || null,
				onAfterUndo: async () => {
					await fetchFlags();
				}
			});
		} catch (error) {
			console.error(error);
		} finally {
			button.disabled = false;
		}
	});

	els.usersGroups.addEventListener('click', async (event) => {
		if (!state.canEdit) {
			return;
		}

		const stepButton = event.target.closest('button[data-user-step]');

		if (stepButton) {
			const userId = stepButton.getAttribute('data-user-id');
			const input = els.usersGroups.querySelector(`input[data-user-limit="${userId}"]`);

			if (!input) {
				return;
			}

			const step = Number.parseInt(stepButton.getAttribute('data-user-step') || '0', 10) || 0;
			const current = Math.max(0, Number.parseInt(input.value || '0', 10) || 0);
			const next = Math.max(0, current + step);

			input.value = String(next);
			updateUserLimitDisplay(userId, next);
			scheduleUserLimitSave(userId, next);

			return;
		}

		const premiumButton = event.target.closest('button[data-user-premium]');
		const bannedButton = event.target.closest('button[data-user-banned]');
		const blockedButton = event.target.closest('button[data-user-blocked]');

		const targetButton = premiumButton || bannedButton || blockedButton;

		if (!targetButton) {
			return;
		}

		const enabled = targetButton.getAttribute('data-enabled') === 'true';

		if (premiumButton && !enabled) {
			const approved = await confirmRiskAction({
				title: 'Remove Premium Role?',
				message: 'This user will lose premium privileges and fallback to FREE role.',
				confirmLabel: 'Remove Premium'
			});

			if (!approved) {
				return;
			}
		}

		if (bannedButton && enabled) {
			const approved = await confirmRiskAction({
				title: 'Ban User?',
				message: 'This user will be added to banned list and blocked from normal usage.',
				confirmLabel: 'Ban User'
			});

			if (!approved) {
				return;
			}
		}

		if (blockedButton && enabled) {
			const approved = await confirmRiskAction({
				title: 'Block User?',
				message: 'This will block the user via WhatsApp client block status.',
				confirmLabel: 'Block User'
			});

			if (!approved) {
				return;
			}
		}

		targetButton.disabled = true;

		try {
			if (premiumButton) {
				const payload = await setUserPremium(premiumButton.getAttribute('data-user-premium'), enabled);

				showUndoToast({
					message: enabled ? 'Premium enabled.' : 'Premium removed.',
					undo: payload?.undo || null,
					onAfterUndo: async () => {
						await fetchUsers();
					}
				});
			}

			if (bannedButton) {
				const payload = await setUserBanned(bannedButton.getAttribute('data-user-banned'), enabled);

				showUndoToast({
					message: enabled ? 'User banned.' : 'User unbanned.',
					undo: payload?.undo || null,
					onAfterUndo: async () => {
						await fetchUsers();
					}
				});
			}

			if (blockedButton) {
				const payload = await setUserBlocked(blockedButton.getAttribute('data-user-blocked'), enabled);

				showUndoToast({
					message: enabled ? 'User blocked.' : 'User unblocked.',
					undo: payload?.undo || null,
					onAfterUndo: async () => {
						await fetchUsers();
					}
				});
			}

			await fetchUsers();
		} catch (error) {
			console.error(error);
			showToast(error?.message || 'Failed updating user control.', 'error');
		} finally {
			targetButton.disabled = false;
		}
	});

	els.usersGroups.addEventListener('change', (event) => {
		if (!state.canEdit) {
			return;
		}

		const input = event.target.closest('input[data-user-select]');

		if (!input) {
			return;
		}

		const userId = input.getAttribute('data-user-select');

		if (!userId) {
			return;
		}

		if (input.checked) {
			state.selectedUserIds.add(userId);
		} else {
			state.selectedUserIds.delete(userId);
		}

		renderUsers();
	});

	els.usersBulkSelectVisible?.addEventListener('click', () => {
		if (!state.canEdit || state.bulkUsersBusy) {
			return;
		}

		const filteredUsers = getFilteredUsers();
		const visibleIds = filteredUsers.map((user) => user.id);
		const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => state.selectedUserIds.has(id));

		for (const id of visibleIds) {
			if (allVisibleSelected) {
				state.selectedUserIds.delete(id);
			} else {
				state.selectedUserIds.add(id);
			}
		}

		renderUsers();
	});

	els.usersBulkClear?.addEventListener('click', () => {
		if (!state.canEdit || state.bulkUsersBusy) {
			return;
		}

		state.selectedUserIds.clear();
		renderUsers();
	});

	els.usersBulkToolbar?.addEventListener('click', (event) => {
		const button = event.target.closest('button[data-bulk-user-action]');

		if (!button || !state.canEdit || state.bulkUsersBusy) {
			return;
		}

		const action = button.getAttribute('data-bulk-user-action') || '';
		const rawValue = Number.parseInt(String(els.usersBulkLimitValue?.value || '0'), 10);
		const value = Math.max(0, Number.isFinite(rawValue) ? rawValue : 0);
		const refreshAfterBulk = async () => {
			await fetchUsers();

			if (state.canEdit) {
				await fetchAudit();
			}
		};

		if (action === 'premium-on') {
			void runBulkUserAction({
				actionLabel: 'Bulk premium grant',
				operation: async (user) => setUserPremium(user.id, true),
				onComplete: refreshAfterBulk
			});
			return;
		}

		if (action === 'premium-off') {
			void runBulkUserAction({
				actionLabel: 'Bulk premium removal',
				confirmConfig: {
					title: 'Remove Premium For Selected Users?',
					message: 'Selected users will lose premium privileges and fallback to FREE role.',
					confirmLabel: 'Remove Premium'
				},
				operation: async (user) => setUserPremium(user.id, false),
				onComplete: refreshAfterBulk
			});
			return;
		}

		if (action === 'ban-on') {
			void runBulkUserAction({
				actionLabel: 'Bulk ban',
				confirmConfig: {
					title: 'Ban Selected Users?',
					message: 'Selected users will be added to banned list and blocked from normal usage.',
					confirmLabel: 'Ban Users'
				},
				operation: async (user) => setUserBanned(user.id, true),
				onComplete: refreshAfterBulk
			});
			return;
		}

		if (action === 'ban-off') {
			void runBulkUserAction({
				actionLabel: 'Bulk unban',
				operation: async (user) => setUserBanned(user.id, false),
				onComplete: refreshAfterBulk
			});
			return;
		}

		if (action === 'block-on') {
			void runBulkUserAction({
				actionLabel: 'Bulk block',
				confirmConfig: {
					title: 'Block Selected Users?',
					message: 'Selected users will be blocked via WhatsApp client block status.',
					confirmLabel: 'Block Users'
				},
				operation: async (user) => setUserBlocked(user.id, true),
				onComplete: refreshAfterBulk
			});
			return;
		}

		if (action === 'block-off') {
			void runBulkUserAction({
				actionLabel: 'Bulk unblock',
				operation: async (user) => setUserBlocked(user.id, false),
				onComplete: refreshAfterBulk
			});
			return;
		}

		if (action === 'limit-set') {
			void runBulkUserAction({
				actionLabel: 'Bulk limit set',
				operation: async (user) => setUserLimit(user.id, value),
				onComplete: refreshAfterBulk
			});
			return;
		}

		if (action === 'limit-add') {
			void runBulkUserAction({
				actionLabel: 'Bulk limit increase',
				operation: async (user) => {
					const next = Math.max(0, Number.parseInt(user.limit, 10) + value || 0);

					return setUserLimit(user.id, next);
				},
				onComplete: refreshAfterBulk
			});
			return;
		}

		if (action === 'limit-sub') {
			void runBulkUserAction({
				actionLabel: 'Bulk limit decrease',
				confirmConfig: {
					title: 'Decrease Limits For Selected Users?',
					message: 'Selected user limits will be reduced and clamped to zero.',
					confirmLabel: 'Decrease Limits'
				},
				operation: async (user) => {
					const next = Math.max(0, Number.parseInt(user.limit, 10) - value || 0);

					return setUserLimit(user.id, next);
				},
				onComplete: refreshAfterBulk
			});
		}
	});

	els.usersGroups.addEventListener('input', (event) => {
		if (!state.canEdit) {
			return;
		}

		const input = event.target.closest('input[data-user-limit]');

		if (!input) {
			return;
		}

		const userId = input.getAttribute('data-user-id');
		const next = Math.max(0, Number.parseInt(input.value || '0', 10) || 0);

		input.value = String(next);
		updateUserLimitDisplay(userId, next);
		scheduleUserLimitSave(userId, next);
	});
};
const init = async () => {
	loadCollapsedCategories();
	loadActiveFolder();
	loadDashboardSettings();
	loadThemePalettePreference();
	loadThemePreference();
	loadAuditActionCollapsed();
	loadAuditRoleCollapsed();
	applyAuditFiltersFromUrl();
	const zenCursorEnabled = setupZenCursor();

	setupAlertDebugHooks();

	if (!zenCursorEnabled) {
		setupFloatingTooltips();
	}

	bindEvents();
	startSpotifyProgressTicker();
	updateSeamlessAlbumsColorFilterUi();
	prefetchRoute('/albums');

	if (typeof window !== 'undefined' && window.location.pathname === EDITOR_ROUTE_PATH) {
		editorRouteIntent = true;
	}

	if (state.activeFolder === 'editor') {
		editorRouteIntent = true;
	}

	setActiveFolder(state.activeFolder);

	if (typeof window !== 'undefined' && window.location.pathname !== ALBUMS_ROUTE_PATH) {
		lastDashboardRouteHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;
	}

	if (typeof window !== 'undefined' && window.location.pathname === ALBUMS_ROUTE_PATH) {
		openSeamlessAlbumsPage({ updateHistory: false });
	}

	window.addEventListener('resize', renderStatusCharts);
	await runSafe(fetchSession);
	await runSafe(async () => {
		await Promise.all([
			fetchStatus(),
			fetchLogs(),
			fetchAudit(),
			fetchCommands(),
			fetchFlags(),
			fetchUsers(),
			fetchProfilePictures()
		]);
	});

	setupRealtime();
	startPollingLoops();
};

init();
