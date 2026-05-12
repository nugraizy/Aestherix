import { isNight } from '../logic/actions.js';
import { queueAction } from '../logic/resolution.js';
import { markAction } from '../state/session.js';
import { ensureRole } from './base.js';

export const id = 'little-girl';

export const validate = (action, session) => {
	if (action?.type !== 'peek') {
		return { ok: false, reason: 'wrongAction' };
	}

	if (!isNight(session)) {
		return { ok: false, reason: 'wrongTime' };
	}

	const roleOk = ensureRole(session, action.actorId, 'little-girl');

	if (!roleOk.ok) {
		return roleOk;
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

	return { ok: true, feedbackKey: 'werewolf.success.peekAttempt' };
};
