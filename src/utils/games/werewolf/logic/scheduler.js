/**
 * Werewolf scheduler — the only place the module uses setTimeout.
 *
 * One timer per active `roomId`. Each tick:
 *   1. Load the session from the repository.
 *   2. Call `advancePhase(session)`.
 *   3. Persist the mutated session.
 *   4. Emit each event the phase produced.
 *   5. If the game has not ended, schedule the next tick.
 *
 * The scheduler takes all time + emit primitives through constructor
 * injection so the tests can run the whole driver without real timers or
 * Baileys.
 *
 * @typedef {import('../types.js').Session} Session
 */

import { advancePhase } from './phases.js';

const noopLogger = { warn: () => {}, error: () => {} };

/**
 * @param {{
 *   repository: {
 *     load: (id: string) => Promise<Session | null>,
 *     save: (s: Session) => unknown,
 *     delete: (id: string) => Promise<unknown>,
 *     flush?: (id: string) => Promise<unknown>
 *   },
 *   emit: (name: string, payload: object) => void,
 *   rng?: () => number,
 *   setTimeoutFn?: typeof setTimeout,
 *   clearTimeoutFn?: typeof clearTimeout,
 *   logger?: { warn: Function, error: Function }
 * }} deps
 */
export const makeScheduler = ({
	repository,
	emit,
	rng = Math.random,
	setTimeoutFn = setTimeout,
	clearTimeoutFn = clearTimeout,
	logger = noopLogger
}) => {
	if (!repository || typeof emit !== 'function') {
		throw new TypeError('makeScheduler: repository and emit are required');
	}

	const timers = new Map();

	async function tick(roomId) {
		let session;

		try {
			session = await repository.load(roomId);
		} catch (error) {
			logger.error?.('werewolf.scheduler.load', { roomId, error });
			return;
		}

		if (!session || session.phase === 'ended') {
			timers.delete(roomId);
			return;
		}

		const { events, nextTimerSec } = advancePhase(session, { rng });

		try {
			await repository.save(session);
		} catch (error) {
			logger.error?.('werewolf.scheduler.save', { roomId, error });
		}

		for (const event of events) {
			try {
				emit(event.name, event.payload);
			} catch (error) {
				logger.error?.('werewolf.scheduler.emit', { roomId, event: event.name, error });
			}
		}

		if (session.phase === 'ended') {
			timers.delete(roomId);
			await repository.delete(roomId).catch(() => {});
			return;
		}

		// eslint-disable-next-line no-use-before-define
		scheduleTick(roomId, nextTimerSec * 1000);
	}

	function scheduleTick(roomId, delayMs) {
		const existing = timers.get(roomId);

		if (existing) {
			clearTimeoutFn(existing);
		}

		const handle = setTimeoutFn(() => {
			timers.delete(roomId);
			void tick(roomId);
		}, Math.max(0, delayMs));

		timers.set(roomId, handle);

		if (handle && typeof handle.unref === 'function') {
			handle.unref();
		}
	}

	return {
		/**
		 * Kick off (or re-enter) the loop for a room. Safe to call multiple
		 * times; duplicate timers are cleared.
		 * @param {string} roomId
		 * @param {number} [delaySec] explicit first-tick delay in seconds
		 */
		start(roomId, delaySec = 0) {
			scheduleTick(roomId, delaySec * 1000);
		},

		/**
		 * Cancel the room's timer without touching the session state.
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
		 * Cancel every scheduled tick. Used at shutdown.
		 */
		stopAll() {
			for (const handle of timers.values()) {
				clearTimeoutFn(handle);
			}

			timers.clear();
		},

		/**
		 * Force a tick immediately without waiting for its timer. Returns the
		 * in-flight promise so callers can await completion.
		 * @param {string} roomId
		 */
		tickNow(roomId) {
			const handle = timers.get(roomId);

			if (handle) {
				clearTimeoutFn(handle);
				timers.delete(roomId);
			}

			return tick(roomId);
		},

		_timers: timers
	};
};
