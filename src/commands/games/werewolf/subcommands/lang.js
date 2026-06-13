import { getLocale, setLocale } from '../../../../helper/i18n/index.js';
import { repository } from '../../../../utils/games/werewolf/state/repository.js';
import { localised, replyError, replyText } from './_shared.js';

const SUPPORTED = new Set(['id', 'en']);

export const name = 'lang';

export const run = async (ctx, client) => {
	const target = (ctx.args?.[2] || '').toLowerCase();

	if (!SUPPORTED.has(target)) {
		return replyError(ctx, client, await getLocale(ctx.from), 'unknownLocale');
	}

	await setLocale(ctx.from, target);

	const session = await repository.load(ctx.from);

	if (session) {
		session.locale = target;
		repository.save(session);
	}

	return replyText(ctx, client, localised(target, 'success.langChanged', [target]));
};
