import { getLocale } from '../../../../helper/i18n/index.js';
import { resolveAliveIndex } from '../../../../utils/games/werewolf/logic/actions.js';
import { getRoleModule } from '../../../../utils/games/werewolf/roles/index.js';
import { repository } from '../../../../utils/games/werewolf/state/repository.js';
import { buildCupidPrompt } from '../ui/prompts.js';
import { localised, replyError, replyText } from './_shared.js';

export const name = 'lovers';

const isJid = (value) => typeof value === 'string' && value.includes('@');

const pickRoomId = (ctx) => {
	const candidates = [ctx.args?.[4], ctx.args?.[3], ctx.from];

	return candidates.find(isJid) || ctx.from;
};

const sendCupidSecondPickPrompt = async (ctx, client, session, firstId, locale) => {
	const prompt = buildCupidPrompt(session, locale, { excludeId: firstId, ctx });

	if (!prompt?.buttons?.length) {
		const fallback = session.playersData.find((p) => p.id === firstId)?.name ?? firstId;

		return replyText(
			ctx,
			client,
			locale === 'en'
				? `💘 First lover: *${fallback}*\nNow pick the second lover.`
				: `💘 Pasangan pertama: *${fallback}*\nSekarang pilih pasangan kedua.`
		);
	}

	const builder = new client.TemplateBuilder.Native();

	await builder
		.destination(ctx.from)
		.body(prompt.body)
		.footer(prompt.footer || '')
		.buttons(...prompt.buttons.map((b) => builder.button.reply(b)))
		.send();

	return undefined;
};

export const run = async (ctx, client) => {
	const roomId = pickRoomId(ctx);
	const session = await repository.load(roomId);

	if (!session) {
		return replyError(ctx, client, getLocale(ctx.from), 'noSessionExist');
	}

	const locale = getLocale(session.roomId);

	const cupid = session.playersData.find((p) => p.id === ctx.sender && p.role === 'cupid');

	if (cupid?.isAction) {
		return replyError(ctx, client, locale, 'alreadyAction');
	}

	const firstRaw = Number.parseInt(ctx.args?.[2] ?? '', 10);
	const secondArg = ctx.args?.[3];
	const secondRaw = isJid(secondArg) ? Number.NaN : Number.parseInt(secondArg ?? '', 10);

	if (!Number.isNaN(firstRaw) && Number.isNaN(secondRaw) && !session.cupidFirstPick) {
		const firstId = resolveAliveIndex(session, firstRaw);

		if (!firstId) {
			return replyError(ctx, client, locale, 'targetMissing');
		}

		session.cupidFirstPick = firstId;
		repository.save(session);

		return sendCupidSecondPickPrompt(ctx, client, session, firstId, locale);
	}

	let firstId;
	let secondId;

	if (!Number.isNaN(firstRaw) && !Number.isNaN(secondRaw)) {
		firstId = resolveAliveIndex(session, firstRaw);
		secondId = resolveAliveIndex(session, secondRaw);
	} else if (session.cupidFirstPick && !Number.isNaN(firstRaw)) {
		firstId = session.cupidFirstPick;
		secondId = resolveAliveIndex(session, firstRaw);
	} else {
		return replyError(ctx, client, locale, 'targetMissing');
	}

	if (!firstId || !secondId) {
		return replyError(ctx, client, locale, 'targetMissing');
	}

	const module = getRoleModule('cupid');
	const result = module.execute({ type: 'lovers', actorId: ctx.sender, targetIds: [firstId, secondId] }, session);

	if (!result.ok) {
		return replyError(ctx, client, locale, result.reason ?? 'wrongAction');
	}

	delete session.cupidFirstPick;
	repository.save(session);

	const firstName = session.playersData.find((p) => p.id === firstId)?.name ?? firstId;
	const secondName = session.playersData.find((p) => p.id === secondId)?.name ?? secondId;

	return replyText(ctx, client, localised(locale, 'success.loversPicked', [firstName, secondName]));
};
