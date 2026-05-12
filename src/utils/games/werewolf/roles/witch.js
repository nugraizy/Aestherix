import { queueAndMarkAction, validateTargetedAction } from './base.js';

export const id = 'witch';

export const validate = (action, session) => {
	if (!action || (action.type !== 'heal' && action.type !== 'poison')) {
		return { ok: false, reason: 'wrongAction' };
	}

	if (action.type === 'heal' && session.witchState.healUsed) {
		return { ok: false, reason: 'witchHealUsed' };
	}

	if (action.type === 'poison' && session.witchState.poisonUsed) {
		return { ok: false, reason: 'witchPoisonUsed' };
	}

	return validateTargetedAction(session, action.actorId, action.targetId, 'witch', action.type);
};

export const execute = (action, session) => {
	const check = validate(action, session);

	if (!check.ok) {
		return check;
	}

	queueAndMarkAction(session, action);

	return {
		ok: true,
		feedbackKey: action.type === 'heal' ? 'werewolf.success.healed' : 'werewolf.success.poisoned'
	};
};
