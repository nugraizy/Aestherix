/**
 * Werewolf scheduler singleton.
 *
 * The handler initialises this once on bot boot with a real emitter; every
 * command then imports `getScheduler()` to start/tick/stop timers. Tests
 * can call `setScheduler(fake)` to inject a controllable driver without
 * touching Baileys.
 */

import { makeScheduler } from './scheduler.js';
import { repository } from '../state/repository.js';

let scheduler = null;

export const initScheduler = ({ emit, rng, setTimeoutFn, clearTimeoutFn, logger } = {}) => {
	scheduler = makeScheduler({
		repository,
		emit,
		rng,
		setTimeoutFn,
		clearTimeoutFn,
		logger
	});

	return scheduler;
};

export const getScheduler = () => scheduler;

export const setScheduler = (s) => {
	scheduler = s;
};

export const resetScheduler = () => {
	scheduler = null;
};
