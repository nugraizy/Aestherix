import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { addPlayer, createSession, dealRoles, getPlayer, markDead, setPhase } from '../../../../../src/utils/games/werewolf/state/session.js';
import { advancePhase } from '../../../../../src/utils/games/werewolf/logic/phases.js';
import { buildComposition } from '../../../../../src/utils/games/werewolf/config/balance.js';
import { EVENTS } from '../../../../../src/utils/games/werewolf/events.js';
import { AFK_LIMIT } from '../../../../../src/utils/games/werewolf/config/constants.js';

const makeSession = (N, composition) => {
	const s = createSession({ roomId: `r-${N}`, roomMaster: 'p0@s', roomMasterName: 'P0', now: () => 0 });

	for (let i = 1; i < N; i += 1) {
		addPlayer(s, { id: `p${i}@s`, name: `P${i}` });
	}

	const comp = composition ?? buildComposition(N);

	dealRoles(s, comp, () => 0);
	setPhase(s, 'deal');
	s.gameTimeStarted = 0;
	return s;
};

const names = (events) => events.map((e) => e.name);

describe('werewolf phase machine', () => {
	it('lobby does not auto-advance', () => {
		const s = createSession({ roomId: 'r', roomMaster: 'p0@s', roomMasterName: 'P0' });

		const r = advancePhase(s);

		assert.equal(s.phase, 'lobby');
		assert.deepEqual(r.events, []);
	});

	it('deal transitions straight to night and emits phaseChanged', () => {
		const s = makeSession(5);

		const r = advancePhase(s);

		assert.equal(s.phase, 'night');
		assert.ok(names(r.events).includes(EVENTS.PHASE_CHANGED));
		assert.ok(r.nextTimerSec > 0);
	});

	it('night with no queued actions emits a warning but no AFK bump', () => {
		const s = makeSession(5);

		setPhase(s, 'night');

		const before = s.gameAfk;
		const r = advancePhase(s);

		assert.ok(names(r.events).includes(EVENTS.WARNING));
		assert.equal(s.gameAfk, before, 'night idle must not increment AFK');
		assert.equal(s.phase, 'day');
	});

	it('night → morningReport + phaseChanged when no hunters died', () => {
		const s = makeSession(7);

		setPhase(s, 'night');

		s.actionQueue = [{ type: 'kill', actorId: s.playersData.find((p) => p.role === 'werewolf').id, targetId: 'p1@s' }];

		const r = advancePhase(s);

		const eventNames = names(r.events);

		assert.ok(eventNames.includes(EVENTS.MORNING_REPORT));
		assert.ok(eventNames.includes(EVENTS.PHASE_CHANGED));
		assert.equal(s.phase, 'day');
	});

	it('night detours to hunterShoot when the hunter dies', () => {
		const s = makeSession(10);

		setPhase(s, 'night');

		const hunter = s.playersData.find((p) => p.role === 'hunter');
		const wolf = s.playersData.find((p) => p.role === 'werewolf');

		s.actionQueue = [{ type: 'kill', actorId: wolf.id, targetId: hunter.id }];

		const r = advancePhase(s);

		assert.equal(s.phase, 'hunterShoot');
		assert.equal(s.pendingShots.length, 1);
		assert.ok(names(r.events).includes(EVENTS.PHASE_CHANGED));
		assert.equal(r.events.find((e) => e.name === EVENTS.PHASE_CHANGED).payload.phase, 'hunterShoot');
	});

	it('hunterShoot executes a targeted shot and returns to the source phase', () => {
		const s = makeSession(10);

		setPhase(s, 'hunterShoot');

		const hunter = s.playersData.find((p) => p.role === 'hunter');
		const victim = s.playersData.find((p) => p.id !== hunter.id && p.isAlive && p.role !== 'werewolf');

		s.pendingShots = [{ actorId: hunter.id, targetId: victim.id }];
		s.hunterRevengeSourcePhase = 'night';

		const r = advancePhase(s);

		assert.equal(getPlayer(s, victim.id).isAlive, false);
		assert.equal(s.phase, 'day');
		assert.equal(s.pendingShots.length, 0);
		assert.ok(names(r.events).includes(EVENTS.PHASE_CHANGED));
	});

	it('hunterShoot with a null target simply returns without kills', () => {
		const s = makeSession(10);

		setPhase(s, 'hunterShoot');

		const hunter = s.playersData.find((p) => p.role === 'hunter');

		s.pendingShots = [{ actorId: hunter.id, targetId: null }];
		s.hunterRevengeSourcePhase = 'voting';

		const before = s.playersData.filter((p) => p.isAlive).length;
		const r = advancePhase(s);
		const after = s.playersData.filter((p) => p.isAlive).length;

		assert.equal(before, after);
		assert.equal(s.phase, 'night');
		assert.ok(names(r.events).includes(EVENTS.PHASE_CHANGED));
	});

	it('day → voting emits votingOpened with alive candidates', () => {
		const s = makeSession(5);

		setPhase(s, 'day');

		const r = advancePhase(s);

		assert.equal(s.phase, 'voting');
		assert.ok(names(r.events).includes(EVENTS.VOTING_OPENED));

		const candidates = r.events.find((e) => e.name === EVENTS.VOTING_OPENED).payload.candidates;

		assert.equal(candidates.length, 5);
	});

	it('voting increments AFK counter on zero votes and ends game at limit', () => {
		const s = makeSession(5);

		setPhase(s, 'voting');

		s.gameAfk = AFK_LIMIT - 1;
		s.playerVoted = [];

		const r = advancePhase(s);

		assert.equal(s.phase, 'ended');
		assert.ok(names(r.events).includes(EVENTS.GAME_ENDED));

		const gameOver = r.events.find((e) => e.name === EVENTS.GAME_ENDED);

		assert.equal(gameOver.payload.reason, 'afk');
	});

	it('voting with a clear winner lynches and moves to next night', () => {
		const s = makeSession(7);

		setPhase(s, 'voting');

		const target = s.playersData.find((p) => p.role === 'villager' && p.isAlive);

		s.playerVoted = [
			{ voterId: 'p0@s', voterName: 'P0', targetId: target.id },
			{ voterId: 'p2@s', voterName: 'P2', targetId: target.id },
			{ voterId: 'p3@s', voterName: 'P3', targetId: target.id }
		];

		const r = advancePhase(s);

		assert.ok(names(r.events).includes(EVENTS.VOTING_CLOSED));
		assert.equal(getPlayer(s, target.id).isAlive, false);
		assert.equal(s.gameAfk, 0);
	});

	it('win detection short-circuits to ended before scheduling the next phase', () => {
		const s = makeSession(5);

		setPhase(s, 'night');

		const wolf = s.playersData.find((p) => p.role === 'werewolf');

		for (const p of s.playersData) {
			if (p.id !== wolf.id && p.role !== 'seer') {
				markDead(s, p.id);
			}
		}

		const seer = s.playersData.find((p) => p.role === 'seer');

		s.actionQueue = [{ type: 'kill', actorId: wolf.id, targetId: seer.id }];

		const r = advancePhase(s);

		assert.equal(s.phase, 'ended');
		assert.equal(r.winner, 'werewolf');
		assert.ok(names(r.events).includes(EVENTS.GAME_ENDED));
	});

	it('ended is terminal', () => {
		const s = makeSession(5);

		setPhase(s, 'ended');

		const r = advancePhase(s);

		assert.deepEqual(r.events, []);
		assert.equal(r.winner, null);
	});
});
