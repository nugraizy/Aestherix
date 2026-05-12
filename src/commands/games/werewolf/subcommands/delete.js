import { getLocale } from '../../../../helper/i18n/index.js';
import { repository } from '../../../../utils/games/werewolf/state/repository.js';
import { getScheduler } from '../../../../utils/games/werewolf/logic/scheduler-singleton.js';
import { getLobbyTimer } from '../../../../utils/games/werewolf/logic/lobby-timer-singleton.js';
import { replyError, replyKey } from './_shared.js';

export const name = 'delete';

export const run = async (ctx, client) => {
	const session = await repository.load(ctx.from);

	if (!session) {
		return replyError(ctx, client, getLocale(ctx.from), 'noSessionExist');
	}

	const locale = getLocale(session.roomId);

	if (session.roomMaster !== ctx.sender) {
		return replyError(ctx, client, locale, 'notRoomMaster');
	}

	if (session.phase !== 'lobby') {
		return replyError(ctx, client, locale, 'gameStartedTryingToDelete');
	}

	getLobbyTimer()?.stop(session.roomId);

	const scheduler = getScheduler();

	if (scheduler) {
		scheduler.stop(session.roomId);
	}

	await repository.delete(session.roomId);

	return replyKey(ctx, client, locale, 'success.delete');
};
