import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildComposition } from '../../../../../src/utils/games/werewolf/config/balance.js';
import { MAX_PLAYERS } from '../../../../../src/utils/games/werewolf/config/constants.js';
import {
	addPlayer,
	createSession,
	dealRoles,
	getAlivePlayers,
	getPlayer,
	isLobbyReady,
	isWolfRole,
	markAction,
	markDead,
	markProtected,
	markVoted,
	removePlayer,
	resetPerks,
	setPhase
} from '../../../../../src/utils/games/werewolf/state/session.js';

const makeSession = () =>
	createSession({ roomId: 'room-1', roomMaster: 'master@s', roomMasterName: 'Master', now: () => 1_000 });

describe('werewolf session', () => {
	it('creates a fresh session with the room master already joined', () => {
		const s = makeSession();

		assert.equal(s.roomId, 'room-1');
		assert.equal(s.phase, 'lobby');
		assert.equal(s.firstNight, true);
		assert.equal(s.playersData.length, 1);
		assert.equal(s.playersData[0].id, 'master@s');
		assert.equal(s.playersData[0].index, 0);
		assert.equal(s.createdAt, 1_000);
	});

	it('adds and removes players while keeping indices contiguous', () => {
		const s = makeSession();

		for (let i = 1; i <= 4; i += 1) {
			addPlayer(s, { id: `p${i}@s`, name: `P${i}` });
		}

		assert.equal(s.playersData.length, 5);
		assert.deepEqual(
			s.playersData.map((p) => p.index),
			[0, 1, 2, 3, 4]
		);

		const result = removePlayer(s, 'p2@s');

		assert.equal(result.ok, true);
		assert.equal(s.playersData.length, 4);
		assert.deepEqual(
			s.playersData.map((p) => p.id),
			['master@s', 'p1@s', 'p3@s', 'p4@s']
		);
		assert.deepEqual(
			s.playersData.map((p) => p.index),
			[0, 1, 2, 3]
		);
	});

	it('rejects duplicate joins', () => {
		const s = makeSession();

		const dup = addPlayer(s, { id: 'master@s', name: 'Dup' });

		assert.equal(dup.ok, false);
		assert.equal(dup.reason, 'already-joined');
	});

	it('rejects a join when the lobby is full', () => {
		const s = makeSession();

		for (let i = 1; i < MAX_PLAYERS; i += 1) {
			addPlayer(s, { id: `p${i}@s`, name: `P${i}` });
		}

		assert.equal(s.playersData.length, MAX_PLAYERS);
		assert.equal(addPlayer(s, { id: 'overflow@s', name: 'X' }).ok, false);
		assert.equal(addPlayer(s, { id: 'overflow@s', name: 'X' }).reason, 'full');
	});

	it('rejects join/remove after the lobby closes', () => {
		const s = makeSession();

		setPhase(s, 'deal');

		assert.equal(addPlayer(s, { id: 'late@s', name: 'L' }).reason, 'started');
		assert.equal(removePlayer(s, 'master@s').reason, 'started');
	});

	it('deals roles deterministically with an injected rng', () => {
		const s = makeSession();

		for (let i = 1; i <= 9; i += 1) {
			addPlayer(s, { id: `p${i}@s`, name: `P${i}` });
		}

		const composition = buildComposition(10);

		dealRoles(s, composition, () => 0);

		const assignedRoles = s.playersData.map((p) => p.role).sort();
		const expected = [...composition].sort();

		assert.deepEqual(assignedRoles, expected);

		const s2 = makeSession();

		for (let i = 1; i <= 9; i += 1) {
			addPlayer(s2, { id: `p${i}@s`, name: `P${i}` });
		}

		dealRoles(s2, composition, () => 0);

		assert.deepEqual(
			s.playersData.map((p) => p.role),
			s2.playersData.map((p) => p.role)
		);
	});

	it('rejects dealRoles when composition length mismatches', () => {
		const s = makeSession();

		for (let i = 1; i <= 4; i += 1) {
			addPlayer(s, { id: `p${i}@s`, name: `P${i}` });
		}

		assert.throws(() => dealRoles(s, ['werewolf']), /composition length/);
	});

	it('resetPerks clears per-round flags but keeps guardLastTargetId', () => {
		const s = makeSession();

		for (let i = 1; i <= 4; i += 1) {
			addPlayer(s, { id: `p${i}@s`, name: `P${i}` });
		}

		dealRoles(s, buildComposition(5), () => 0);
		s.guardLastTargetId = 'p1@s';
		markProtected(s, 'p2@s');
		markAction(s, 'p3@s');
		markVoted(s, 'p4@s');
		s.playerVoted.push({ voterId: 'p4@s', targetId: 'p2@s', voterName: 'P4' });
		s.playersKilled.push({ ...getPlayer(s, 'p1@s') });

		resetPerks(s);

		assert.equal(getPlayer(s, 'p2@s').isProtected, false);
		assert.equal(getPlayer(s, 'p3@s').isAction, false);
		assert.equal(getPlayer(s, 'p4@s').isVoted, false);
		assert.equal(s.playerVoted.length, 0);
		assert.equal(s.playersKilled.length, 0);
		assert.equal(s.guardLastTargetId, 'p1@s', 'guard memory must survive resetPerks');
	});

	it('markDead moves a player to playersDead exactly once', () => {
		const s = makeSession();

		for (let i = 1; i <= 4; i += 1) {
			addPlayer(s, { id: `p${i}@s`, name: `P${i}` });
		}

		dealRoles(s, buildComposition(5), () => 0);
		markDead(s, 'p1@s');
		markDead(s, 'p1@s');

		assert.equal(getPlayer(s, 'p1@s').isAlive, false);
		assert.equal(s.playersDead.filter((p) => p.id === 'p1@s').length, 1);
		assert.equal(getAlivePlayers(s).length, 4);
	});

	it('isLobbyReady tracks MIN/MAX bounds', () => {
		const s = makeSession();

		assert.equal(isLobbyReady(s), false);

		for (let i = 1; i <= 4; i += 1) {
			addPlayer(s, { id: `p${i}@s`, name: `P${i}` });
		}

		assert.equal(isLobbyReady(s), true);
	});

	it('isWolfRole recognises werewolf and alpha-werewolf', () => {
		assert.equal(isWolfRole('werewolf'), true);
		assert.equal(isWolfRole('alpha-werewolf'), true);
		assert.equal(isWolfRole('seer'), false);
		assert.equal(isWolfRole('villager'), false);
	});
});
