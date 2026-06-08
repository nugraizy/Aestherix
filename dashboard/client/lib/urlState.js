export function readQuery(key) {
	if (typeof window === 'undefined') {
		return '';
	}

	return new URLSearchParams(window.location.search).get(key) || '';
}

export function readQueryState(prefix, keys) {
	if (typeof window === 'undefined') {
		return {};
	}

	const p = new URLSearchParams(window.location.search);
	const out = {};

	for (const k of keys) {
		out[k] = p.get(`${prefix}${k}`) || '';
	}

	return out;
}

export function writeQueryState(prefix, state) {
	if (typeof window === 'undefined') {
		return;
	}

	const url = new URL(window.location.href);

	for (const [k, v] of Object.entries(state)) {
		if (v) {
			url.searchParams.set(`${prefix}${k}`, v);
		} else {
			url.searchParams.delete(`${prefix}${k}`);
		}
	}

	const next = `${url.pathname}${url.search}${url.hash}`;
	const cur = `${window.location.pathname}${window.location.search}${window.location.hash}`;

	if (next !== cur) {
		history.replaceState(history.state, '', next);
	}
}

export function stripQuery(prefix) {
	if (typeof window === 'undefined') {
		return;
	}

	const url = new URL(window.location.href);
	let changed = false;

	for (const key of [...url.searchParams.keys()]) {
		if (key.startsWith(prefix)) {
			url.searchParams.delete(key);
			changed = true;
		}
	}

	if (changed) {
		history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
	}
}

export function loadLocal(key) {
	try {
		return JSON.parse(localStorage.getItem(key) || '{}');
	} catch {
		return {};
	}
}

export function saveLocal(key, state) {
	try {
		localStorage.setItem(key, JSON.stringify(state));
	} catch {
		// ignore storage failures
	}
}

function coerceValue(raw, type) {
	if (raw === null || raw === undefined || raw === '') {
		return undefined;
	}

	if (type === 'number') {
		const n = Number(raw);

		return Number.isFinite(n) ? n : undefined;
	}

	if (type === 'boolean') {
		return raw === 'true' || raw === '1';
	}

	return String(raw);
}

export function createQueryState(prefix, schema) {
	if (typeof window === 'undefined') {
		return {
			read() {
				const out = {};

				for (const [k, cfg] of Object.entries(schema)) {
					out[k] = cfg.default ?? '';
				}

				return out;
			},
			write() {},
			strip() {},
			subscribe() {
				return () => {};
			}
		};
	}

	let _listeners = [];
	let _popHandler = null;

	function read() {
		const p = new URLSearchParams(window.location.search);
		const out = {};

		for (const [k, cfg] of Object.entries(schema)) {
			const raw = p.get(`${prefix}${k}`);
			const coerced = coerceValue(raw, cfg.type);

			if (coerced !== undefined) {
				out[k] = cfg.validate ? cfg.validate(coerced) : coerced;
			} else {
				out[k] = cfg.default ?? '';
			}
		}

		return out;
	}

	function notify() {
		const state = read();

		for (const fn of _listeners) {
			fn(state);
		}
	}

	function write(partial) {
		const url = new URL(window.location.href);
		let changed = false;

		for (const [k, v] of Object.entries(partial)) {
			if (!(k in schema)) {
				continue;
			}

			const key = `${prefix}${k}`;
			const str = v !== undefined && v !== null && v !== '' ? String(v) : '';

			if (str) {
				const cur = url.searchParams.get(key) || '';

				if (cur !== str) {
					url.searchParams.set(key, str);
					changed = true;
				}
			} else if (url.searchParams.has(key)) {
				url.searchParams.delete(key);
				changed = true;
			}
		}

		if (changed) {
			const next = `${url.pathname}${url.search}${url.hash}`;
			const cur = `${window.location.pathname}${window.location.search}${window.location.hash}`;

			if (next !== cur) {
				history.replaceState(history.state, '', next);
				notify();
			}
		}
	}

	function strip() {
		const url = new URL(window.location.href);
		let changed = false;

		for (const key of [...url.searchParams.keys()]) {
			if (key.startsWith(prefix)) {
				url.searchParams.delete(key);
				changed = true;
			}
		}

		if (changed) {
			history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
			notify();
		}
	}

	function subscribe(fn) {
		_listeners.push(fn);

		if (!_popHandler) {
			_popHandler = () => notify();
			window.addEventListener('popstate', _popHandler);
		}

		return () => {
			_listeners = _listeners.filter((l) => l !== fn);

			if (!_listeners.length && _popHandler) {
				window.removeEventListener('popstate', _popHandler);
				_popHandler = null;
			}
		};
	}

	return { read, write, strip, subscribe };
}
