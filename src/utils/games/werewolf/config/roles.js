/**
 * Werewolf role descriptors.
 *
 * Each entry describes a single role:
 *   - team         which victory faction the role belongs to
 *   - priority     order in which village roles are filled while scaling up
 *   - minPlayers   the smallest N at which the role is introduced
 *   - maxCount     upper bound on copies of the role in a single game
 *   - required     if true, the role must always be present when minPlayers is met
 *
 * `count(N)` is only defined for roles whose copies scale with N
 * (Werewolf). Everything else is capped at 1.
 *
 * @typedef {import('../types.js').RoleDescriptor} RoleDescriptor
 */

import { MAX_WOLVES } from './constants.js';

const wolfCountFor = (N) => {
	if (N <= 5) {
		return 1;
	}

	if (N <= 7) {
		return 2;
	}

	if (N <= 11) {
		return 2;
	}

	if (N <= 15) {
		return 3;
	}

	if (N <= 18) {
		return 4;
	}

	return Math.min(MAX_WOLVES, 5);
};

export const ROLES = {
	villager: {
		id: 'villager',
		team: 'village',
		priority: 999,
		minPlayers: 5,
		maxCount: Infinity,
		required: true
	},
	werewolf: {
		id: 'werewolf',
		team: 'wolves',
		priority: 0,
		minPlayers: 5,
		maxCount: MAX_WOLVES,
		required: true,
		count: wolfCountFor
	},
	'alpha-werewolf': {
		id: 'alpha-werewolf',
		team: 'wolves',
		priority: 1,
		minPlayers: 9,
		maxCount: 1
	},
	seer: {
		id: 'seer',
		team: 'village',
		priority: 1,
		minPlayers: 5,
		maxCount: 1,
		required: true
	},
	guard: {
		id: 'guard',
		team: 'village',
		priority: 2,
		minPlayers: 6,
		maxCount: 1
	},
	hunter: {
		id: 'hunter',
		team: 'village',
		priority: 3,
		minPlayers: 7,
		maxCount: 1
	},
	witch: {
		id: 'witch',
		team: 'village',
		priority: 4,
		minPlayers: 8,
		maxCount: 1
	},
	cupid: {
		id: 'cupid',
		team: 'village',
		priority: 5,
		minPlayers: 8,
		maxCount: 1
	},
	'little-girl': {
		id: 'little-girl',
		team: 'village',
		priority: 6,
		minPlayers: 10,
		maxCount: 1
	},
	jester: {
		id: 'jester',
		team: 'solo',
		priority: 10,
		minPlayers: 11,
		maxCount: 1
	}
};

export const ROLE_IDS = Object.keys(ROLES);

export const getRole = (id) => ROLES[id] ?? null;

export const getWolfCount = wolfCountFor;
