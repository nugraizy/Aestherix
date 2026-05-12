/**
 * Werewolf game — hard limits and default phase timers (in seconds).
 */

export const MIN_PLAYERS = 5;
export const MAX_PLAYERS = 20;

export const PHASE_TIMERS = {
	lobby: 0,
	deal: 10,
	night: 40,
	day: 20,
	voting: 30,
	hunterShoot: 20
};

export const AFK_LIMIT = 3;

export const MAX_WOLVES = 5;

const DEFAULT_LOBBY_TIMEOUT_MS = 5 * 60 * 1000;

const parsedLobbyOverride = Number.parseInt(process.env.WEREWOLF_LOBBY_TIMEOUT_MS ?? '', 10);

export const LOBBY_TIMEOUT_MS =
	Number.isFinite(parsedLobbyOverride) && parsedLobbyOverride > 0
		? parsedLobbyOverride
		: DEFAULT_LOBBY_TIMEOUT_MS;
