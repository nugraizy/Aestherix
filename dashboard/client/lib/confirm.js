import { writable } from 'svelte/store';

export const activeConfirm = writable(null);

export function showConfirm(options = {}) {
	const { title = 'Confirm', message = '', confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false } = options;

	return new Promise((resolve) => {
		const settle = (value) => {
			activeConfirm.set(null);
			resolve(Boolean(value));
		};

		activeConfirm.set({
			title,
			message,
			confirmLabel,
			cancelLabel,
			danger,
			input: false,
			resolve: settle
		});
	});
}

export function showPrompt(options = {}) {
	const {
		title = 'Input',
		message = '',
		confirmLabel = 'OK',
		cancelLabel = 'Cancel',
		placeholder = '',
		defaultValue = ''
	} = options;

	return new Promise((resolve) => {
		const settle = (value) => {
			activeConfirm.set(null);
			resolve(value);
		};

		activeConfirm.set({
			title,
			message,
			confirmLabel,
			cancelLabel,
			danger: false,
			input: true,
			placeholder,
			defaultValue,
			resolve: settle
		});
	});
}
