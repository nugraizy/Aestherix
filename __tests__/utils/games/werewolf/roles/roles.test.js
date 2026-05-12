import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { addPlayer, createSession, getPlayer, setPhase } from '../../../../../src/utils/games/werewolf/state/session.js';
import { buildComposition } from '../../../../../src/utils/games/werewolf/config/balance.js';
import { getRoleModule } from '../../../../../src/utils/games/werewolf/roles/index.js';

const makeSession = (composition) => {
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

describe('role: guard — no-repeat target rule', () => {
	it('accepts a target the first night and records it', () => {
		const s = makeSession(['werewolf', 'guard', 'seer', 'villager', 'villager']);
		const mod = getRoleModule('guard');

		const r = mod.execute({ type: 'guard', actorId: 'p1@s', targetId: 'p2@s' }, s);

		assert.equal(r.ok, true);
		assert.equal(s.guardLastTargetId, 'p2@s');
		assert.equal(getPlayer(s, 'p1@s').isAction, true);
	});

	it('rejects guarding the same player twice in a row', () => {
		const s = makeSession(['werewolf', 'guard', 'seer', 'villager', 'villager']);
		const mod = getRoleModule('guard');

		s.guardLastTargetId = 'p2@s';

		const r = mod.validate({ type: 'guard', actorId: 'p1@s', targetId: 'p2@s' }, s);

		assert.equal(r.ok, false);
		assert.equal(r.reason, 'guardRepeatTarget');
	});
});

describe('role: witch — heal/poison lifetime caps', () => {
	const composition = ['werewolf', 'witch', 'villager', 'villager', 'seer', 'villager', 'villager', 'guard'];

	it('allows one heal then rejects a second', () => {
		const s = makeSession(composition);
		const mod = getRoleModule('witch');

		const r1 = mod.execute({ type: 'heal', actorId: 'p1@s', targetId: 'p2@s' }, s);

		assert.equal(r1.ok, true);
		assert.equal(s.witchState.healUsed, false, 'heal is flagged at resolution, not submission');

		s.witchState.healUsed = true;
		getPlayer(s, 'p1@s').isAction = false;

		const r2 = mod.validate({ type: 'heal', actorId: 'p1@s', targetId: 'p3@s' }, s);

		assert.equal(r2.ok, false);
		assert.equal(r2.reason, 'witchHealUsed');
	});

	it('allows one poison then rejects a second', () => {
		const s = makeSession(composition);
		const mod = getRoleModule('witch');

		s.witchState.poisonUsed = true;

		const r = mod.validate({ type: 'poison', actorId: 'p1@s', targetId: 'p2@s' }, s);

		assert.equal(r.ok, false);
		assert.equal(r.reason, 'witchPoisonUsed');
	});
});

describe('role: cupid — first night only', () => {
	const composition = ['werewolf', 'cupid', 'villager', 'villager', 'seer', 'villager', 'villager', 'guard'];

	it('allows binding on the first night', () => {
		const s = makeSession(composition);
		const mod = getRoleModule('cupid');

		const r = mod.execute({ type: 'lovers', actorId: 'p1@s', targetIds: ['p2@s', 'p3@s'] }, s);

		assert.equal(r.ok, true);
	});

	it('rejects on subsequent nights', () => {
		const s = makeSession(composition);

		s.firstNight = false;

		const mod = getRoleModule('cupid');
		const r = mod.validate({ type: 'lovers', actorId: 'p1@s', targetIds: ['p2@s', 'p3@s'] }, s);

		assert.equal(r.ok, false);
		assert.equal(r.reason, 'cupidFirstNightOnly');
	});

	it('rejects picking the same player twice', () => {
		const s = makeSession(composition);
		const mod = getRoleModule('cupid');

		const r = mod.validate({ type: 'lovers', actorId: 'p1@s', targetIds: ['p2@s', 'p2@s'] }, s);

		assert.equal(r.ok, false);
		assert.equal(r.reason, 'wrongAction');
	});
});

describe('role: little-girl — peek action', () => {
	const composition = [
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
	];

	it('queues a peek action and flags isAction', () => {
		const s = makeSession(composition);
		const mod = getRoleModule('little-girl');

		const r = mod.execute({ type: 'peek', actorId: 'p6@s' }, s);

		assert.equal(r.ok, true);
		assert.equal(s.actionQueue.some((a) => a.type === 'peek' && a.actorId === 'p6@s'), true);
		assert.equal(getPlayer(s, 'p6@s').isAction, true);
	});
});

describe('role: hunter — shoot during hunterShoot phase', () => {
	const composition = [
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
	];

	it('requires a pending shot slot before firing', () => {
		const s = makeSession(composition);
		const mod = getRoleModule('hunter');

		const r = mod.validate({ type: 'shoot', actorId: 'p4@s', targetId: 'p0@s' }, s);

		assert.equal(r.ok, false);
		assert.equal(r.reason, 'wrongTime');
	});

	it('fills the pending shot slot when validation passes', () => {
		const s = makeSession(composition);

		setPhase(s, 'hunterShoot');
		s.pendingShots = [{ actorId: 'p4@s', targetId: null }];

		const mod = getRoleModule('hunter');
		const r = mod.execute({ type: 'shoot', actorId: 'p4@s', targetId: 'p0@s' }, s);

		assert.equal(r.ok, true);
		assert.equal(s.pendingShots[0].targetId, 'p0@s');
	});
});

describe('role: alpha-werewolf — convert is one-shot', () => {
	const composition = [
		'alpha-werewolf',
		'werewolf',
		'seer',
		'guard',
		'witch',
		'hunter',
		'cupid',
		'little-girl',
		'villager'
	];

	it('rejects convert after alphaConverted is set', () => {
		const s = makeSession(composition);
		const mod = getRoleModule('alpha-werewolf');

		s.alphaConverted = true;

		const r = mod.validate({ type: 'convert', actorId: 'p0@s', targetId: 'p8@s' }, s);

		assert.equal(r.ok, false);
		assert.equal(r.reason, 'alphaConvertUsed');
	});

	it('rejects converting another wolf', () => {
		const s = makeSession(composition);
		const mod = getRoleModule('alpha-werewolf');

		const r = mod.validate({ type: 'convert', actorId: 'p0@s', targetId: 'p1@s' }, s);

		assert.equal(r.ok, false);
		assert.equal(r.reason, 'wrongKill');
	});
});

describe('role: villager and jester — no night action', () => {
	it('villager rejects any action', () => {
		const mod = getRoleModule('villager');

		assert.equal(mod.execute({ type: 'kill' }, {}).ok, false);
	});

	it('jester rejects any action', () => {
		const mod = getRoleModule('jester');

		assert.equal(mod.execute({ type: 'seer' }, {}).ok, false);
	});
});

describe('role registry', () => {
	it('returns a module for every role in the composition of 20 players', () => {
		const N = 20;
		const composition = buildComposition(N);
		const uniqueRoles = [...new Set(composition)];

		for (const role of uniqueRoles) {
			assert.ok(getRoleModule(role), `role ${role} must have a module`);
		}
	});

	it('returns null for unknown roles', () => {
		assert.equal(getRoleModule('vampire'), null);
	});
});
