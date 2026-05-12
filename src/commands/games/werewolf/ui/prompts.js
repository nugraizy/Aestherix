/**
 * Werewolf — per-role prompt composers.
 *
 * Each helper receives (session, locale, ctx?) and returns the send-args
 * object the handler will feed into the TemplateBuilder.
 *
 * @typedef {import('../../../../utils/games/werewolf/types.js').Session} Session
 */

import { t } from '../../../../helper/i18n/index.js';
import { getAlivePlayers, getPlayer, isWolfRole } from '../../../../utils/games/werewolf/state/session.js';
import { buildLobbyButtons, buildTargetActionMessage } from './buttons.js';

const WEREWOLF_NS = 'werewolf';

const loc = (locale, key, vars, options) => t(locale, `${WEREWOLF_NS}.${key}`, vars, options);

const aliveTargetsExcluding = (session, excludeId) =>
	getAlivePlayers(session)
		.filter((p) => p.id !== excludeId)
		.map((p) => ({ id: p.id, name: p.name }));

const aliveNonWolfTargets = (session) =>
	getAlivePlayers(session)
		.filter((p) => !isWolfRole(p.role))
		.map((p) => ({ id: p.id, name: p.name }));

/**
 * @param {Session} session
 * @param {string} locale
 * @param {{ ctx?: object }} [opts]
 */
export const buildWerewolfPrompt = (session, locale, { ctx } = {}) => {
	const targets = aliveNonWolfTargets(session);

	return buildTargetActionMessage({
		subcommand: 'kill',
		roomId: session.roomId,
		targets,
		labelPrefix: locale === 'en' ? 'KILL' : 'BUNUH',
		bodyText: loc(locale, 'roleDialogue.werewolf', [
			targets
				.filter(() => false)
				.map((t) => t.name)
				.join(', ')
		]),
		footerText: loc(locale, 'prompts.nightActionFooter'),
		ctx
	});
};

export const buildSeerPrompt = (session, locale, { ctx } = {}) => {
	const actor = getPlayer(session, session.playersData.find((p) => p.role === 'seer' && p.isAlive)?.id);
	const targets = actor ? aliveTargetsExcluding(session, actor.id) : [];

	return buildTargetActionMessage({
		subcommand: 'seer',
		roomId: session.roomId,
		targets,
		labelPrefix: locale === 'en' ? 'PEEK' : 'TERAWANG',
		bodyText: loc(locale, 'roleDialogue.seer'),
		footerText: loc(locale, 'prompts.nightActionFooter'),
		ctx
	});
};

export const buildGuardPrompt = (session, locale, { ctx } = {}) => {
	const guard = session.playersData.find((p) => p.role === 'guard' && p.isAlive);
	const targets = guard ? aliveTargetsExcluding(session, guard.id).filter((t) => t.id !== session.guardLastTargetId) : [];

	return buildTargetActionMessage({
		subcommand: 'guard',
		roomId: session.roomId,
		targets,
		labelPrefix: locale === 'en' ? 'GUARD' : 'JAGA',
		bodyText: loc(locale, 'roleDialogue.guard'),
		footerText: loc(locale, 'prompts.nightActionFooter'),
		ctx
	});
};

export const buildWitchHealPrompt = (session, locale, { ctx } = {}) => {
	if (session.witchState.healUsed) {
		return null;
	}

	const targets = aliveNonWolfTargets(session);

	return buildTargetActionMessage({
		subcommand: 'heal',
		roomId: session.roomId,
		targets,
		labelPrefix: locale === 'en' ? 'HEAL' : 'OBATI',
		bodyText: loc(locale, 'roleDialogue.witch'),
		footerText: loc(locale, 'prompts.nightActionFooter'),
		ctx
	});
};

export const buildWitchPoisonPrompt = (session, locale, { ctx } = {}) => {
	if (session.witchState.poisonUsed) {
		return null;
	}

	const witch = session.playersData.find((p) => p.role === 'witch' && p.isAlive);
	const targets = witch ? aliveTargetsExcluding(session, witch.id) : [];

	return buildTargetActionMessage({
		subcommand: 'poison',
		roomId: session.roomId,
		targets,
		labelPrefix: locale === 'en' ? 'POISON' : 'RACUNI',
		bodyText: loc(locale, 'roleDialogue.witch'),
		footerText: loc(locale, 'prompts.nightActionFooter'),
		ctx
	});
};

