import { queueAndMarkAction, validateTargetedAction } from './base.js';

export const id = 'guard';

export const validate = (action, session) => {
	if (action?.type !== 'guard') {
		return { ok: false, reason: 'wrongAction' };
	}

	const base = validateTargetedAction(session, action.actorId, action.targetId, 'guard', 'guard');

	if (!base.ok) {
		return base;
	}

	if (session.guardLastTargetId && session.guardLastTargetId === action.targetId) {
		return { ok: false, reason: 'guardRepeatTarget' };
	}

	return { ok: true };
};

export const execute = (action, session) => {
	const check = validate(action, session);

	if (!check.ok) {
		return check;
	}

	queueAndMarkAction(session, action);
	session.guardLastTargetId = action.targetId;

	return { ok: true, feedbackKey: 'werewolf.success.guarded' };
};
