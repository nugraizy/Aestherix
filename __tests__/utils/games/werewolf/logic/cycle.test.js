/**
 * End-to-end werewolf cycle integration test.
 *
 * Drives a full game through every phase transition — deal → night → (hunterShoot) →
 * day → voting → night → ... → ended — for every supported player count
 * (MIN_PLAYERS through MAX_PLAYERS). The test queues actions with a simple
 * deterministic strategy (wolves kill the first alive non-wolf, every village
 * role targets the first alive wolf) and asserts the cycle terminates in an
 * 'ended' phase with a valid winner.
 *
 * Every phase, action, and emitted event is logged so the spec reporter
 * output shows the complete play-by-play of each game.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { advancePhase } from '../../../../../src/utils/games/werewolf/logic/phases.js';
import { buildComposition, summariseComposition } from '../../../../../src/utils/games/werewolf/config/balance.js';
import { EVENTS } from '../../../../../src/utils/games/werewolf/events.js';
import { MAX_PLAYERS, MIN_PLAYERS } from '../../../../../src/utils/games/werewolf/config/constants.js';
import {
	addPlayer,
	createSession,
	dealRoles,
	getAlivePlayers,
	getPlayer,
	isWolfRole,
	setPhase
} from '../../../../../src/utils/games/werewolf/state/session.js';

const MAX_TICKS = 200;
const VALID_WINNERS = new Set(['village', 'werewolf', 'lovers', 'jester']);

const makeRng = (seed) => {
	let state = Math.abs(seed) % 2147483647 || 1;

	return () => {
		state = (state * 48271) % 2147483647;
		return state / 2147483647;
	};
};

const buildLobby = (N, rng) => {
	const session = createSession({
		roomId: `room-${N}`,
		roomMaster: 'p0@s',
		roomMasterName: 'P0',
		now: () => 0
	});

	for (let i = 1; i < N; i += 1) {
		addPlayer(session, { id: `p${i}@s`, name: `P${i}` });
	}

	const composition = buildComposition(N);

	dealRoles(session, composition, rng);
	setPhase(session, 'deal');
	session.gameTimeStarted = 0;

	return { session, composition };
};

const describePlayer = (player) => `${player.name}[${player.role}]${player.isAlive ? '' : '†'}`;

const describeComposition = (composition) => {
	const counts = summariseComposition(composition);

	return Object.entries(counts)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([role, count]) => `${role}×${count}`)
		.join(', ');
};

const describeAlive = (session) =>
	getAlivePlayers(session)
		.map((p) => describePlayer(p))
		.join(', ');

const describeEvent = (event) => {
	const { name, payload } = event;

	switch (name) {
		case EVENTS.PHASE_CHANGED:
			return `  ▸ PHASE_CHANGED ${payload.previousPhase} → ${payload.phase} (timer=${payload.timerSec}s)`;

		case EVENTS.MORNING_REPORT:
			return (
				`  ▸ MORNING_REPORT killed=[${payload.killedIds.join(',')}] ` +
				`protected=[${payload.protectedIds.join(',')}] ` +
				`converted=[${payload.convertedIds.join(',')}] ` +
				`loverCascade=[${payload.loverCascadeIds.join(',')}] ` +
				`seerObs=${payload.seerObservations.length}`
			);

		case EVENTS.VOTING_OPENED:
			return `  ▸ VOTING_OPENED candidates=${payload.candidates.length}`;

		case EVENTS.VOTING_CLOSED: {
			const entries = Object.entries(payload.tally || {})
				.map(([id, t]) => `${id}:${t.count}`)
				.join(', ');

			return (
				`  ▸ VOTING_CLOSED lynched=${payload.lynchedId ?? 'none'} ` +
				`role=${payload.lynchedRole ?? '-'} draw=${payload.isDraw} ` +
				`noVotes=${payload.isNoVotes} tally={${entries}}`
			);
		}

		case EVENTS.WARNING:
			return `  ▸ WARNING code=${payload.code}`;

		case EVENTS.GAME_ENDED:
			return (
				`  ▸ GAME_ENDED winner=${payload.winner ?? 'none'} reason=${payload.reason} ` +
				`survivors=${payload.stats.players.filter((p) => p.isAlive).length}/${payload.stats.players.length}`
			);

		default:
			return `  ▸ ${name}`;
	}
};

const queueNightActions = (session, log) => {
	const alive = getAlivePlayers(session);
	const wolves = alive.filter((p) => isWolfRole(p.role));
	const nonWolves = alive.filter((p) => !isWolfRole(p.role));

	if (wolves.length > 0 && nonWolves.length > 0) {
		const victim = nonWolves[0];

		for (const wolf of wolves) {
			session.actionQueue.push({ type: 'kill', actorId: wolf.id, targetId: victim.id });
		}

		log(`    wolves [${wolves.map((w) => w.name).join(',')}] target ${victim.name}[${victim.role}]`);
	}

	const seer = alive.find((p) => p.role === 'seer');

	if (seer) {
		const target = alive.find((p) => p.id !== seer.id);

		if (target) {
			session.actionQueue.push({ type: 'seer', actorId: seer.id, targetId: target.id });
			log(`    seer ${seer.name} inspects ${target.name}`);
		}
	}

	const guard = alive.find((p) => p.role === 'guard');

	if (guard) {
		const target = alive.find((p) => p.id !== guard.id);

		if (target) {
			session.actionQueue.push({ type: 'guard', actorId: guard.id, targetId: target.id });
			log(`    guard ${guard.name} protects ${target.name}`);
		}
	}

	if (session.firstNight) {
		const cupid = alive.find((p) => p.role === 'cupid');

		if (cupid) {
			const candidates = alive.filter((p) => p.id !== cupid.id);

			if (candidates.length >= 2) {
				session.actionQueue.push({
					type: 'lovers',
					actorId: cupid.id,
					targetIds: [candidates[0].id, candidates[1].id]
				});
				log(`    cupid ${cupid.name} binds ${candidates[0].name} ❤ ${candidates[1].name}`);
			}
		}
	}

	const littleGirl = alive.find((p) => p.role === 'little-girl');

	if (littleGirl) {
		session.actionQueue.push({ type: 'peek', actorId: littleGirl.id });
		log(`    little-girl ${littleGirl.name} peeks the wolf chat`);
	}

	const alpha = alive.find((p) => p.role === 'alpha-werewolf');

	if (alpha && !session.alphaConverted) {
		const convertTarget = nonWolves.find((p) => p.role === 'villager');

		if (convertTarget) {
			session.actionQueue.push({ type: 'convert', actorId: alpha.id, targetId: convertTarget.id });
			log(`    alpha ${alpha.name} attempts to convert ${convertTarget.name}`);
		}
	}
};

const queueVotes = (session, log) => {
	const alive = getAlivePlayers(session);
	const wolves = alive.filter((p) => isWolfRole(p.role));
	const nonWolves = alive.filter((p) => !isWolfRole(p.role));

	const wolfTarget = wolves[0];
	const villageTarget = nonWolves[0];

	for (const voter of alive) {
		const target = isWolfRole(voter.role) ? villageTarget : wolfTarget;

		if (!target) {
			continue;
		}

		session.playerVoted.push({
			voterId: voter.id,
			voterName: voter.name,
			targetId: target.id
		});
	}

	const firstTarget = wolfTarget?.name ?? '(none)';
	const counterTarget = villageTarget?.name ?? '(none)';

	log(`    village → ${firstTarget} · wolves → ${counterTarget} (total votes=${session.playerVoted.length})`);
};

const prepareHunterShot = (session, log) => {
	const alive = getAlivePlayers(session);

	for (const shot of session.pendingShots) {
		if (shot.targetId !== null) {
			continue;
		}

		const actor = getPlayer(session, shot.actorId);
		const priority = alive.find((p) => p.id !== shot.actorId && isWolfRole(p.role));
		const fallback = alive.find((p) => p.id !== shot.actorId);
		const target = priority ?? fallback;

		if (target) {
			shot.targetId = target.id;
			log(`    hunter ${actor?.name ?? shot.actorId} shoots ${target.name}[${target.role}]`);
		}
	}
};

const driveGame = (session, rng, log) => {
	let tick = 0;
	let lastWinner = null;

	while (session.phase !== 'ended' && tick < MAX_TICKS) {
		tick += 1;

		const alive = getAlivePlayers(session);

		log(
			`\n── TICK ${tick} · phase=${session.phase} · alive=${alive.length}/${session.playersData.length} ` +
				`· afk=${session.gameAfk} · firstNight=${session.firstNight}`
		);
		log(`   roster: ${describeAlive(session)}`);

		switch (session.phase) {
			case 'night':
				queueNightActions(session, log);
				break;

			case 'voting':
				queueVotes(session, log);
				break;

			case 'hunterShoot':
				prepareHunterShot(session, log);
				break;

			default:
				break;
		}

		const result = advancePhase(session, { rng });

		for (const event of result.events) {
			log(describeEvent(event));
		}

		if (result.winner) {
			lastWinner = result.winner;
			log(`  ★ WINNER: ${result.winner}`);
		}
	}

	return { tick, lastWinner };
};

const runCycleForN = (N) => {
	const rng = makeRng(N * 31 + 7);
	const { session, composition } = buildLobby(N, rng);
	const log = (msg) => console.log(msg);

	log('');
	log('════════════════════════════════════════════════════════════════════');
	log(`  WEREWOLF CYCLE · N=${N}`);
	log(`  composition: ${describeComposition(composition)}`);
	log(`  roster: ${session.playersData.map((p) => describePlayer(p)).join(', ')}`);
	log('════════════════════════════════════════════════════════════════════');

	const { tick, lastWinner } = driveGame(session, rng, log);

	log('');
	log(`── FINAL · phase=${session.phase} · ticks=${tick} · winner=${lastWinner ?? 'none'}`);
	log(`   survivors: ${describeAlive(session) || '(none)'}`);
	log(`   dead:      ${session.playersDead.map(describePlayer).join(', ') || '(none)'}`);
	log('');

	return { session, tick, lastWinner };
};

describe('werewolf full cycle integration', () => {
	for (let N = MIN_PLAYERS; N <= MAX_PLAYERS; N += 1) {
		it(`runs a complete game cycle with N=${N} players`, () => {
			const { session, tick, lastWinner } = runCycleForN(N);

			assert.equal(
				session.phase,
				'ended',
				`game did not reach 'ended' within tick budget (N=${N}, ticks=${tick}, phase=${session.phase})`
			);
			assert.ok(tick > 0, 'driver must perform at least one tick');
			assert.ok(tick < MAX_TICKS, `driver exhausted its tick budget (N=${N}, ticks=${tick})`);

			assert.ok(
				lastWinner === null || VALID_WINNERS.has(lastWinner),
				`unexpected winner "${lastWinner}" for N=${N}`
			);

			const allAssigned = session.playersData.every((p) => typeof p.role === 'string' && p.role.length > 0);

			assert.ok(allAssigned, 'every player must have a role assigned');

			assert.equal(
				session.playersData.length,
				N,
				`player count must match N (expected ${N}, got ${session.playersData.length})`
			);

			assert.equal(session.actionQueue.length, 0, 'action queue must be drained when the game ends');
			assert.equal(session.pendingShots.length, 0, 'no hunter shots may dangle when the game ends');
		});
	}
});
