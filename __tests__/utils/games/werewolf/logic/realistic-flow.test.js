/**
 * Realistic end-to-end werewolf flow test.
 *
 * Simulates the full lifecycle of a game as if real users were interacting
 * over WhatsApp:
 *   1. Room master runs `!wolf newgame` → createSession + lobbyTimer.start
 *   2. Players trickle in with staggered delays → addPlayer + repo.save
 *   3. Room master runs `!wolf start` once the lobby is ready
 *      → lobbyTimer.stop + dealRoles + setPhase('deal') + scheduler.start
 *   4. The scheduler drives every phase transition using the real
 *      PHASE_TIMERS values (night=40s, day=20s, voting=30s, hunterShoot=20s).
 *   5. During each action / voting / hunter-shoot window players' commands
 *      arrive at realistic sub-window timestamps before the phase timer
 *      fires.
 *
 * A discrete-event fake clock drives both the lobby timer and the scheduler,
 * so no wall time is actually consumed — but every simulated timestamp is
 * accurate to the millisecond.
 *
 * Every log line is prefixed with `[mm:ss.mmm]` since `newgame`, so the
 * spec output reads as a real play log.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Cache } from '../../../../../src/helper/modules/cache.js';
import { LOBBY_TIMEOUT_MS, MAX_PLAYERS, MIN_PLAYERS } from '../../../../../src/utils/games/werewolf/config/constants.js';
import { buildComposition, summariseComposition } from '../../../../../src/utils/games/werewolf/config/balance.js';
import { EVENTS } from '../../../../../src/utils/games/werewolf/events.js';
import { makeLobbyTimer } from '../../../../../src/utils/games/werewolf/logic/lobby-timer.js';
import { makeRepository } from '../../../../../src/utils/games/werewolf/state/repository.js';
import { makeScheduler } from '../../../../../src/utils/games/werewolf/logic/scheduler.js';
import {
	addPlayer,
	createSession,
	dealRoles,
	getAlivePlayers,
	getPlayer,
	isLobbyReady,
	isWolfRole,
	setPhase
} from '../../../../../src/utils/games/werewolf/state/session.js';

const VALID_WINNERS = new Set(['village', 'werewolf', 'lovers', 'jester']);
const MAX_SIM_TICKS = 200;
const JOIN_GAP_MS = 3500;
const JOIN_JITTER_MS = 2000;
const PRE_START_DELAY_MS = 4000;

const makeRng = (seed) => {
	let state = Math.abs(seed) % 2147483647 || 1;

	return () => {
		state = (state * 48271) % 2147483647;
		return state / 2147483647;
	};
};

const makeFakePrisma = () => {
	const table = new Map();

	return {
		werewolfSession: {
			async findUnique({ where }) {
				return table.get(where.roomId) ?? null;
			},
			async findMany({ where } = {}) {
				const rows = [...table.values()];

				if (where?.phase?.not) {
					return rows.filter((r) => r.phase !== where.phase.not);
				}

				return rows;
			},
			async upsert({ where, update, create }) {
				const existing = table.get(where.roomId);

				if (existing) {
					const merged = { ...existing, ...update };

					table.set(where.roomId, merged);
					return merged;
				}

				const row = { ...create };

				table.set(where.roomId, row);
				return row;
			},
			async deleteMany({ where }) {
				const before = table.size;

				table.delete(where.roomId);
				return { count: before - table.size };
			}
		}
	};
};

const makeFakeClock = () => {
	let now = 0;
	let nextId = 0;
	const queue = [];

	const setTimeoutFn = (fn, delay) => {
		const handle = {
			id: ++nextId,
			fireAt: now + Math.max(0, delay || 0),
			fn,
			cancelled: false
		};

		queue.push(handle);
		return handle;
	};

	const clearTimeoutFn = (handle) => {
		if (handle) {
			handle.cancelled = true;
		}
	};

	const nextPending = () => {
		let best = null;

		for (const handle of queue) {
			if (handle.cancelled) {
				continue;
			}

			if (!best || handle.fireAt < best.fireAt) {
				best = handle;
			}
		}

		return best;
	};

	const removeHandle = (handle) => {
		const idx = queue.indexOf(handle);

		if (idx >= 0) {
			queue.splice(idx, 1);
		}
	};

	const advanceTo = async (targetMs) => {
		while (true) {
			const next = nextPending();

			if (!next || next.fireAt > targetMs) {
				break;
			}

			now = next.fireAt;
			next.cancelled = true;
			removeHandle(next);
			await next.fn();
			await new Promise((resolve) => setImmediate(resolve));
		}

		if (now < targetMs) {
			now = targetMs;
		}
	};

	return { setTimeoutFn, clearTimeoutFn, now: () => now, nextPending, advanceTo };
};

const fmtTime = (ms) => {
	const totalSeconds = Math.floor(ms / 1000);
	const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
	const ss = String(totalSeconds % 60).padStart(2, '0');
	const mmm = String(ms % 1000).padStart(3, '0');

	return `[${mm}:${ss}.${mmm}]`;
};

const describePlayer = (p) => `${p.name}[${p.role || 'lobby'}]${p.isAlive === false ? '†' : ''}`;

const describeAliveRoster = (session) => getAlivePlayers(session).map(describePlayer).join(', ');

const describeComposition = (composition) =>
	Object.entries(summariseComposition(composition))
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([role, count]) => `${role}×${count}`)
		.join(', ');

const describeEvent = (event) => {
	const { name, payload } = event;

	switch (name) {
		case EVENTS.PHASE_CHANGED:
			return `PHASE_CHANGED ${payload.previousPhase} → ${payload.phase} (timer=${payload.timerSec}s)`;

		case EVENTS.MORNING_REPORT:
			return (
				`MORNING killed=[${payload.killedIds.join(',')}] ` +
				`protected=[${payload.protectedIds.join(',')}] ` +
				`converted=[${payload.convertedIds.join(',')}] ` +
				`loverCascade=[${payload.loverCascadeIds.join(',')}] ` +
				`seerObs=${payload.seerObservations.length}`
			);

		case EVENTS.VOTING_OPENED:
			return `VOTING_OPENED candidates=${payload.candidates.length}`;

		case EVENTS.VOTING_CLOSED: {
			const entries = Object.entries(payload.tally || {})
				.map(([id, t]) => `${id}:${t.count}`)
				.join(', ');

			return (
				`VOTING_CLOSED lynched=${payload.lynchedId ?? 'none'} role=${payload.lynchedRole ?? '-'} ` +
				`draw=${payload.isDraw} noVotes=${payload.isNoVotes} tally={${entries}}`
			);
		}

		case EVENTS.WARNING:
			return `WARNING code=${payload.code}`;

		case EVENTS.GAME_ENDED:
			return `GAME_ENDED winner=${payload.winner ?? 'none'} reason=${payload.reason}`;

		default:
			return name;
	}
};

const describeAction = (session, action) => {
	if (action.type === 'lovers') {
		const [a, b] = action.targetIds;

		return `lovers → ${getPlayer(session, a)?.name ?? a} ❤ ${getPlayer(session, b)?.name ?? b}`;
	}

	if (action.type === 'peek') {
		return 'peek wolf chat';
	}

	const target = action.targetId ? getPlayer(session, action.targetId) : null;

	return `${action.type}${target ? ` → ${target.name}` : ''}`;
};

const actionTimeInWindow = (windowMs, index, total) => {
	const denom = Math.max(total, 1) + 1;
	const slot = windowMs / denom;
	const tentative = Math.floor(slot * (index + 1));

	return Math.min(Math.max(tentative, 200), windowMs - 200);
};

const injectNightActions = (clock, roomId, repo, session, windowMs, log) => {
	const alive = getAlivePlayers(session);
	const wolves = alive.filter((p) => isWolfRole(p.role));
	const nonWolves = alive.filter((p) => !isWolfRole(p.role));
	const victim = nonWolves[0] ?? null;

	const intents = [];

	if (victim && wolves.length > 0) {
		for (const wolf of wolves) {
			intents.push({ actor: wolf, action: { type: 'kill', actorId: wolf.id, targetId: victim.id } });
		}
	}

	const seer = alive.find((p) => p.role === 'seer');

	if (seer) {
		const target = alive.find((p) => p.id !== seer.id);

		if (target) {
			intents.push({ actor: seer, action: { type: 'seer', actorId: seer.id, targetId: target.id } });
		}
	}

	const guard = alive.find((p) => p.role === 'guard');

	if (guard) {
		const target = alive.find((p) => p.id !== guard.id);

		if (target) {
			intents.push({ actor: guard, action: { type: 'guard', actorId: guard.id, targetId: target.id } });
		}
	}

	if (session.firstNight) {
		const cupid = alive.find((p) => p.role === 'cupid');

		if (cupid) {
			const candidates = alive.filter((p) => p.id !== cupid.id);

			if (candidates.length >= 2) {
				intents.push({
					actor: cupid,
					action: { type: 'lovers', actorId: cupid.id, targetIds: [candidates[0].id, candidates[1].id] }
				});
			}
		}
	}

	const littleGirl = alive.find((p) => p.role === 'little-girl');

	if (littleGirl) {
		intents.push({ actor: littleGirl, action: { type: 'peek', actorId: littleGirl.id } });
	}

	const alpha = alive.find((p) => p.role === 'alpha-werewolf');

	if (alpha && !session.alphaConverted) {
		const convertTarget = nonWolves.find((p) => p.role === 'villager');

		if (convertTarget) {
			intents.push({
				actor: alpha,
				action: { type: 'convert', actorId: alpha.id, targetId: convertTarget.id }
			});
		}
	}

	intents.forEach(({ actor, action }, idx) => {
		const delay = actionTimeInWindow(windowMs, idx, intents.length);

		clock.setTimeoutFn(async () => {
			const live = await repo.load(roomId);

			if (!live || live.phase !== 'night') {
				return;
			}

			live.actionQueue.push(action);
			repo.save(live);

			log(`${fmtTime(clock.now())}     ⚡ ${actor.name}[${actor.role}] ${describeAction(live, action)}`);
		}, delay);
	});
};

const injectVotes = (clock, roomId, repo, session, windowMs, log) => {
	const alive = getAlivePlayers(session);
	const wolves = alive.filter((p) => isWolfRole(p.role));
	const nonWolves = alive.filter((p) => !isWolfRole(p.role));
	const wolfTarget = wolves[0];
	const villageTarget = nonWolves[0];

	alive.forEach((voter, idx) => {
		const target = isWolfRole(voter.role) ? villageTarget : wolfTarget;

		if (!target) {
			return;
		}

		const delay = actionTimeInWindow(windowMs, idx, alive.length);

		clock.setTimeoutFn(async () => {
			const live = await repo.load(roomId);

			if (!live || live.phase !== 'voting') {
				return;
			}

			live.playerVoted.push({
				voterId: voter.id,
				voterName: voter.name,
				targetId: target.id
			});
			repo.save(live);

			log(`${fmtTime(clock.now())}     🗳️  ${voter.name}[${voter.role}] votes ${target.name}`);
		}, delay);
	});
};

const injectHunterShots = (clock, roomId, repo, session, windowMs, log) => {
	const alive = getAlivePlayers(session);

	session.pendingShots.forEach((shot) => {
		if (shot.targetId !== null) {
			return;
		}

		const actor = getPlayer(session, shot.actorId);
		const priority = alive.find((p) => p.id !== shot.actorId && isWolfRole(p.role));
		const fallback = alive.find((p) => p.id !== shot.actorId);
		const target = priority ?? fallback;

		if (!target) {
			return;
		}

		const delay = Math.min(Math.max(Math.floor(windowMs / 2), 500), windowMs - 500);

		clock.setTimeoutFn(async () => {
			const live = await repo.load(roomId);

			if (!live || live.phase !== 'hunterShoot') {
				return;
			}

			const pending = live.pendingShots.find((s) => s.actorId === shot.actorId && s.targetId === null);

			if (pending) {
				pending.targetId = target.id;
				repo.save(live);
			}

			log(`${fmtTime(clock.now())}     🏹 ${actor?.name ?? shot.actorId}[hunter†] shoots ${target.name}[${target.role}]`);
		}, delay);
	});
};

const runScenario = async (N) => {
	const roomId = `group-${N}@g.us`;
	const log = (msg) => console.log(msg);

	const prisma = makeFakePrisma();
	const cache = new Cache();
	const clock = makeFakeClock();
	const repo = makeRepository({ prisma, cache, debounceMs: 1, now: () => clock.now() });
	const rng = makeRng(N * 31 + 7);

	const emitted = [];
	const emit = (name, payload) => emitted.push({ name, payload, at: clock.now() });

	const scheduler = makeScheduler({
		repository: repo,
		emit,
		rng,
		setTimeoutFn: clock.setTimeoutFn,
		clearTimeoutFn: clock.clearTimeoutFn
	});

	const lobbyEvents = { autoStart: false, disband: false };

	const lobbyTimer = makeLobbyTimer({
		repository: repo,
		onAutoStart: () => {
			lobbyEvents.autoStart = true;
			log(`${fmtTime(clock.now())} ⏰ LOBBY_TIMEOUT — lobby was ready, auto-starting`);
		},
		onDisband: () => {
			lobbyEvents.disband = true;
			log(`${fmtTime(clock.now())} ⏰ LOBBY_TIMEOUT — lobby short of players, disbanding`);
		},
		setTimeoutFn: clock.setTimeoutFn,
		clearTimeoutFn: clock.clearTimeoutFn
	});

	const composition = buildComposition(N);

	log('');
	log('════════════════════════════════════════════════════════════════════════');
	log(`  REALISTIC WEREWOLF FLOW · N=${N}`);
	log(`  composition: ${describeComposition(composition)}`);
	log(`  room=${roomId} · lobby-timeout=${LOBBY_TIMEOUT_MS / 1000}s`);
	log('════════════════════════════════════════════════════════════════════════');

	log(`${fmtTime(clock.now())} 📣 P0 runs !wolf newgame (room master opens lobby)`);

	const session = createSession({
		roomId,
		roomMaster: 'p0@s',
		roomMasterName: 'P0',
		now: () => clock.now()
	});

	repo.save(session);
	lobbyTimer.start(session.roomId, LOBBY_TIMEOUT_MS);

	log(`${fmtTime(clock.now())}    ✔ P0 in lobby (1/${N})`);

	for (let i = 1; i < N; i += 1) {
		const gap = JOIN_GAP_MS + Math.floor(rng() * JOIN_JITTER_MS);

		await clock.advanceTo(clock.now() + gap);

		const result = addPlayer(session, { id: `p${i}@s`, name: `P${i}` });

		assert.equal(result.ok, true, `player P${i} must join successfully`);
		repo.save(session);

		log(`${fmtTime(clock.now())} 👋 P${i} runs !wolf join — roster ${session.playersData.length}/${N}`);
	}

	await clock.advanceTo(clock.now() + PRE_START_DELAY_MS);

	log('');
	log(`${fmtTime(clock.now())} 🎬 P0 runs !wolf start (room master starts the game)`);

	assert.equal(isLobbyReady(session), true);

	lobbyTimer.stop(session.roomId);
	dealRoles(session, composition, rng);
	setPhase(session, 'deal');
	session.gameTimeStarted = clock.now();
	repo.save(session);

	log(`${fmtTime(clock.now())}    ✔ lobby timer cancelled, roles dealt, phase=deal`);

	for (const player of session.playersData) {
		log(`${fmtTime(clock.now())}      ${player.name} ← ${player.role}`);
	}

	scheduler.start(session.roomId, 0);
	log(`${fmtTime(clock.now())} ▶️  Scheduler started — first tick in 0s`);

	let ticks = 0;
	let lastWinner = null;

	while (session.phase !== 'ended' && ticks < MAX_SIM_TICKS) {
		ticks += 1;

		const next = clock.nextPending();

		if (!next) {
			log(`${fmtTime(clock.now())} ⚠ scheduler queue empty but phase=${session.phase}`);
			break;
		}

		const phaseBeforeTick = session.phase;
		const windowMs = next.fireAt - clock.now();

		log('');
		log(
			`${fmtTime(clock.now())} ━━ tick ${ticks} · phase=${phaseBeforeTick} ` +
				`· alive=${getAlivePlayers(session).length}/${session.playersData.length} ` +
				`· firstNight=${session.firstNight} · nextTickIn=${windowMs}ms (≈${Math.round(windowMs / 1000)}s)`
		);
		log(`${fmtTime(clock.now())}    roster: ${describeAliveRoster(session)}`);

		if (phaseBeforeTick === 'night' && windowMs > 400) {
			injectNightActions(clock, roomId, repo, session, windowMs, log);
		} else if (phaseBeforeTick === 'voting' && windowMs > 400) {
			injectVotes(clock, roomId, repo, session, windowMs, log);
		} else if (phaseBeforeTick === 'hunterShoot' && windowMs > 400) {
			injectHunterShots(clock, roomId, repo, session, windowMs, log);
		}

		const eventCountBefore = emitted.length;

		await clock.advanceTo(next.fireAt);

		for (let i = eventCountBefore; i < emitted.length; i += 1) {
			const event = emitted[i];

			log(`${fmtTime(event.at)}   ▸ ${describeEvent(event)}`);

			if (event.name === EVENTS.GAME_ENDED) {
				lastWinner = event.payload.winner;
			}
		}
	}

	log('');
	log(
		`${fmtTime(clock.now())} ═══ FINAL · phase=${session.phase} · winner=${lastWinner ?? 'none'} ` +
			`· ticks=${ticks} · emitted=${emitted.length}`
	);
	log(`${fmtTime(clock.now())}     survivors: ${describeAliveRoster(session) || '(none)'}`);
	log(`${fmtTime(clock.now())}     dead:      ${session.playersDead.map(describePlayer).join(', ') || '(none)'}`);
	log('');

	await repo.flushAll().catch(() => {});
	scheduler.stopAll();
	lobbyTimer.stopAll();

	return { session, ticks, lastWinner, lobbyEvents, emitted };
};

describe('werewolf realistic full flow (newgame → join → start → cycle with real timers)', () => {
	for (let N = MIN_PLAYERS; N <= MAX_PLAYERS; N += 1) {
		it(`N=${N}: simulates the complete game over real phase timers`, async () => {
			const { session, ticks, lastWinner, lobbyEvents, emitted } = await runScenario(N);

			assert.equal(
				session.phase,
				'ended',
				`game did not reach 'ended' within budget (N=${N}, ticks=${ticks}, phase=${session.phase})`
			);
			assert.ok(ticks > 0, 'at least one phase tick must have fired');
			assert.ok(ticks < MAX_SIM_TICKS, `tick budget exhausted (N=${N}, ticks=${ticks})`);

			assert.equal(lobbyEvents.autoStart, false, 'lobby auto-start must not fire in happy path');
			assert.equal(lobbyEvents.disband, false, 'lobby disband must not fire in happy path');

			assert.ok(lastWinner === null || VALID_WINNERS.has(lastWinner), `invalid winner "${lastWinner}" for N=${N}`);

			assert.equal(session.actionQueue.length, 0, 'action queue must be drained when game ends');
			assert.equal(session.pendingShots.length, 0, 'no hunter shots may dangle when game ends');

			assert.ok(
				session.playersData.every((p) => typeof p.role === 'string' && p.role.length > 0),
				'every player must have a role assigned'
			);

			assert.equal(session.playersData.length, N, `player count must match N (${N})`);

			assert.ok(
				emitted.some((e) => e.name === EVENTS.PHASE_CHANGED && e.payload.phase === 'night'),
				'a phase transition into night must have been emitted'
			);
			assert.ok(
				emitted.some((e) => e.name === EVENTS.VOTING_OPENED),
				'voting must have opened at least once'
			);
			assert.ok(
				emitted.some((e) => e.name === EVENTS.GAME_ENDED),
				'a GAME_ENDED event must have been emitted'
			);
		});
	}
});
