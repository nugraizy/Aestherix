import { queueAndMarkAction, validateTargetedAction } from './base.js';

export const id = 'werewolf';

export const validate = (action, session) => {
	if (action?.type !== 'kill') {
		return { ok: false, reason: 'wrongAction' };
	}

	return validateTargetedAction(session, action.actorId, action.targetId, 'werewolf', 'kill');
};

export const execute = (action, session) => {
	const check = validate(action, session);

	if (!check.ok) {
		return check;
	}

	queueAndMarkAction(session, action);
	return { ok: true, feedbackKey: 'werewolf.success.killWerewolf' };
};
