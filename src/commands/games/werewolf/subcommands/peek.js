import { getLocale } from '../../../../helper/i18n/index.js';
import { getRoleModule } from '../../../../utils/games/werewolf/roles/index.js';
import { repository } from '../../../../utils/games/werewolf/state/repository.js';
import { loadSession, replyError, replyKey } from './_shared.js';

export const name = 'peek';

export const run = async (ctx, client) => {
	const { session } = await loadSession(ctx, 2);

	if (!session) {
		return replyError(ctx, client, await getLocale(ctx.from), 'noSessionExist');
	}

	const locale = await getLocale(session.roomId);
	const module = getRoleModule('little-girl');
	const result = module.execute({ type: 'peek', actorId: ctx.sender }, session);

	if (!result.ok) {
		return replyError(ctx, client, locale, result.reason ?? 'wrongAction');
	}

	repository.save(session);
	return replyKey(ctx, client, locale, 'success.peekAttempt');
};
