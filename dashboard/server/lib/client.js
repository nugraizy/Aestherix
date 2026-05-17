import { manager } from '../../../src/core/manager.js';

export function getEmbeddedWaClient() {
	for (const [, client] of manager.clients) {
		if (client?.state === 'connected' && typeof client.send === 'function') {
			return client;
		}
	}

	return null;
}

export function isBotEmbeddedHere() {
	return manager.clients.size > 0;
}

export function isWaConnectedHere() {
	return Boolean(getEmbeddedWaClient());
}
