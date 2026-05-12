import { canTarget } from '../logic/actions.js';
import { queueAndMarkAction, validateTargetedAction } from './base.js';
import { getPlayer, isWolfRole } from '../state/session.js';

export const id = 'alpha-werewolf';

export const validate = (action, session) => {
	if (!action || (action.type !== 'kill' && action.type !== 'convert')) {
		return { ok: false, reason: 'wrongAction' };
	}

	if (action.type === 'kill') {
		return validateTargetedAction(session, action.actorId, action.targetId, 'alpha-werewolf', 'kill');
	}

	if (session.alphaConverted) {
		return { ok: false, reason: 'alphaConvertUsed' };
	}

	const roleOk = getPlayer(session, action.actorId)?.role === 'alpha-werewolf';

	if (!roleOk) {
		return { ok: false, reason: 'wrongRole' };
	}

	const reach = canTarget(session, action.actorId, action.targetId);

	if (!reach.ok) {
		return reach;
	}

	const target = getPlayer(session, action.targetId);

	if (!target || isWolfRole(target.role)) {
		return { ok: false, reason: 'wrongKill' };
	}

	return { ok: true };
};

export const execute = (action, session) => {
	const check = validate(action, session);

	if (!check.ok) {
		return check;
	}

	queueAndMarkAction(session, action);

	return {
		ok: true,
		feedbackKey: action.type === 'convert' ? 'werewolf.success.convertCast' : 'werewolf.success.killWerewolf'
	};
};
