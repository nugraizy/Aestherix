/**
 * Werewolf — summary / announcement message builders.
 *
 * Pure functions that format the deal, morning report, voting tally, and
 * game-over payloads into text + mention lists for the handler to send.
 */

import { t } from '../../../../helper/i18n/index.js';
import { getPlayer } from '../../../../utils/games/werewolf/state/session.js';

const NS = 'werewolf';

const mention = (id) => `@${String(id).split('@')[0]}`;

const roleTeam = (role) => {
	if (role === 'werewolf' || role === 'alpha-werewolf') {
		return 'wolves';
	}

	if (role === 'jester') {
		return 'solo';
	}

	return 'village';
};

export const buildDealAnnouncement = (session, locale) => {
	const body = t(locale, `${NS}.success.starting`);
	const list = session.playersData.map((p, i) => `${i + 1}. ${mention(p.id)} ${p.name}`).join('\n');

	return {
		body: `${body}\n\n${list}`,
		mentions: session.playersData.map((p) => p.id)
	};
};

export const buildNightKickoff = (session, locale) =>
	t(locale, `${NS}.nightTime`, [session.gameTime || 40], { rng: Math.random });

export const buildMorningReport = (session, nightResult, locale) => {
	const killedPlayers = nightResult.killedIds.map((id) => getPlayer(session, id)).filter(Boolean);

	if (killedPlayers.length === 0) {
		return {
			body: t(locale, `${NS}.dayTime.noKill`),
			mentions: []
		};
	}

	const victimLabel = killedPlayers.map((p) => `${mention(p.id)}`).join(', ');
	const body = t(locale, `${NS}.dayTime.kill`, [victimLabel]);

	return {
		body,
		mentions: killedPlayers.map((p) => p.id)
	};
};

export const buildVotingClosedAnnouncement = (session, tally, locale) => {
	if (tally.isNoVotes) {
		return {
			body: t(locale, `${NS}.lynchNoOne`),
			mentions: []
		};
	}

	if (tally.isDraw) {
		return {
			body: t(locale, `${NS}.lynchDraws`),
			mentions: []
		};
	}

	const victim = getPlayer(session, tally.lynchedId);

	if (!victim) {
		return { body: '', mentions: [] };
	}

	const key = victim.role === 'werewolf' || victim.role === 'alpha-werewolf' ? 'lynchKillWerewolf' : 'lynchKillNotWerewolf';

	return {
		body: t(locale, `${NS}.${key}`, [mention(victim.id), victim.role]),
		mentions: [victim.id]
	};
};

export const buildGameOverSummary = (session, winner, reason, locale) => {
	const winnerLine = winner ? t(locale, `${NS}.winner.${winner}`) : t(locale, `${NS}.errors.afk`);

	const splitByTeam = (team) => session.playersData.filter((p) => roleTeam(p.role) === team);
	const listPlayer = (p) => `${mention(p.id)} ${p.isAlive ? '😄' : '💀'} — ${p.role}`;

	const goodTeam = splitByTeam('village');
	const wolfTeam = splitByTeam('wolves');
	const soloTeam = splitByTeam('solo');

	const parts = [
		winnerLine,
		'',
		locale === 'en' ? 'Village team:' : 'Pihak Warga:',
		...goodTeam.map(listPlayer),
		'',
		locale === 'en' ? 'Wolves team:' : 'Pihak Werewolf:',
		...wolfTeam.map(listPlayer)
	];

	if (soloTeam.length > 0) {
		parts.push('');
		parts.push(locale === 'en' ? 'Solo:' : 'Pihak Solo:');
		parts.push(...soloTeam.map(listPlayer));
	}

	parts.push('');
	parts.push(locale === 'en' ? `Reason: ${reason ?? 'winCondition'}` : `Alasan: ${reason ?? 'kondisiMenang'}`);

	return {
		body: parts.join('\n'),
		mentions: session.playersData.map((p) => p.id)
	};
};
