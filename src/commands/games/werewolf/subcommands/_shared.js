/**
 * Werewolf command helpers — shared between every subcommand.
 *
 * Keeps the 17 subcommand files compact by centralising:
 *   - session lookup (from `args` or `from`)
 *   - target-index resolution (1-based → jid)
 *   - localised replies by i18n key
 *   - error → reply translation using `werewolf.errors.<reason>`
 *
 * Every subcommand file boils down to: load session → validate → mutate →
 * save → reply. The generic `runSingleTargetAction` here handles the
 * whole flow for single-target night actions (kill, seer, guard, heal,
 * poison, convert).
 */

import { getLocale, t } from '../../../../helper/i18n/index.js';
import { resolveAliveIndex } from '../../../../utils/games/werewolf/logic/actions.js';
import { getRoleModule } from '../../../../utils/games/werewolf/roles/index.js';
import { repository } from '../../../../utils/games/werewolf/state/repository.js';

const NS = 'werewolf';

/**
 * @param {string} locale
 * @param {string} key i18n key under the `werewolf` namespace
 */
export const localised = (locale, key, vars) => t(locale, `${NS}.${key}`, vars);

export const loadSession = async (ctx, argIndex = 3) => {
	const roomIdFromArg = ctx.args?.[argIndex];
	const roomId = roomIdFromArg || ctx.from;

	let session = await repository.load(roomId);

	if (!session && !roomId.endsWith('@g.us')) {
		session = repository.findByPlayer(ctx.sender);
	}

	return { session, roomId: session?.roomId ?? roomId };
};

export const replyText = (ctx, client, text) =>
	client.instance.reply(ctx.from, text, ctx.message);

export const replyKey = (ctx, client, locale, key, vars) =>
	replyText(ctx, client, localised(locale, key, vars));

export const replyError = (ctx, client, locale, reason, vars) =>
	replyText(ctx, client, localised(locale, `errors.${reason}`, vars));

/**
 * Generic single-target action runner used by kill, seer, guard, heal,
 * poison, convert. Reads the 1-based target index from `args[2]`, the
 * roomId from `args[3]`, validates via the role module, saves, replies.
 *
 * @param {{ ctx: object, client: object, roleId: string, actionType: string }} params
 */
export const runSingleTargetAction = async ({ ctx, client, roleId, actionType }) => {
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

	const module = getRoleModule(roleId);
	const actor = session.playersData.find((p) => p.id === ctx.sender);
	const effectiveRoleId = actor?.role === 'alpha-werewolf' && roleId === 'werewolf' ? 'alpha-werewolf' : roleId;
	const effectiveModule = getRoleModule(effectiveRoleId) ?? module;

	const result = effectiveModule.execute({ type: actionType, actorId: ctx.sender, targetId }, session);

	if (!result.ok) {
		return replyError(ctx, client, locale, result.reason ?? 'wrongAction');
	}

	repository.save(session);

	const targetName = session.playersData.find((p) => p.id === targetId)?.name ?? targetId;

	return replyText(ctx, client, localised(locale, result.feedbackKey?.replace(`${NS}.`, '') ?? 'success.voted', [targetName]));
};
