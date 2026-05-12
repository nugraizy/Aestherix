/**
 * Werewolf phase machine — pure.
 *
 * `advancePhase(session, { rng })` mutates `session` to the phase that
 * follows its current phase. The scheduler calls this once per tick, reads
 * the returned `events` array, emits each one, and schedules the next tick.
 *
 * Phase order:
 *
 *   lobby  ─(explicit start command)→  deal
 *   deal   ─→  night                   (roles announced)
 *   night  ─→  hunterShoot | day       (resolveNight; hunters shoot first)
 *   day    ─→  voting                  (morning report; voting opens)
 *   voting ─→  hunterShoot | night     (tally + lynch; hunter if hunter lynched)
 *   hunterShoot ─→  day | night        (back to whichever phase was deferred)
 *   ended  is terminal
 *
 * AFK counter:
 *   - night with 0 queued actions → WARNING only (no AFK increment).
 *   - voting with 0 votes         → gameAfk++; at AFK_LIMIT the game ends
 *                                    with reason "afk".
 *
 * @typedef {import('../types.js').Session} Session
 * @typedef {import('../types.js').PhaseName} PhaseName
 */

import { AFK_LIMIT, PHASE_TIMERS } from '../config/constants.js';
import { EVENTS } from '../events.js';
import { getAlivePlayers, getPlayer, markDead, resetPerks, setPhase } from '../state/session.js';
import { applyLynch, tallyVotes } from './voting.js';
import { evaluateWin } from './win.js';
import { resolveNight } from './resolution.js';

const timerForPhase = (phase) => PHASE_TIMERS[phase] ?? 0;

const buildStats = (session) => ({
	players: session.playersData.map((p) => ({
		id: p.id,
		name: p.name,
		role: p.role,
		isAlive: p.isAlive
	})),
	firstNight: session.firstNight,
	turnsPlayed: session.timeSpent
});

const endGame = (session, winner, reason) => {
	setPhase(session, 'ended');
	return [
		{
			name: EVENTS.GAME_ENDED,
			payload: {
				roomId: session.roomId,
				winner,
				reason,
				stats: buildStats(session),
				duration: Date.now() - (session.gameTimeStarted ?? Date.now())
			}
		}
	];
};

const advanceLoverCascade = (session, killedIds) => {
	if (session.loverIds.length !== 2) {
		return killedIds;
	}

	const [a, b] = session.loverIds;
	const playerA = getPlayer(session, a);
	const playerB = getPlayer(session, b);

	if (!playerA || !playerB) {
		return killedIds;
	}

	const aDead = !playerA.isAlive;
	const bDead = !playerB.isAlive;

	if (aDead && !bDead) {
		markDead(session, b);
		return [...killedIds, b];
	}

	if (bDead && !aDead) {
		markDead(session, a);
		return [...killedIds, a];
	}

	return killedIds;
};

/**
 * @param {Session} session
 * @param {{ rng?: () => number }} [options]
 * @returns {{ events: Array<{ name: string, payload: object }>, winner: string | null, nextTimerSec: number }}
 */
