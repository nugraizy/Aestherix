/**
 * Werewolf night resolution — deterministic, pure.
 *
 * A session accumulates actions during the night phase via `queueAction`.
 * When the night ends, `resolveNight` processes the queue in a fixed order
 * so the outcome is independent of action-arrival timing:
 *
 *   1. Cupid (Night 1 only) — bind the two lovers.
 *   2. Guard                — mark target as protected.
 *   3. Witch (heal)         — remember the heal target for this night.
 *   4. Werewolves           — majority-vote kill; may be nullified by
 *                              protection or heal.
 *   5. Witch (poison)       — add an extra kill, cannot be healed.
 *   6. Seer                 — produce a role observation for the seer.
 *   7. Little Girl          — peek the wolf chat; rng can "catch" her.
 *   8. Alpha Wolf           — convert a villager into a wolf (once ever).
 *
 * Hunter's revenge shot is NOT resolved here — when a Hunter dies the shot
 * is queued on `session.pendingShots` and fired at the start of the next day.
 *
 * Lover-death cascade runs at the very end: if exactly one of the two lovers
 * died during resolution, the other dies from grief.
 *
 * @typedef {import('../types.js').Action} Action
 * @typedef {import('../types.js').NightResult} NightResult
 * @typedef {import('../types.js').Session} Session
 */

import { getPlayer, isWolfRole, markDead } from '../state/session.js';

const LITTLE_GIRL_CATCH_CHANCE = 0.25;

/**
 * Append an action to the night queue.  No validation — the caller is
 * expected to have run the appropriate `canTarget`/role validator first.
 *
 * @param {Session} session
 * @param {Action} action
 */
export const queueAction = (session, action) => {
	session.actionQueue.push(action);
	return session;
};

/**
 * @param {Session} session
 * @param {{ rng?: () => number }} [options]
 * @returns {NightResult}
 */
export const resolveNight = (session, { rng = Math.random } = {}) => {
	const queue = Array.isArray(session.actionQueue) ? session.actionQueue : [];

	const result = {
		killedIds: [],
		protectedIds: [],
		convertedIds: [],
		peekedIds: [],
		seerObservations: [],
		loverCascadeIds: []
	};

	const loversActions = queue.filter((a) => a.type === 'lovers');
	const guardActions = queue.filter((a) => a.type === 'guard');
	const healActions = queue.filter((a) => a.type === 'heal');
	const killActions = queue.filter((a) => a.type === 'kill');
	const poisonActions = queue.filter((a) => a.type === 'poison');
	const seerActions = queue.filter((a) => a.type === 'seer');
	const peekActions = queue.filter((a) => a.type === 'peek');
	const convertActions = queue.filter((a) => a.type === 'convert');

	if (session.firstNight) {
		for (const action of loversActions) {
			if (Array.isArray(action.targetIds) && action.targetIds.length === 2) {
				const [a, b] = action.targetIds;
				const playerA = getPlayer(session, a);
				const playerB = getPlayer(session, b);

				if (playerA && playerB && playerA.id !== playerB.id) {
					session.loverIds = [a, b];
					playerA.loverId = b;
					playerB.loverId = a;
				}
			}
		}
	}

	const protectedIds = new Set();

	for (const action of guardActions) {
		const target = getPlayer(session, action.targetId);

		if (target && target.isAlive) {
			target.isProtected = true;
			protectedIds.add(target.id);
		}
	}

	result.protectedIds = Array.from(protectedIds);

	const healedIds = new Set();

	for (const action of healActions) {
		const target = getPlayer(session, action.targetId);

		if (target && target.isAlive && !session.witchState.healUsed) {
			healedIds.add(target.id);
			session.witchState.healUsed = true;
		}
	}

	const killTally = new Map();

	for (const action of killActions) {
		killTally.set(action.targetId, (killTally.get(action.targetId) ?? 0) + 1);
	}

	let wolfKillTarget = null;

	if (killTally.size > 0) {
		let bestCount = 0;

		for (const [id, count] of killTally) {
			if (count > bestCount) {
				bestCount = count;
				wolfKillTarget = id;
			}
		}
	}

	const pendingKills = new Set();

	if (wolfKillTarget) {
		const target = getPlayer(session, wolfKillTarget);

		if (target && target.isAlive && !protectedIds.has(target.id) && !healedIds.has(target.id)) {
			pendingKills.add(target.id);
		}
	}

	for (const action of poisonActions) {
		if (session.witchState.poisonUsed) {
			continue;
		}

		const target = getPlayer(session, action.targetId);

		if (target && target.isAlive) {
			pendingKills.add(target.id);
			session.witchState.poisonUsed = true;
		}
	}

	for (const id of pendingKills) {
		markDead(session, id);

		const player = getPlayer(session, id);

		if (player) {
			session.playersKilled.push(player);

			if (player.role === 'hunter') {
				session.pendingShots.push({ actorId: player.id, targetId: null });
			}
		}

		result.killedIds.push(id);
	}

	for (const action of seerActions) {
		const target = getPlayer(session, action.targetId);

		if (target) {
			result.seerObservations.push({ seerId: action.actorId, targetId: target.id, role: target.role });
		}
	}

	for (const action of peekActions) {
		const caught = rng() < LITTLE_GIRL_CATCH_CHANCE;
		const actor = getPlayer(session, action.actorId);

		result.peekedIds.push(action.actorId);

		if (caught && actor && actor.isAlive) {
			markDead(session, actor.id);
			session.playersKilled.push(actor);
			result.killedIds.push(actor.id);
		}
	}

	for (const action of convertActions) {
		if (session.alphaConverted) {
			continue;
		}

		const actor = getPlayer(session, action.actorId);

		if (!actor || actor.role !== 'alpha-werewolf' || !actor.isAlive) {
			continue;
		}

		const target = getPlayer(session, action.targetId);

		if (!target || !target.isAlive || isWolfRole(target.role)) {
			continue;
		}

		target.role = 'werewolf';
		session.alphaConverted = true;
		result.convertedIds.push(target.id);
	}

	if (session.loverIds.length === 2) {
		const [a, b] = session.loverIds;
		const playerA = getPlayer(session, a);
		const playerB = getPlayer(session, b);

		if (playerA && playerB) {
			if (!playerA.isAlive && playerB.isAlive) {
				markDead(session, b);
				result.loverCascadeIds.push(b);
				result.killedIds.push(b);
			} else if (!playerB.isAlive && playerA.isAlive) {
				markDead(session, a);
				result.loverCascadeIds.push(a);
				result.killedIds.push(a);
			}
		}
	}

	session.actionQueue = [];

	return result;
};
