import { getLocale, setLocale } from '../../../../helper/i18n/index.js';
import { LOBBY_TIMEOUT_MS } from '../../../../utils/games/werewolf/config/constants.js';
import { getLobbyTimer } from '../../../../utils/games/werewolf/logic/lobby-timer-singleton.js';
import { repository } from '../../../../utils/games/werewolf/state/repository.js';
import { createSession } from '../../../../utils/games/werewolf/state/session.js';
import { buildLobbyPrompt } from '../ui/prompts.js';
import { localised, replyError } from './_shared.js';

export const name = 'newGame';

export const run = async (ctx, client) => {
	if (!ctx.isGroup) {
		return replyError(ctx, client, await getLocale(ctx.from), 'groupOnly');
	}

	const existing = await repository.load(ctx.from);

	if (existing) {
		const locale = await getLocale(existing.roomId);

		return client.reply(ctx.from, localised(locale, 'errors.gameExistsTryingToMakeNewOne'), ctx.message);
	}

	const session = createSession({
		roomId: ctx.from,
		roomMaster: ctx.sender,
		roomMasterName: ctx.pushname,
		locale: await getLocale(ctx.from)
	});

	repository.save(session);
	await setLocale(ctx.from, session.locale);

	getLobbyTimer()?.start(session.roomId, LOBBY_TIMEOUT_MS);

	const locale = session.locale;
	const prompt = buildLobbyPrompt(session, locale);
	const builder = new client.TemplateBuilder.Native();

	await builder
		.destination(ctx.from)
		.body(prompt.body)
		.footer(prompt.footer)
		.buttons(...prompt.buttons.map((b) => builder.button.reply(b)))
		.mentions(prompt.mentions)
		.send();
};