export const advancePhase = (session, { rng = Math.random } = {}) => {
	const events = [];
	const current = session.phase;

	switch (current) {
		case 'lobby': {
			return { events, winner: null, nextTimerSec: 0 };
		}

		case 'deal': {
			setPhase(session, 'night');
			session.gameTimeStarted = session.gameTimeStarted ?? Date.now();
			events.push({
				name: EVENTS.PHASE_CHANGED,
				payload: {
					roomId: session.roomId,
					phase: 'night',
					previousPhase: 'deal',
					timerSec: timerForPhase('night')
				}
			});
			return { events, winner: null, nextTimerSec: timerForPhase('night') };
		}

		case 'night': {
			if ((session.actionQueue?.length ?? 0) === 0) {
				events.push({
					name: EVENTS.WARNING,
					payload: { roomId: session.roomId, code: 'nightIdle', vars: {} }
				});
			}

			const result = resolveNight(session, { rng });

			session.timeSpent += 1;
			session.firstNight = false;

			const nextPhase = session.pendingShots.length > 0 ? 'hunterShoot' : 'day';

			setPhase(session, nextPhase);

			if (nextPhase === 'day') {
				events.push({
					name: EVENTS.MORNING_REPORT,
					payload: {
						roomId: session.roomId,
						killedIds: result.killedIds,
						convertedIds: result.convertedIds,
						protectedIds: result.protectedIds,
						loverCascadeIds: result.loverCascadeIds,
						seerObservations: result.seerObservations
					}
				});
			}

			events.push({
				name: EVENTS.PHASE_CHANGED,
				payload: {
					roomId: session.roomId,
					phase: nextPhase,
					previousPhase: 'night',
					timerSec: timerForPhase(nextPhase)
				}
			});

			const winner = evaluateWin(session);

			if (winner) {
				events.push(...endGame(session, winner, 'winCondition'));
				return { events, winner, nextTimerSec: 0 };
			}

			return { events, winner: null, nextTimerSec: timerForPhase(nextPhase) };
		}

		case 'hunterShoot': {
			const additionalKills = [];

			for (const shot of session.pendingShots) {
				if (!shot.targetId) {
					continue;
				}

				const target = getPlayer(session, shot.targetId);

				if (target && target.isAlive) {
					markDead(session, shot.targetId);
					additionalKills.push(shot.targetId);
				}
			}

			const cascaded = advanceLoverCascade(session, additionalKills);

			session.pendingShots = [];

			const previous = session.hunterRevengeSourcePhase;
			const returnPhase = previous === 'night' ? 'day' : 'night';

			session.hunterRevengeSourcePhase = null;

			if (returnPhase === 'day') {
				events.push({
					name: EVENTS.MORNING_REPORT,
					payload: {
						roomId: session.roomId,
						killedIds: cascaded,
						convertedIds: [],
						protectedIds: [],
						loverCascadeIds: cascaded.filter((id) => additionalKills.indexOf(id) === -1),
						seerObservations: []
					}
				});
			}

			setPhase(session, returnPhase);
			events.push({
				name: EVENTS.PHASE_CHANGED,
				payload: {
					roomId: session.roomId,
					phase: returnPhase,
					previousPhase: 'hunterShoot',
					timerSec: timerForPhase(returnPhase)
				}
			});

			const winner = evaluateWin(session);

			if (winner) {
				events.push(...endGame(session, winner, 'winCondition'));
				return { events, winner, nextTimerSec: 0 };
			}

			return { events, winner: null, nextTimerSec: timerForPhase(returnPhase) };
		}

		case 'day': {
			setPhase(session, 'voting');
			events.push({
				name: EVENTS.VOTING_OPENED,
				payload: {
					roomId: session.roomId,
					candidates: getAlivePlayers(session).map((p) => ({ id: p.id, name: p.name }))
				}
			});
			events.push({
				name: EVENTS.PHASE_CHANGED,
				payload: {
					roomId: session.roomId,
					phase: 'voting',
					previousPhase: 'day',
					timerSec: timerForPhase('voting')
				}
			});

			return { events, winner: null, nextTimerSec: timerForPhase('voting') };
		}

		case 'voting': {
			const tally = tallyVotes(session);

			let lynchedRole = null;

			if (tally.totalVotes === 0) {
				session.gameAfk += 1;
			} else if (tally.winner) {
				const lynch = applyLynch(session, tally.winner);

				lynchedRole = lynch.role ?? null;
				session.gameAfk = 0;
			}

			events.push({
				name: EVENTS.VOTING_CLOSED,
				payload: {
					roomId: session.roomId,
					tally: tally.tally,
					lynchedId: tally.winner,
					lynchedRole,
					isDraw: tally.isDraw,
					isNoVotes: tally.totalVotes === 0
				}
			});

			if (session.gameAfk >= AFK_LIMIT) {
				events.push(...endGame(session, null, 'afk'));
				return { events, winner: null, nextTimerSec: 0 };
			}

			const winner = evaluateWin(session);

			if (winner) {
				events.push(...endGame(session, winner, 'winCondition'));
				return { events, winner, nextTimerSec: 0 };
			}

			resetPerks(session);

			const nextPhase = session.pendingShots.length > 0 ? 'hunterShoot' : 'night';

			if (nextPhase === 'hunterShoot') {
				session.hunterRevengeSourcePhase = 'voting';
			}

			setPhase(session, nextPhase);
			events.push({
				name: EVENTS.PHASE_CHANGED,
				payload: {
					roomId: session.roomId,
					phase: nextPhase,
					previousPhase: 'voting',
					timerSec: timerForPhase(nextPhase)
				}
			});

			return { events, winner: null, nextTimerSec: timerForPhase(nextPhase) };
		}

		case 'ended': {
			return { events, winner: null, nextTimerSec: 0 };
		}

		default: {
			setPhase(session, 'ended');
			return { events: endGame(session, null, 'unknownPhase'), winner: null, nextTimerSec: 0 };
		}
	}
};
