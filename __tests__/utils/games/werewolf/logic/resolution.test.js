import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { queueAction, resolveNight } from '../../../../../src/utils/games/werewolf/logic/resolution.js';
import { addPlayer, createSession, getPlayer, setPhase } from '../../../../../src/utils/games/werewolf/state/session.js';

const makeGame = (composition) => {
	const s = createSession({ roomId: 'r', roomMaster: 'p0@s', roomMasterName: 'P0', now: () => 0 });

	for (let i = 1; i < composition.length; i += 1) {
		addPlayer(s, { id: `p${i}@s`, name: `P${i}` });
	}

	s.playersData.forEach((p, i) => {
		p.role = composition[i];
	});

	setPhase(s, 'night');
	return s;
};

const by = (s, id) => getPlayer(s, id);

describe('werewolf night resolution', () => {
	it('guard protection blocks the wolf kill', () => {
		const s = makeGame(['werewolf', 'guard', 'seer', 'villager', 'villager']);

		queueAction(s, { type: 'kill', actorId: 'p0@s', targetId: 'p3@s' });
		queueAction(s, { type: 'guard', actorId: 'p1@s', targetId: 'p3@s' });

		const r = resolveNight(s);

		assert.deepEqual(r.killedIds, []);
		assert.deepEqual(r.protectedIds, ['p3@s']);
		assert.equal(by(s, 'p3@s').isAlive, true);
	});

	it('witch heal cancels a wolf kill exactly once per game', () => {
		const s = makeGame(['werewolf', 'witch', 'villager', 'villager', 'villager', 'villager', 'villager', 'seer']);

		queueAction(s, { type: 'kill', actorId: 'p0@s', targetId: 'p2@s' });
		queueAction(s, { type: 'heal', actorId: 'p1@s', targetId: 'p2@s' });

		const r1 = resolveNight(s);

		assert.deepEqual(r1.killedIds, []);
		assert.equal(s.witchState.healUsed, true);

		s.actionQueue = [];
		queueAction(s, { type: 'kill', actorId: 'p0@s', targetId: 'p3@s' });
		queueAction(s, { type: 'heal', actorId: 'p1@s', targetId: 'p3@s' });

		const r2 = resolveNight(s);

		assert.deepEqual(r2.killedIds, ['p3@s']);
	});

	it('witch poison adds a second death that heal cannot save', () => {
		const s = makeGame(['werewolf', 'witch', 'villager', 'villager', 'villager', 'villager', 'villager', 'seer']);

		queueAction(s, { type: 'kill', actorId: 'p0@s', targetId: 'p3@s' });
		queueAction(s, { type: 'heal', actorId: 'p1@s', targetId: 'p3@s' });
		queueAction(s, { type: 'poison', actorId: 'p1@s', targetId: 'p4@s' });

		const r = resolveNight(s);

		assert.deepEqual(r.killedIds.sort(), ['p4@s']);
		assert.equal(s.witchState.poisonUsed, true);
	});

	it('werewolves aggregate votes so a majority kill wins', () => {
		const s = makeGame([
			'werewolf',
			'werewolf',
			'alpha-werewolf',
			'seer',
			'guard',
			'witch',
			'hunter',
			'cupid',
			'little-girl',
			'villager'
		]);

		queueAction(s, { type: 'kill', actorId: 'p0@s', targetId: 'p3@s' });
		queueAction(s, { type: 'kill', actorId: 'p1@s', targetId: 'p3@s' });
		queueAction(s, { type: 'kill', actorId: 'p2@s', targetId: 'p4@s' });

		const r = resolveNight(s);

		assert.deepEqual(r.killedIds, ['p3@s']);
	});

	it('alpha wolf converts a villager once across the whole game', () => {
		const s = makeGame(['alpha-werewolf', 'werewolf', 'seer', 'guard', 'villager', 'witch', 'hunter', 'cupid', 'little-girl']);

		queueAction(s, { type: 'convert', actorId: 'p0@s', targetId: 'p4@s' });

		const r1 = resolveNight(s);

		assert.deepEqual(r1.convertedIds, ['p4@s']);
		assert.equal(by(s, 'p4@s').role, 'werewolf');

		s.actionQueue = [];
		queueAction(s, { type: 'convert', actorId: 'p0@s', targetId: 'p5@s' });

		const r2 = resolveNight(s);

		assert.deepEqual(r2.convertedIds, []);
	});

	it('seer observation is deterministic', () => {
		const s = makeGame(['werewolf', 'seer', 'villager', 'villager', 'villager']);

		queueAction(s, { type: 'seer', actorId: 'p1@s', targetId: 'p0@s' });

		const r = resolveNight(s);

		assert.deepEqual(r.seerObservations, [{ seerId: 'p1@s', targetId: 'p0@s', role: 'werewolf' }]);
	});

	it('little girl catch chance kills her when rng falls below the threshold', () => {
		const s = makeGame([
			'werewolf',
			'seer',
			'guard',
			'witch',
			'hunter',
			'cupid',
			'little-girl',
			'villager',
			'villager',
			'villager'
		]);

		queueAction(s, { type: 'peek', actorId: 'p6@s' });

		const caught = resolveNight(s, { rng: () => 0 });

		assert.ok(caught.killedIds.includes('p6@s'));
	});

	it('little girl survives when rng is above the threshold', () => {
		const s = makeGame([
			'werewolf',
			'seer',
			'guard',
			'witch',
			'hunter',
			'cupid',
			'little-girl',
			'villager',
			'villager',
			'villager'
		]);

		queueAction(s, { type: 'peek', actorId: 'p6@s' });

		const safe = resolveNight(s, { rng: () => 0.99 });

		assert.ok(!safe.killedIds.includes('p6@s'));
	});

	it('cupid binds lovers on the first night only', () => {
		const s = makeGame(['werewolf', 'cupid', 'villager', 'villager', 'villager', 'villager', 'villager', 'seer']);

		queueAction(s, { type: 'lovers', actorId: 'p1@s', targetIds: ['p2@s', 'p3@s'] });

		const r = resolveNight(s);

		assert.deepEqual(r.loverCascadeIds, []);
		assert.deepEqual(s.loverIds, ['p2@s', 'p3@s']);
	});

	it('lover cascade kills the second lover when the first dies', () => {
		const s = makeGame(['werewolf', 'cupid', 'villager', 'villager', 'villager', 'villager', 'villager', 'seer']);

		queueAction(s, { type: 'lovers', actorId: 'p1@s', targetIds: ['p2@s', 'p3@s'] });

		resolveNight(s);

		s.firstNight = false;

		queueAction(s, { type: 'kill', actorId: 'p0@s', targetId: 'p2@s' });

		const r = resolveNight(s);

		assert.ok(r.killedIds.includes('p2@s'));
		assert.ok(r.loverCascadeIds.includes('p3@s'));
		assert.equal(by(s, 'p3@s').isAlive, false);
	});

	it('hunter death queues a pending shot without firing it during the night', () => {
		const s = makeGame([
			'werewolf',
			'seer',
			'guard',
			'witch',
			'hunter',
			'cupid',
			'little-girl',
			'villager',
			'villager',
			'villager'
		]);

		queueAction(s, { type: 'kill', actorId: 'p0@s', targetId: 'p4@s' });

		const r = resolveNight(s);

		assert.ok(r.killedIds.includes('p4@s'));
		assert.deepEqual(s.pendingShots, [{ actorId: 'p4@s', targetId: null }]);
	});

	it('resolves into an empty queue for the next round', () => {
		const s = makeGame(['werewolf', 'seer', 'villager', 'villager', 'villager']);

		queueAction(s, { type: 'kill', actorId: 'p0@s', targetId: 'p2@s' });
		resolveNight(s);

		assert.deepEqual(s.actionQueue, []);
	});
});
