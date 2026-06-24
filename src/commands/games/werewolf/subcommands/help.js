import { getLocale, t } from '../../../../helper/i18n/index.js';
import { getPrefix } from '../../../../helper/modules/prefix.js';
import { replyText } from './_shared.js';

export const name = 'help';

const WW_COMMANDS = [
	'newGame', 'join', 'start', 'exit', 'delete',
	'kill', 'seer', 'guard', 'heal', 'poison',
	'shoot', 'lovers', 'peek', 'convert', 'vote', 'lang'
];

export const run = async (ctx, client) => {
	const locale = await getLocale(ctx.from);
	const prefix = getPrefix(ctx) + 'ww';

	return replyText(ctx, client, t(locale, 'werewolf.help', [prefix, ...WW_COMMANDS]));
};