export const buildHunterRevengePrompt = (session, actorId, locale, { ctx } = {}) => {
	const targets = aliveTargetsExcluding(session, actorId);

	return buildTargetActionMessage({
		subcommand: 'shoot',
		roomId: session.roomId,
		targets,
		labelPrefix: locale === 'en' ? 'SHOOT' : 'TEMBAK',
		bodyText: loc(locale, 'roleAction.hunterRevengePrompt'),
		footerText: loc(locale, 'prompts.nightActionFooter'),
		ctx
	});
};

export const buildCupidPrompt = (session, locale, { ctx, excludeId } = {}) => {
	const cupid = session.playersData.find((p) => p.role === 'cupid' && p.isAlive);

	if (!cupid) {
		return { body: '', footer: '', buttons: [], mentions: [] };
	}

	const targets = aliveTargetsExcluding(session, cupid.id).filter((tgt) => tgt.id !== excludeId);

	const pickNumber = excludeId ? 2 : 1;
	const firstName = excludeId ? session.playersData.find((p) => p.id === excludeId)?.name || '' : '';
	const hint = locale === 'en' ? 'Reply: .ww lovers <n1> <n2>' : 'Balas: .ww lovers <n1> <n2>';

	const headline = excludeId
		? locale === 'en'
			? `💘 First lover: *${firstName}*\nPick the second lover.`
			: `💘 Pasangan pertama: *${firstName}*\nPilih pasangan kedua.`
		: loc(locale, 'roleDialogue.cupid');

	const bodyText = `${headline}\n\n${hint}`;

	return buildTargetActionMessage({
		subcommand: 'lovers',
		roomId: session.roomId,
		targets,
		labelPrefix: locale === 'en' ? `LOVER ${pickNumber}` : `PASANGAN ${pickNumber}`,
		bodyText,
		footerText: loc(locale, 'prompts.nightActionFooter'),
		ctx
	});
};

export const buildLittleGirlPrompt = (session, locale, { ctx } = {}) => {
	return {
		body: loc(locale, 'roleDialogue.little-girl'),
		footer: loc(locale, 'prompts.nightActionFooter'),
		buttons: [
			{
				display: locale === 'en' ? 'PEEK WOLF CHAT' : 'INTIP OBROLAN WEREWOLF',
				id: `.ww peek ${session.roomId}`
			}
		],
		mentions: [],
		ctx
	};
};

export const buildAlphaKillPrompt = (session, locale, opts = {}) => buildWerewolfPrompt(session, locale, opts);

export const buildAlphaConvertPrompt = (session, locale, { ctx } = {}) => {
	if (session.alphaConverted) {
		return null;
	}

	const targets = aliveNonWolfTargets(session);

	return buildTargetActionMessage({
		subcommand: 'convert',
		roomId: session.roomId,
		targets,
		labelPrefix: locale === 'en' ? 'CONVERT' : 'RUBAH',
		bodyText: loc(locale, 'roleDialogue.alpha-werewolf'),
		footerText: loc(locale, 'prompts.nightActionFooter'),
		ctx
	});
};

export const buildVotingPrompt = (session, voterId, locale, { ctx } = {}) => {
	const targets = aliveTargetsExcluding(session, voterId);

	return buildTargetActionMessage({
		subcommand: 'vote',
		roomId: session.roomId,
		targets,
		labelPrefix: locale === 'en' ? 'VOTE' : 'VOTE',
		bodyText: loc(locale, 'dayTime.voting'),
		footerText: loc(locale, 'prompts.votingFooter'),
		ctx
	});
};

export const buildLobbyPrompt = (session, locale, { ctx } = {}) => {
	const labels = {
		join: loc(locale, 'prompts.lobbyJoin'),
		start: loc(locale, 'prompts.lobbyStart'),
		exit: loc(locale, 'prompts.lobbyExit'),
		delete: loc(locale, 'prompts.lobbyDelete')
	};

	const buttons = buildLobbyButtons({ roomId: session.roomId, labels, ctx });

	const playerList = session.playersData.map((p, i) => `${i + 1}. @${p.id.split('@')[0]} ${p.name}`).join('\n');

	return {
		body: `${loc(locale, 'prompts.lobbyNewGame')}\n\n${playerList}`,
		footer: loc(locale, 'prompts.nightActionFooter'),
		buttons,
		mentions: session.playersData.map((p) => p.id)
	};
};
