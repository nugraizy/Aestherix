import { getLocale } from '../../../../helper/i18n/index.js';
import { canVote } from '../../../../utils/games/werewolf/logic/actions.js';
import { markVoted } from '../../../../utils/games/werewolf/state/session.js';
import { repository } from '../../../../utils/games/werewolf/state/repository.js';
import { resolveAliveIndex } from '../../../../utils/games/werewolf/logic/actions.js';
import { replyError, replyKey, loadSession } from './_shared.js';

export const name = 'vote';

export const run = async (ctx, client) => {
	const { session } = await loadSession(ctx);

	if (!session) {
		return replyError(ctx, client, getLocale(ctx.from), 'noSessionExist');
	}

	const locale = getLocale(session.roomId);

	const rawIndex = Number.parseInt(ctx.args?.[2] ?? '', 10);
	const targetId = resolveAliveIndex(session, rawIndex);

	if (!targetId) {
		return replyError(ctx, client, locale, 'targetMissing');
	}

	const check = canVote(session, ctx.sender, targetId);

	if (!check.ok) {
		return replyError(ctx, client, locale, check.reason ?? 'wrongAction');
	}

	markVoted(session, ctx.sender);
	session.playerVoted.push({
		voterId: ctx.sender,
		voterName: ctx.pushname || ctx.sender,
		targetId
	});
	repository.save(session);

	return replyKey(ctx, client, locale, 'success.voted');
};
