/**
 * Werewolf lobby-timer singleton.
 *
 * Mirrors the shape of `scheduler-singleton.js`. The handler initialises
 * this once on bot boot with real callbacks, every subcommand imports
 * `getLobbyTimer()` to start/stop timers, and tests call
 * `setLobbyTimer(fake)` to inject a controllable driver.
 */

import { makeLobbyTimer } from './lobby-timer.js';
import { repository } from '../state/repository.js';

let timer = null;

export const initLobbyTimer = ({ onAutoStart, onDisband, setTimeoutFn, clearTimeoutFn, logger } = {}) => {
	timer = makeLobbyTimer({
		repository,
		onAutoStart,
		onDisband,
		setTimeoutFn,
		clearTimeoutFn,
		logger
	});

	return timer;
};

export const getLobbyTimer = () => timer;

export const setLobbyTimer = (t) => {
	timer = t;
};

export const resetLobbyTimer = () => {
	timer = null;
};
