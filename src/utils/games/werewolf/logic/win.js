/**
 * Werewolf win-condition evaluation — pure.
 *
 * Priority (first match wins):
 *   1. Jester was lynched                            → 'jester'
 *   2. Two lovers survive and they are the only ones → 'lovers'
 *   3. Wolves ≥ non-wolves among the alive           → 'werewolf'
 *   4. No wolves are alive                           → 'village'
 *   5. Otherwise the game continues                   → null
 *
 * @typedef {import('../types.js').Session} Session
 */

import { getAlivePlayers, isWolfRole } from '../state/session.js';

/**
 * @param {Session} session
 * @returns {'jester' | 'lovers' | 'werewolf' | 'village' | null}
 */
export const evaluateWin = (session) => {
	if (session.jesterLynched) {
		return 'jester';
	}

	const alive = getAlivePlayers(session);
	const aliveIds = new Set(alive.map((p) => p.id));

	if (Array.isArray(session.loverIds) && session.loverIds.length === 2) {
		const [a, b] = session.loverIds;
		const bothAlive = aliveIds.has(a) && aliveIds.has(b);

		if (bothAlive && alive.length === 2) {
			return 'lovers';
		}
	}

	let wolves = 0;
	let others = 0;

	for (const player of alive) {
		if (isWolfRole(player.role)) {
			wolves += 1;
		} else {
			others += 1;
		}
	}

	if (wolves === 0 && others > 0) {
		return 'village';
	}

	if (wolves > 0 && wolves >= others) {
		return 'werewolf';
	}

	return null;
};
