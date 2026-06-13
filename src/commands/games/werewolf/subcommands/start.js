import { getLocale } from '../../../../helper/i18n/index.js';
import { MIN_PLAYERS } from '../../../../utils/games/werewolf/config/constants.js';
import { isLobbyReady } from '../../../../utils/games/werewolf/state/session.js';
import { repository } from '../../../../utils/games/werewolf/state/repository.js';
import { getLobbyTimer } from '../../../../utils/games/werewolf/logic/lobby-timer-singleton.js';
import { finalizeStart } from './_start-game.js';
import { replyError } from './_shared.js';

export const name = 'start';

export const run = async (ctx, client) => {
	const session = await repository.load(ctx.from);

	if (!session) {
		return replyError(ctx, client, await getLocale(ctx.from), 'noSessionExist');
	}

	const locale = await getLocale(session.roomId);

	if (session.roomMaster !== ctx.sender) {
		return replyError(ctx, client, locale, 'notRoomMaster');
	}

	if (session.phase !== 'lobby') {
		return replyError(ctx, client, locale, 'started');
	}

	if (!isLobbyReady(session)) {
		return replyError(ctx, client, locale, 'notEnoughPlayer', [MIN_PLAYERS, session.playersData.length]);
	}

	getLobbyTimer()?.stop(session.roomId);

	await finalizeStart(session, client, locale, { quoted: ctx.message });

	return undefined;
};
