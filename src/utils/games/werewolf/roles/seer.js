import { queueAndMarkAction, validateTargetedAction } from './base.js';

export const id = 'seer';

export const validate = (action, session) => {
	if (action?.type !== 'seer') {
		return { ok: false, reason: 'wrongAction' };
	}

	return validateTargetedAction(session, action.actorId, action.targetId, 'seer', 'seer');
};

export const execute = (action, session) => {
	const check = validate(action, session);

	if (!check.ok) {
		return check;
	}

	queueAndMarkAction(session, action);
	return { ok: true };
};
