import { get, writable } from 'svelte/store';

const STORAGE_KEY = 'aestherix.dashboard.palette';
const MODE_KEY = 'aestherix.dashboard.mode';

const PALETTES = {
	aestherix: { bg: '#1a1a2e', panel: '#16213e', border: '#2a2a4a', accent: '#c4b5fd', text: '#e0e0e0', muted: '#888' },
	nord: { bg: '#2e3440', panel: '#3b4252', border: '#434c5e', accent: '#88c0d0', text: '#eceff4', muted: '#7b88a1' },
	gruvbox: { bg: '#282828', panel: '#3c3836', border: '#504945', accent: '#fabd2f', text: '#ebdbb2', muted: '#928374' },
	solarized: { bg: '#002b36', panel: '#073642', border: '#586e75', accent: '#268bd2', text: '#fdf6e3', muted: '#839496' },
	'tokyo-night': { bg: '#1a1b26', panel: '#24283b', border: '#414868', accent: '#7aa2f7', text: '#c0caf5', muted: '#565f89' },
	catppuccin: { bg: '#1e1e2e', panel: '#313244', border: '#45475a', accent: '#cba6f7', text: '#cdd6f4', muted: '#6c7086' },
	dracula: { bg: '#282a36', panel: '#44475a', border: '#6272a4', accent: '#bd93f9', text: '#f8f8f2', muted: '#6272a4' },
	cyberpunk: { bg: '#0a0a0f', panel: '#1a1a2e', border: '#2d2d44', accent: '#ff2a6d', text: '#05d9e8', muted: '#7b61ff' }
};

export const PALETTE_NAMES = Object.keys(PALETTES);

const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
const savedMode = typeof localStorage !== 'undefined' ? localStorage.getItem(MODE_KEY) : null;

export const currentPalette = writable(saved && PALETTES[saved] ? saved : 'aestherix');
export const themeMode = writable(savedMode === 'light' ? 'light' : 'dark');

let activeMode = savedMode === 'light' ? 'light' : 'dark';

export function setPalette(name) {
	if (!PALETTES[name]) {
		return;
	}

	currentPalette.set(name);
	localStorage.setItem(STORAGE_KEY, name);
	applyPalette(name);
}

export function applyPalette(name) {
	applyTheme(name, activeMode);
}

const CODE_COLORS = {
	dark: {
		'--code-keyword': '#c4b5fd',
		'--code-atom': '#f0c887',
		'--code-number': '#f0c887',
		'--code-string': '#87f0c1',
		'--code-escape': '#ff8e74',
		'--code-function': '#8ef0ff',
		'--code-property': '#c4b5fd',
		'--code-type': '#f0c887',
		'--code-tag': '#ff8e74',
		'--code-operator': '#8ef0ff',
		'--code-comment': '#6c7086'
	},
	light: {
		'--code-keyword': '#7c3aed',
		'--code-atom': '#b45309',
		'--code-number': '#b45309',
		'--code-string': '#15803d',
		'--code-escape': '#be123c',
		'--code-function': '#1d4ed8',
		'--code-property': '#6d28d9',
		'--code-type': '#b45309',
		'--code-tag': '#be123c',
		'--code-operator': '#1d4ed8',
		'--code-comment': '#64748b'
	}
};

export function applyTheme(name, mode = activeMode) {
	const p = PALETTES[name];

	if (!p) {
		return;
	}

	const root = document.documentElement;
	const bg = mode === 'light' ? '#ffffff' : p.panel;

	root.style.setProperty('--bg', p.bg);
	root.style.setProperty('--panel', p.panel);
	root.style.setProperty('--border', p.border);
	root.style.setProperty('--accent', p.accent);
	root.style.setProperty('--text', p.text);
	root.style.setProperty('--muted', p.muted);

	if (mode === 'light') {
		root.style.setProperty('--bg', '#f6f7fb');
		root.style.setProperty('--panel', '#ffffff');
		root.style.setProperty('--border', '#d8d9e2');
		root.style.setProperty('--text', '#1a1c21');
		root.style.setProperty('--muted', '#5e6372');
	}

	const themeColorMeta = document.querySelector('meta[name="theme-color"]');

	if (themeColorMeta) {
		themeColorMeta.setAttribute('content', bg);
	}

	const themeColorMetas = document.querySelectorAll('meta[name="theme-color"]');

	for (const meta of themeColorMetas) {
		meta.setAttribute('content', bg);
	}

	const palette = CODE_COLORS[mode] ?? CODE_COLORS.dark;

	for (const [key, value] of Object.entries(palette)) {
		root.style.setProperty(key, value);
	}

	root.dataset.mode = mode;
}

export function setMode(mode) {
	const next = mode === 'light' ? 'light' : 'dark';

	activeMode = next;
	themeMode.set(next);
	localStorage.setItem(MODE_KEY, next);
	applyTheme(get(currentPalette), next);
}

export function toggleMode() {
	setMode(activeMode === 'light' ? 'dark' : 'light');
}
