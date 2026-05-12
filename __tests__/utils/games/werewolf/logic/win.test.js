import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { evaluateWin } from '../../../../../src/utils/games/werewolf/logic/win.js';
import { addPlayer, createSession, dealRoles, markDead } from '../../../../../src/utils/games/werewolf/state/session.js';
import { buildComposition } from '../../../../../src/utils/games/werewolf/config/balance.js';

const session = (N) => {
	const s = createSession({ roomId: 'r', roomMaster: 'p0@s', roomMasterName: 'P0', now: () => 0 });

	for (let i = 1; i < N; i += 1) {
		addPlayer(s, { id: `p${i}@s`, name: `P${i}` });
	}

	dealRoles(s, buildComposition(N), () => 0);
	return s;
};

const setRoles = (s, map) => {
	for (const player of s.playersData) {
		if (map[player.id]) {
			player.role = map[player.id];
		}
	}
};

describe('werewolf win conditions', () => {
	it('returns null when the game is ongoing', () => {
		const s = session(7);

		assert.equal(evaluateWin(s), null);
	});

	it('returns village when no wolves remain', () => {
		const s = session(5);

		setRoles(s, { 'p0@s': 'seer', 'p1@s': 'villager', 'p2@s': 'villager', 'p3@s': 'villager', 'p4@s': 'werewolf' });
		markDead(s, 'p4@s');

		assert.equal(evaluateWin(s), 'village');
	});

	it('returns werewolf when wolves equal non-wolves', () => {
		const s = session(5);

		setRoles(s, { 'p0@s': 'werewolf', 'p1@s': 'werewolf', 'p2@s': 'villager', 'p3@s': 'seer', 'p4@s': 'guard' });
		markDead(s, 'p3@s');
		markDead(s, 'p4@s');

		assert.equal(evaluateWin(s), 'werewolf');
	});

	it('returns werewolf when wolves outnumber non-wolves', () => {
		const s = session(5);

		setRoles(s, { 'p0@s': 'werewolf', 'p1@s': 'werewolf', 'p2@s': 'werewolf', 'p3@s': 'seer', 'p4@s': 'villager' });
		markDead(s, 'p3@s');
		markDead(s, 'p4@s');

		assert.equal(evaluateWin(s), 'werewolf');
	});

	it('alpha-werewolf counts as wolves', () => {
		const s = session(5);

		setRoles(s, { 'p0@s': 'alpha-werewolf', 'p1@s': 'werewolf', 'p2@s': 'seer', 'p3@s': 'guard', 'p4@s': 'villager' });
		markDead(s, 'p2@s');
		markDead(s, 'p3@s');

		assert.equal(evaluateWin(s), 'werewolf');
	});

	it('jesterLynched override beats every other outcome', () => {
		const s = session(5);

		s.jesterLynched = true;

		assert.equal(evaluateWin(s), 'jester');
	});

	it('lovers win when both are alive and are the only survivors', () => {
		const s = session(7);

		setRoles(s, {
			'p0@s': 'cupid',
			'p1@s': 'werewolf',
			'p2@s': 'villager',
			'p3@s': 'seer',
			'p4@s': 'werewolf',
			'p5@s': 'villager',
			'p6@s': 'villager'
		});
		s.loverIds = ['p1@s', 'p2@s'];

		for (const id of ['p0@s', 'p3@s', 'p4@s', 'p5@s', 'p6@s']) {
			markDead(s, id);
		}

		assert.equal(evaluateWin(s), 'lovers');
	});

	it('lovers do not win while other players survive', () => {
		const s = session(7);

		setRoles(s, {
			'p0@s': 'cupid',
			'p1@s': 'werewolf',
			'p2@s': 'villager',
			'p3@s': 'seer',
			'p4@s': 'villager',
			'p5@s': 'villager',
			'p6@s': 'villager'
		});
		s.loverIds = ['p1@s', 'p2@s'];

		assert.equal(evaluateWin(s), null);
	});
});
