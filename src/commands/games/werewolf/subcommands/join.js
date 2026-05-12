import { getLocale } from '../../../../helper/i18n/index.js';
import { addPlayer } from '../../../../utils/games/werewolf/state/session.js';
import { repository } from '../../../../utils/games/werewolf/state/repository.js';
import { localised, replyError } from './_shared.js';

export const name = 'join';

export const run = async (ctx, client) => {
	if (!ctx.isGroup) {
		return replyError(ctx, client, getLocale(ctx.from), 'groupOnly');
	}

	const session = await repository.load(ctx.from);

	if (!session) {
		return replyError(ctx, client, getLocale(ctx.from), 'noSessionExist');
	}

	const locale = getLocale(session.roomId);
	const result = addPlayer(session, { id: ctx.sender, name: ctx.pushname || '' });

	if (!result.ok) {
		const reason = result.reason === 'already-joined' ? 'joined' : result.reason === 'full' ? 'full' : 'started';

		return replyError(ctx, client, locale, reason);
	}

	repository.save(session);

	const body = `${localised(locale, 'success.join')}\n\n${session.playersData
		.map((p, i) => `${i + 1}. @${p.id.split('@')[0]} ${p.name}`)
		.join('\n')}`;

	return client.instance.send(ctx.from, { text: body, mentions: session.playersData.map((p) => p.id) }, { quoted: ctx.message });
};
