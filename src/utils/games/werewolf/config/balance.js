/**
 * Werewolf composition algorithm — turns a player count N into a flat list
 * of role ids ready to shuffle and deal.
 *
 * Build order:
 *   1. Werewolves — `getWolfCount(N)` copies of 'werewolf'.
 *   2. Alpha — add one 'alpha-werewolf' when N >= 9.
 *   3. Village specials sorted by `priority` ascending, each included
 *      when `minPlayers <= N` up to `maxCount` copies.
 *   4. Jester (solo) when N >= 11.
 *   5. Fill the remainder with Villagers.
 *
 * Validation guarantees the composition is playable:
 *   - N is within [MIN_PLAYERS, MAX_PLAYERS].
 *   - The village team strictly outnumbers the wolves team on day 1 so
 *     the good side has a chance to win.
 *   - No role appears more times than its `maxCount`.
 */

import { MAX_PLAYERS, MIN_PLAYERS } from './constants.js';
import { ROLES, getWolfCount } from './roles.js';

/**
 * @param {string[]} roles
 * @throws {Error} when the composition is not playable
 */
export const validateComposition = (roles) => {
	if (!Array.isArray(roles)) {
		throw new TypeError('validateComposition: roles must be an array');
	}

	const N = roles.length;

	if (N < MIN_PLAYERS || N > MAX_PLAYERS) {
		throw new RangeError(`validateComposition: N=${N} outside [${MIN_PLAYERS},${MAX_PLAYERS}]`);
	}

	const counts = roles.reduce((acc, id) => {
		if (!ROLES[id]) {
			throw new Error(`validateComposition: unknown role "${id}"`);
		}

		acc[id] = (acc[id] ?? 0) + 1;
		return acc;
	}, {});

	for (const [id, count] of Object.entries(counts)) {
		if (count > ROLES[id].maxCount) {
			throw new RangeError(`validateComposition: role "${id}" exceeds maxCount (${count} > ${ROLES[id].maxCount})`);
		}
	}

	let village = 0;
	let wolves = 0;

	for (const id of roles) {
		const team = ROLES[id].team;

		if (team === 'village') {
			village += 1;
		} else if (team === 'wolves') {
			wolves += 1;
		}
	}

	if (village <= wolves) {
		throw new Error(`validateComposition: village=${village} must exceed wolves=${wolves}`);
	}
};

/**
 * @param {number} N
 * @returns {string[]} flat list of role ids, length === N
 */
export const buildComposition = (N) => {
	if (!Number.isInteger(N) || N < MIN_PLAYERS || N > MAX_PLAYERS) {
		throw new RangeError(`buildComposition: N=${N} is outside [${MIN_PLAYERS},${MAX_PLAYERS}]`);
	}

	const roles = [];

	const wolfCount = getWolfCount(N);

	for (let i = 0; i < wolfCount; i += 1) {
		roles.push('werewolf');
	}

	if (N >= ROLES['alpha-werewolf'].minPlayers) {
		roles.push('alpha-werewolf');
	}

	const villageSpecials = Object.values(ROLES)
		.filter((role) => role.team === 'village' && role.id !== 'villager')
		.sort((a, b) => a.priority - b.priority);

	for (const role of villageSpecials) {
		if (N < role.minPlayers) {
			continue;
		}

		const maxCopies = Math.min(role.maxCount, N - roles.length - 1);

		for (let i = 0; i < maxCopies; i += 1) {
			roles.push(role.id);
		}
	}

	if (N >= ROLES.jester.minPlayers && roles.length < N) {
		roles.push('jester');
	}

	while (roles.length < N) {
		roles.push('villager');
	}

	const result = roles.slice(0, N);

	validateComposition(result);

	return result;
};

/**
 * Summarise a composition as `{ roleId: count }`.
 *
 * @param {string[]} roles
 */
export const summariseComposition = (roles) => {
	return roles.reduce((acc, id) => {
		acc[id] = (acc[id] ?? 0) + 1;
		return acc;
	}, {});
};
