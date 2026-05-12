import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { applyLynch, tallyVotes } from '../../../../../src/utils/games/werewolf/logic/voting.js';
import { addPlayer, createSession, dealRoles, markDead } from '../../../../../src/utils/games/werewolf/state/session.js';
import { buildComposition } from '../../../../../src/utils/games/werewolf/config/balance.js';

const fiveSeat = () => {
	const s = createSession({ roomId: 'r', roomMaster: 'p0@s', roomMasterName: 'P0', now: () => 0 });

	for (let i = 1; i < 5; i += 1) {
		addPlayer(s, { id: `p${i}@s`, name: `P${i}` });
	}

	dealRoles(s, buildComposition(5), () => 0);
	return s;
};

describe('werewolf voting', () => {
	it('returns a single winner when majority is unique', () => {
		const s = fiveSeat();

		s.playerVoted = [
			{ voterId: 'p0@s', voterName: 'P0', targetId: 'p1@s' },
			{ voterId: 'p2@s', voterName: 'P2', targetId: 'p1@s' },
			{ voterId: 'p3@s', voterName: 'P3', targetId: 'p4@s' }
		];

		const result = tallyVotes(s);

		assert.equal(result.winner, 'p1@s');
		assert.equal(result.isDraw, false);
		assert.equal(result.totalVotes, 3);
		assert.equal(result.tally['p1@s'].count, 2);
	});

	it('flags a draw when the top two have equal counts', () => {
		const s = fiveSeat();

		s.playerVoted = [
			{ voterId: 'p0@s', voterName: 'P0', targetId: 'p1@s' },
			{ voterId: 'p2@s', voterName: 'P2', targetId: 'p3@s' }
		];

		const result = tallyVotes(s);

		assert.equal(result.isDraw, true);
		assert.equal(result.winner, null);
		assert.equal(result.runnerUp, 'p3@s');
	});

	it('returns no winner when no one voted', () => {
		const s = fiveSeat();

		s.playerVoted = [];

		const result = tallyVotes(s);

		assert.equal(result.winner, null);
		assert.equal(result.isDraw, false);
		assert.equal(result.totalVotes, 0);
		assert.deepEqual(result.tally, {});
	});

	it('applyLynch kills the target and flags jesterLynched only for jesters', () => {
		const s = fiveSeat();
		const seer = s.playersData.find((p) => p.role === 'seer');

		const r = applyLynch(s, seer.id);

		assert.equal(r.ok, true);
		assert.equal(r.role, 'seer');
		assert.equal(r.jesterLynched, false);
		assert.equal(seer.isAlive, false);
	});

	it('applyLynch sets jesterLynched when a jester is the target', () => {
		const s = fiveSeat();
		const anyPlayer = s.playersData[0];

		anyPlayer.role = 'jester';

		const r = applyLynch(s, anyPlayer.id);

		assert.equal(r.ok, true);
		assert.equal(r.role, 'jester');
		assert.equal(r.jesterLynched, true);
		assert.equal(s.jesterLynched, true);
	});

	it('applyLynch rejects a target that is already dead', () => {
		const s = fiveSeat();

		markDead(s, 'p1@s');

		const r = applyLynch(s, 'p1@s');

		assert.equal(r.ok, false);
		assert.equal(r.reason, 'not-alive');
	});

	it('applyLynch rejects an unknown target', () => {
		const s = fiveSeat();

		const r = applyLynch(s, 'ghost@s');

		assert.equal(r.ok, false);
		assert.equal(r.reason, 'unknown');
	});
});
