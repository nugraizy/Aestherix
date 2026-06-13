import { getLocale } from '../../../../helper/i18n/index.js';
import { removePlayer } from '../../../../utils/games/werewolf/state/session.js';
import { repository } from '../../../../utils/games/werewolf/state/repository.js';
import { replyError, replyKey } from './_shared.js';

export const name = 'exit';

export const run = async (ctx, client) => {
	const session = await repository.load(ctx.from);

	if (!session) {
		return replyError(ctx, client, await getLocale(ctx.from), 'noSessionExist');
	}

	const locale = await getLocale(session.roomId);
	const result = removePlayer(session, ctx.sender);

	if (!result.ok) {
		const reason = result.reason === 'not-joined' ? 'notJoined' : 'gameStarted';

		return replyError(ctx, client, locale, reason);
	}

	if (session.playersData.length === 0) {
		await repository.delete(session.roomId);
		return replyKey(ctx, client, locale, 'success.exitAndDelete');
	}

	repository.save(session);
	return replyKey(ctx, client, locale, 'success.exit');
};
