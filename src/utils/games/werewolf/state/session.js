/**
 * Werewolf game — pure session data model and mutations.
 *
 * Everything here is synchronous, side-effect free, and has no external
 * dependencies beyond the config layer.  All mutators operate in place on
 * the supplied `session` and return it so calls can be chained.
 *
 * @typedef {import('../types.js').Session} Session
 * @typedef {import('../types.js').Player} Player
 * @typedef {import('../types.js').PhaseName} PhaseName
 */

import { MAX_PLAYERS, MIN_PLAYERS } from '../config/constants.js';
import { ROLES } from '../config/roles.js';

const defaultRng = () => Math.random();

const shuffleInPlace = (array, rng) => {
	for (let i = array.length - 1; i > 0; i -= 1) {
		const j = Math.floor(rng() * (i + 1));
		const tmp = array[i];

		array[i] = array[j];
		array[j] = tmp;
	}

	return array;
};

/**
 * @param {Session} session
 * @param {{ id: string, name: string }} player
 * @returns {{ ok: boolean, reason?: 'already-joined' | 'full' | 'started' }}
 */
export const addPlayer = (session, { id, name }) => {
	if (session.phase !== 'lobby') {
		return { ok: false, reason: 'started' };
	}

	if (session.playersData.some((p) => p.id === id)) {
		return { ok: false, reason: 'already-joined' };
	}

	if (session.playersData.length >= MAX_PLAYERS) {
		return { ok: false, reason: 'full' };
	}

	session.playersData.push({
		id,
		index: session.playersData.length,
		name: name ?? '',
		role: '',
		dialogue: '',
		isProtected: false,
		isAlive: true,
		isAction: false,
		isVoted: false
	});

	return { ok: true };
};

/**
 * @param {{ roomId: string, roomMaster: string, roomMasterName: string, locale?: string, now?: () => number }} args
 * @returns {Session}
 */
export const createSession = ({ roomId, roomMaster, roomMasterName, locale = 'id', now = () => Date.now() }) => {
	if (!roomId) {
		throw new TypeError('createSession: roomId is required');
	}

	if (!roomMaster) {
		throw new TypeError('createSession: roomMaster is required');
	}

	const timestamp = now();

	const session = {
		roomId,
		roomMaster,
		roomMasterName: roomMasterName ?? '',
		locale,
		phase: 'lobby',
		gameTime: 0,
		gameTimeStarted: null,
		timeSpent: 0,
		gameAfk: 0,
		firstNight: true,
		playersData: [],
		playersDead: [],
		playersKilled: [],
		playerVoted: [],
		guardLastTargetId: null,
		witchState: { healUsed: false, poisonUsed: false },
		alphaConverted: false,
		loverIds: [],
		jesterLynched: false,
		pendingShots: [],
		actionQueue: [],
		gameDialogue: '',
		createdAt: timestamp,
		updatedAt: timestamp
	};

	addPlayer(session, { id: roomMaster, name: roomMasterName ?? '' });

	return session;
};

/**
 * @param {Session} session
 * @param {string} id
 * @returns {{ ok: boolean, reason?: 'not-joined' | 'started' }}
 */
export const removePlayer = (session, id) => {
	if (session.phase !== 'lobby') {
		return { ok: false, reason: 'started' };
	}

	const index = session.playersData.findIndex((p) => p.id === id);

	if (index === -1) {
		return { ok: false, reason: 'not-joined' };
	}

	session.playersData.splice(index, 1);
	session.playersData.forEach((p, i) => (p.index = i));

	return { ok: true };
};

/**
 * Shuffle `composition` and assign one role to each player in index order.
 * Populates `witchState` lifetime flags and resets first-night state.
 *
 * @param {Session} session
 * @param {string[]} composition — must have length === session.playersData.length
 * @param {() => number} [rng]
 * @returns {Session}
 */
export const dealRoles = (session, composition, rng = defaultRng) => {
	if (!Array.isArray(composition) || composition.length !== session.playersData.length) {
		throw new Error('dealRoles: composition length must equal player count');
	}

	for (const id of composition) {
		if (!ROLES[id]) {
			throw new Error(`dealRoles: unknown role "${id}"`);
		}
	}

	const shuffled = shuffleInPlace([...composition], rng);

	session.playersData.forEach((player, i) => {
		player.role = shuffled[i];
	});

	session.witchState = { healUsed: false, poisonUsed: false };
	session.alphaConverted = false;
	session.loverIds = [];
	session.jesterLynched = false;
	session.firstNight = true;
	session.pendingShots = [];
	session.actionQueue = [];
	session.playersDead = [];
	session.playersKilled = [];
	session.playerVoted = [];
	session.guardLastTargetId = null;

	return session;
};

/**
 * @param {Session} session
 * @param {PhaseName} phase
 */
export const setPhase = (session, phase) => {
	session.phase = phase;
	session.updatedAt = Date.now();
	return session;
};

/**
 * Clear all per-round boolean flags (action taken, voted, guard protection).
 * Guard "last target" is kept so the no-repeat rule survives the reset.
 *
 * @param {Session} session
 */
export const resetPerks = (session) => {
	session.playersData.forEach((player) => {
		player.isProtected = false;
		player.isAction = false;
		player.isVoted = false;
	});

	session.playerVoted = [];
	session.actionQueue = [];
	session.playersKilled = [];

	return session;
};

/**
 * @param {Session} session
 * @param {string} id
 * @returns {Player | undefined}
 */
export const getPlayer = (session, id) => session.playersData.find((p) => p.id === id);

/**
 * @param {Session} session
 * @returns {Player[]}
 */
export const getAlivePlayers = (session) => session.playersData.filter((p) => p.isAlive);

/**
 * @param {Session} session
 * @param {string} id
 */
export const markDead = (session, id) => {
	const player = getPlayer(session, id);

	if (!player || !player.isAlive) {
		return session;
	}

	player.isAlive = false;

	if (!session.playersDead.find((p) => p.id === id)) {
		session.playersDead.push(player);
	}

	return session;
};

/**
 * @param {Session} session
 * @param {string} id
 */
export const markProtected = (session, id) => {
	const player = getPlayer(session, id);

	if (player) {
		player.isProtected = true;
	}

	return session;
};

/**
 * @param {Session} session
 * @param {string} id
 */
export const markAction = (session, id) => {
	const player = getPlayer(session, id);

	if (player) {
		player.isAction = true;
	}

	return session;
};

/**
 * @param {Session} session
 * @param {string} id
 */
export const markVoted = (session, id) => {
	const player = getPlayer(session, id);

	if (player) {
		player.isVoted = true;
	}

	return session;
};

/**
 * @param {Session} session
 * @returns {boolean} true when lobby size is within the playable range
 */
export const isLobbyReady = (session) => {
	const N = session.playersData.length;

	return N >= MIN_PLAYERS && N <= MAX_PLAYERS;
};

/**
 * Normalise role to wolves team membership for win/team checks. Alpha counts
 * as a wolf.
 *
 * @param {string} role
 */
export const isWolfRole = (role) => role === 'werewolf' || role === 'alpha-werewolf';
