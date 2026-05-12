import { getLocale, t } from '../../../../helper/i18n/index.js';
import { replyText } from './_shared.js';

export const name = 'help';

export const run = (ctx, client) => {
	const locale = getLocale(ctx.from);

	return replyText(ctx, client, t(locale, 'werewolf.help'));
};
