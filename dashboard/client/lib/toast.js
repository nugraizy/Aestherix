import { writable } from 'svelte/store';

let nextId = 1;

export const toasts = writable([]);

const DEFAULT_DURATION = 2400;

export function dismissToast(id) {
	toasts.update((list) => list.filter((toast) => toast.id !== id));
}

export function showToast(message, type = 'info', options = {}) {
	if (!message) {
		return null;
	}

	const id = nextId++;
	const duration = Math.max(1200, Number(options.duration ?? DEFAULT_DURATION));
	const actionExpiresAt = Number(options.actionExpiresAt || 0);
	const toast = {
		id,
		message: String(message),
		type,
		actionLabel: options.actionLabel || '',
		onAction: typeof options.onAction === 'function' ? options.onAction : null,
		actionExpiresAt,
		duration
	};

	toasts.update((list) => [...list, toast]);

	if (duration > 0) {
		setTimeout(() => dismissToast(id), duration);
	}

	return id;
}

export function showSuccess(message, options) {
	return showToast(message, 'success', options);
}

export function showError(message, options) {
	return showToast(message, 'danger', options);
}

export function showWarning(message, options) {
	return showToast(message, 'warning', options);
}

async function performUndo(token) {
	const response = await fetch('/api/dashboard/actions/undo', {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ token })
	});

	if (!response.ok) {
		throw new Error(`${response.status} ${response.statusText}`);
	}

	return response.json();
}

function undoToastType(risk) {
	if (risk === 'high') {
		return 'danger';
	}

	if (risk === 'medium') {
		return 'warning';
	}

	return 'success';
}

export function showUndoToast({ message, undo, onAfterUndo }) {
	if (!undo?.token) {
		return showSuccess(message);
	}

	const ttlMs = Math.max(3500, Number(undo.ttlMs || 12000));

	return showToast(message, undoToastType(undo.risk), {
		duration: ttlMs,
		actionLabel: undo.actionLabel || 'Undo',
		actionExpiresAt: Number(undo.expiresAt || 0),
		onAction: async () => {
			await performUndo(undo.token);
			showSuccess('Last action reverted.');

			if (typeof onAfterUndo === 'function') {
				await onAfterUndo();
			}
		}
	});
}
