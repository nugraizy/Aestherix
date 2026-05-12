import { canTarget, isNight } from '../logic/actions.js';
import { queueAction } from '../logic/resolution.js';
import { getPlayer, markAction } from '../state/session.js';
import { ensureRole } from './base.js';

export const id = 'cupid';

export const validate = (action, session) => {
	if (action?.type !== 'lovers') {
		return { ok: false, reason: 'wrongAction' };
	}

	if (!session.firstNight) {
		return { ok: false, reason: 'cupidFirstNightOnly' };
	}

	if (!isNight(session)) {
		return { ok: false, reason: 'wrongTime' };
	}

	const roleOk = ensureRole(session, action.actorId, 'cupid');

	if (!roleOk.ok) {
		return roleOk;
	}

	if (!Array.isArray(action.targetIds) || action.targetIds.length !== 2) {
		return { ok: false, reason: 'wrongAction' };
	}

	const [a, b] = action.targetIds;

	if (a === b) {
		return { ok: false, reason: 'wrongAction' };
	}

	const ra = canTarget(session, action.actorId, a);

	if (!ra.ok) {
		return ra;
	}

	const playerB = getPlayer(session, b);

	if (!playerB) {
		return { ok: false, reason: 'targetMissing' };
	}

	if (!playerB.isAlive) {
		return { ok: false, reason: 'targetDead' };
	}

	return { ok: true };
};

export const execute = (action, session) => {
	const check = validate(action, session);

	if (!check.ok) {
		return check;
	}

	queueAction(session, action);
	markAction(session, action.actorId);

	return { ok: true, feedbackKey: 'werewolf.success.loversPicked' };
};
