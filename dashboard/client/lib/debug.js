import { writable } from 'svelte/store';

export const debugState = writable({
	forcedHardwareLevel: 0,
	bypassDismiss: false
});

export function setForcedHardwareLevel(level) {
	const safe = Math.max(0, Math.min(3, Number(level) || 0));

	debugState.update((current) => ({ ...current, forcedHardwareLevel: safe }));
}

export function setBypassDismiss(value) {
	debugState.update((current) => ({ ...current, bypassDismiss: Boolean(value) }));
}

export function resetDebugState() {
	debugState.set({ forcedHardwareLevel: 0, bypassDismiss: false });
}
