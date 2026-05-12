/**
 * Werewolf — generic action validators.
 *
 * These helpers answer "can this actor target that player right now?" without
 * mutating session state.  Role-specific rules (e.g. Guard no-repeat target,
 * Witch lifetime potions) live in their role modules and call into these
 * generic checks first.
 *
 * Every validator returns `{ ok: boolean, reason?: string }`. The `reason`
 * token maps 1:1 to an i18n key under `werewolf.errors.<reason>` so the
 * handler can translate without cross-referencing the logic layer.
 *
 * @typedef {import('../types.js').Session} Session
 * @typedef {import('../types.js').Action} Action
 */

import { getAlivePlayers, getPlayer, isWolfRole } from '../state/session.js';

/**
 * @param {Session} session
 */
export const isLobby = (session) => session.phase === 'lobby';

/**
 * @param {Session} session
 */
export const isNight = (session) => session.phase === 'night' || session.phase === 'deal';

/**
 * @param {Session} session
 */
export const isDay = (session) => session.phase === 'day';

/**
 * @param {Session} session
 */
export const isVoting = (session) => session.phase === 'voting';

/**
 * @param {Session} session
 * @param {string} actorId
 */
export const isRoomMaster = (session, actorId) => session.roomMaster === actorId;

/**
 * @param {Session} session
 * @param {string} actorId
 * @param {string} [requiredRole]
 * @returns {{ ok: boolean, reason?: string }}
 */
export const canAct = (session, actorId, requiredRole) => {
	const actor = getPlayer(session, actorId);

	if (!actor) {
		return { ok: false, reason: 'notJoined' };
	}

	if (!actor.isAlive) {
		return { ok: false, reason: 'dead' };
	}

	if (actor.isAction) {
		return { ok: false, reason: 'alreadyAction' };
	}

	if (requiredRole && actor.role !== requiredRole) {
		return { ok: false, reason: 'wrongRole' };
	}

	return { ok: true };
};

/**
 * Generic "can this actor target that victim at night?" check.
 *
 * Rules:
 *   - night phase only
 *   - actor must be alive and not yet have acted this round
 *   - target must exist and be alive
 *   - self-targeting is forbidden
 *   - werewolves cannot target fellow werewolves
 *
 * @param {Session} session
 * @param {string} actorId
 * @param {string} targetId
 * @returns {{ ok: boolean, reason?: string }}
 */
export const canTarget = (session, actorId, targetId) => {
	if (!isNight(session)) {
		return { ok: false, reason: 'wrongTime' };
	}

	const basic = canAct(session, actorId);

	if (!basic.ok) {
		return basic;
	}

	const target = getPlayer(session, targetId);

	if (!target) {
		return { ok: false, reason: 'targetMissing' };
	}

	if (!target.isAlive) {
		return { ok: false, reason: 'targetDead' };
	}

	if (actorId === targetId) {
		return { ok: false, reason: 'cantActionSelf' };
	}

	const actor = getPlayer(session, actorId);

	if (isWolfRole(actor.role) && isWolfRole(target.role)) {
		return { ok: false, reason: 'wrongKill' };
	}

	return { ok: true };
};

/**
 * @param {Session} session
 * @param {string} voterId
 * @param {string} targetId
 * @returns {{ ok: boolean, reason?: string }}
 */
export const canVote = (session, voterId, targetId) => {
	if (!isVoting(session)) {
		return { ok: false, reason: 'wrongTime' };
	}

	const voter = getPlayer(session, voterId);

	if (!voter) {
		return { ok: false, reason: 'notJoined' };
	}

	if (!voter.isAlive) {
		return { ok: false, reason: 'dead' };
	}

	if (voter.isVoted) {
		return { ok: false, reason: 'alreadyVoted' };
	}

	const target = getPlayer(session, targetId);

	if (!target) {
		return { ok: false, reason: 'targetMissing' };
	}

	if (!target.isAlive) {
		return { ok: false, reason: 'targetDead' };
	}

	return { ok: true };
};

/**
 * Resolve a 1-based target index (as typed by the user) to a jid using the
 * currently alive roster in deterministic order.
 *
 * @param {Session} session
 * @param {number} index 1-based
 */
export const resolveAliveIndex = (session, index) => {
	if (!Number.isInteger(index) || index < 1) {
		return null;
	}

	const alive = getAlivePlayers(session);

	return alive[index - 1]?.id ?? null;
};
