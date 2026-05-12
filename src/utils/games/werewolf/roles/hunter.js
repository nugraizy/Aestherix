/**
 * Hunter — only action is `shoot` and it only fires during the
 * `hunterShoot` phase. Unlike other roles the Hunter may be dead (just
 * killed) at the time of the shot, so `ensureRole` does not reject on
 * isAlive === false. The validator instead checks that there is a pending
 * shot slot owned by this actor.
 */

import { getPlayer } from '../state/session.js';

export const id = 'hunter';

const findPendingShot = (session, actorId) =>
	session.pendingShots?.find((shot) => shot.actorId === actorId && shot.targetId === null);

export const validate = (action, session) => {
	if (action?.type !== 'shoot') {
		return { ok: false, reason: 'wrongAction' };
	}

	const actor = getPlayer(session, action.actorId);

	if (!actor) {
		return { ok: false, reason: 'notJoined' };
	}

	if (actor.role !== 'hunter') {
		return { ok: false, reason: 'wrongRole' };
	}

	const shot = findPendingShot(session, action.actorId);

	if (!shot) {
		return { ok: false, reason: 'wrongTime' };
	}

	const target = getPlayer(session, action.targetId);

	if (!target) {
		return { ok: false, reason: 'targetMissing' };
	}

	if (!target.isAlive) {
		return { ok: false, reason: 'targetDead' };
	}

	if (target.id === action.actorId) {
		return { ok: false, reason: 'cantActionSelf' };
	}

	return { ok: true };
};

export const execute = (action, session) => {
	const check = validate(action, session);

	if (!check.ok) {
		return check;
	}

	const shot = findPendingShot(session, action.actorId);

	shot.targetId = action.targetId;

	return { ok: true, feedbackKey: 'werewolf.success.shotFired' };
};
