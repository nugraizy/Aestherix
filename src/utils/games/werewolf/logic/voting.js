/**
 * Werewolf voting — tally, lynch application, pure.
 *
 * @typedef {import('../types.js').Session} Session
 * @typedef {import('../types.js').Player} Player
 */

import { getPlayer, markDead } from '../state/session.js';

/**
 * Aggregate the per-voter tally.
 *
 * @param {Session} session
 * @returns {{
 *   tally: Record<string, { count: number, voters: string[] }>,
 *   totalVotes: number,
 *   winner: string | null,
 *   runnerUp: string | null,
 *   isDraw: boolean
 * }}
 */
export const tallyVotes = (session) => {
	const tally = {};

	for (const vote of session.playerVoted) {
		const entry = tally[vote.targetId] ?? { count: 0, voters: [] };

		entry.count += 1;
		entry.voters.push(vote.voterName || vote.voterId);

		tally[vote.targetId] = entry;
	}

	const ordered = Object.entries(tally).sort(([, a], [, b]) => b.count - a.count);

	const winner = ordered[0]?.[0] ?? null;
	const runnerUp = ordered[1]?.[0] ?? null;

	const isDraw = ordered.length > 1 && ordered[0][1].count === ordered[1][1].count;

	return {
		tally,
		totalVotes: session.playerVoted.length,
		winner: isDraw ? null : winner,
		runnerUp,
		isDraw
	};
};

/**
 * Kill the lynch target.  Sets `session.jesterLynched` when the victim is a
 * Jester — that is the one death that triggers Jester's solo win.
 *
 * @param {Session} session
 * @param {string} targetId
 * @returns {{ ok: boolean, reason?: 'not-alive' | 'unknown', role?: string, jesterLynched?: boolean }}
 */
export const applyLynch = (session, targetId) => {
	const player = getPlayer(session, targetId);

	if (!player) {
		return { ok: false, reason: 'unknown' };
	}

	if (!player.isAlive) {
		return { ok: false, reason: 'not-alive' };
	}

	markDead(session, targetId);

	if (player.role === 'jester') {
		session.jesterLynched = true;
	}

	return { ok: true, role: player.role, jesterLynched: session.jesterLynched === true };
};
