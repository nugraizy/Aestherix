/**
 * Werewolf lobby timer.
 *
 * One one-shot timer per active lobby (`roomId`). When the timer fires:
 *   - loads the session from the repository,
 *   - if the phase is still `lobby`:
 *       * calls `onAutoStart(session)` when `isLobbyReady` (≥ MIN_PLAYERS),
 *       * otherwise calls `onDisband(session)` to notify + delete.
 *   - if the phase already advanced past lobby, the timer is a no-op.
 *
 * Time primitives + callbacks are injected so the whole driver is
 * testable without real timers or Baileys.
 *
 * @typedef {import('../types.js').Session} Session
 */

import { isLobbyReady } from '../state/session.js';

const noopLogger = { warn: () => {}, error: () => {} };

/**
 * @param {{
 *   repository: { load: (id: string) => Promise<Session | null> },
 *   onAutoStart?: (session: Session) => unknown,
 *   onDisband?: (session: Session) => unknown,
 *   setTimeoutFn?: typeof setTimeout,
 *   clearTimeoutFn?: typeof clearTimeout,
 *   logger?: { warn: Function, error: Function }
 * }} deps
 */
export const makeLobbyTimer = ({
	repository,
	onAutoStart,
	onDisband,
	setTimeoutFn = setTimeout,
	clearTimeoutFn = clearTimeout,
	logger = noopLogger
}) => {
	if (!repository) {
		throw new TypeError('makeLobbyTimer: repository is required');
	}

	const timers = new Map();

	const fire = async (roomId) => {
		timers.delete(roomId);

		let session;

		try {
			session = await repository.load(roomId);
		} catch (error) {
			logger.error?.('werewolf.lobby-timer.load', { roomId, error });
			return;
		}

		if (!session || session.phase !== 'lobby') {
			return;
		}

		try {
			if (isLobbyReady(session)) {
				await onAutoStart?.(session);
			} else {
				await onDisband?.(session);
			}
		} catch (error) {
			logger.error?.('werewolf.lobby-timer.fire', { roomId, error });
		}
	};

	return {
		/**
		 * Schedule (or reschedule) the one-shot timer for a lobby.
		 * @param {string} roomId
		 * @param {number} delayMs
		 */
		start(roomId, delayMs) {
			const existing = timers.get(roomId);

			if (existing) {
				clearTimeoutFn(existing);
			}

			const handle = setTimeoutFn(
				() => {
					void fire(roomId);
				},
				Math.max(0, delayMs)
			);

			timers.set(roomId, handle);

			if (handle && typeof handle.unref === 'function') {
				handle.unref();
			}
		},

		/**
		 * Cancel the lobby timer (used when the master starts or deletes).
		 * @param {string} roomId
		 */
		stop(roomId) {
			const handle = timers.get(roomId);

			if (handle) {
				clearTimeoutFn(handle);
				timers.delete(roomId);
			}
		},

		/**
		 * Cancel every scheduled lobby timer. Used at shutdown.
		 */
		stopAll() {
			for (const handle of timers.values()) {
				clearTimeoutFn(handle);
			}

			timers.clear();
		},

		/**
		 * Trigger the fire callback immediately (cancels the pending timer).
		 * Exposed so tests can simulate a timeout without real clocks.
		 * @param {string} roomId
		 */
		fireNow(roomId) {
			const handle = timers.get(roomId);

			if (handle) {
				clearTimeoutFn(handle);
				timers.delete(roomId);
			}

			return fire(roomId);
		},

		has(roomId) {
			return timers.has(roomId);
		},

		_timers: timers
	};
};
