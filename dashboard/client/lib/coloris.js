const PALETTE = [
	'#1a1a2e',
	'#16213e',
	'#c4b5fd',
	'#87f0c1',
	'#f0c887',
	'#ff8e74',
	'#8ef0ff',
	'#ff79c6',
	'#7aa2f7',
	'#bd93f9'
];

const OPTIONS = {
	theme: 'pill',
	themeMode: 'dark',
	alpha: false,
	format: 'hex',
	swatches: PALETTE,
	swatchesOnly: false,
	focusInput: true,
	selectInput: true,
	closeButton: true,
	clearButton: true,
	closeLabel: 'Apply',
	clearLabel: 'Clear'
};

let readyPromise = null;

function waitForGlobal() {
	if (typeof window === 'undefined') {
		return Promise.reject(new Error('coloris: not in browser'));
	}

	if (typeof window.Coloris === 'function') {
		return Promise.resolve(window.Coloris);
	}

	return new Promise((resolve, reject) => {
		const start = Date.now();
		const interval = setInterval(() => {
			if (typeof window.Coloris === 'function') {
				clearInterval(interval);
				resolve(window.Coloris);
				return;
			}

			if (Date.now() - start > 5000) {
				clearInterval(interval);
				reject(new Error('coloris: script did not load within 5s'));
			}
		}, 50);
	});
}

function waitForDomReady() {
	if (typeof document === 'undefined') {
		return Promise.resolve();
	}

	if (document.readyState !== 'loading') {
		return Promise.resolve();
	}

	return new Promise((resolve) => {
		document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
	});
}

async function ready() {
	if (!readyPromise) {
		readyPromise = (async () => {
			await waitForDomReady();
			return waitForGlobal();
		})();
	}

	return readyPromise;
}

export async function bindColoris(target) {
	const Coloris = await ready();
	const el = target || '.coloris-input';

	if (typeof el !== 'string') {
		return;
	}

	if (!document.querySelector(el)) {
		return;
	}

	try {
		Coloris({ ...OPTIONS, el });
	} catch (error) {
		console.error('coloris init failed:', error);
	}
}

export async function setColorisPalette(palette = PALETTE) {
	const Coloris = await ready();

	Coloris({ swatches: palette });
}
