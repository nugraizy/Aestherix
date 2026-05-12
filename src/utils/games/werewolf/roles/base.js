/**
 * Shared helpers used by every role module.
 *
 * Each role exports { id, validate(action, session), execute(action, session) }.
 * `validate` checks role-specific rules on top of the generic `canTarget`
 * checks from `logic/actions.js`. `execute` is called by the command layer
 * AFTER validate succeeds — it queues or applies the action and records
 * any per-round flags (isAction, guardLastTargetId, witchState, etc.).
 *
 * @typedef {import('../types.js').Action} Action
 * @typedef {import('../types.js').Session} Session
 */

import { canTarget } from '../logic/actions.js';
import { queueAction } from '../logic/resolution.js';
import { getPlayer, markAction } from '../state/session.js';

/**
 * Returns `{ ok: true }` when the actor has the expected role and is alive.
 * Generic validation (alive/not yet acted/target alive/not self) is handled
 * by `canTarget`.
 */
export const ensureRole = (session, actorId, requiredRole) => {
	const actor = getPlayer(session, actorId);

	if (!actor) {
		return { ok: false, reason: 'notJoined' };
	}

	if (!actor.isAlive) {
		return { ok: false, reason: 'dead' };
	}

	if (requiredRole && actor.role !== requiredRole) {
		return { ok: false, reason: 'wrongRole' };
	}

	return { ok: true };
};

export const validateTargetedAction = (session, actorId, targetId, requiredRole, actionType) => {
	if (!actionType) {
		return { ok: false, reason: 'wrongAction' };
	}

	const roleCheck = ensureRole(session, actorId, requiredRole);

	if (!roleCheck.ok) {
		return roleCheck;
	}

	const reach = canTarget(session, actorId, targetId);

	return reach.ok ? { ok: true } : reach;
};

export const queueAndMarkAction = (session, action) => {
	queueAction(session, action);
	markAction(session, action.actorId);
};
