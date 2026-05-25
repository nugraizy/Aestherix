import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { MAX_PLAYERS, MIN_PLAYERS } from '../../../../../src/utils/games/werewolf/config/constants.js';
import {
	buildComposition,
	summariseComposition,
	validateComposition
} from '../../../../../src/utils/games/werewolf/config/balance.js';

describe('werewolf composition', () => {
	it('produces the documented N=5 distribution', () => {
		const comp = summariseComposition(buildComposition(5));

		assert.deepEqual(comp, { werewolf: 1, seer: 1, villager: 3 });
	});

	it('produces the documented N=7 distribution', () => {
		const comp = summariseComposition(buildComposition(7));

		assert.deepEqual(comp, { werewolf: 2, seer: 1, guard: 1, hunter: 1, villager: 2 });
	});

	it('produces the documented N=10 distribution', () => {
		const comp = summariseComposition(buildComposition(10));

		assert.deepEqual(comp, {
			werewolf: 2,
			'alpha-werewolf': 1,
			seer: 1,
			guard: 1,
			hunter: 1,
			witch: 1,
			cupid: 1,
			'little-girl': 1,
			villager: 1
		});
	});

	it('produces the documented N=15 distribution', () => {
		const comp = summariseComposition(buildComposition(15));

		assert.deepEqual(comp, {
			werewolf: 3,
			'alpha-werewolf': 1,
			seer: 1,
			guard: 1,
			hunter: 1,
			witch: 1,
			cupid: 1,
			'little-girl': 1,
			jester: 1,
			villager: 4
		});
	});

	it('produces the documented N=20 distribution', () => {
		const comp = summariseComposition(buildComposition(20));

		assert.deepEqual(comp, {
			werewolf: 5,
			'alpha-werewolf': 1,
			seer: 1,
			guard: 1,
			hunter: 1,
			witch: 1,
			cupid: 1,
			'little-girl': 1,
			jester: 1,
			villager: 7
		});
	});

	it('always returns exactly N role ids for every N in range', () => {
		for (let N = MIN_PLAYERS; N <= MAX_PLAYERS; N += 1) {
			const list = buildComposition(N);

			assert.equal(list.length, N, `expected length ${N}, got ${list.length}`);
		}
	});

	it('always yields a composition where village > wolves', () => {
		for (let N = MIN_PLAYERS; N <= MAX_PLAYERS; N += 1) {
			assert.doesNotThrow(() => validateComposition(buildComposition(N)), `composition invalid at N=${N}`);
		}
	});

	it('rejects N below MIN_PLAYERS', () => {
		assert.throws(() => buildComposition(MIN_PLAYERS - 1), RangeError);
	});

	it('rejects N above MAX_PLAYERS', () => {
		assert.throws(() => buildComposition(MAX_PLAYERS + 1), RangeError);
	});

	it('rejects a non-integer N', () => {
		assert.throws(() => buildComposition(5.5), RangeError);
	});

	it('rejects a composition with duplicated single-copy roles', () => {
		assert.throws(() => validateComposition(['werewolf', 'werewolf', 'seer', 'seer', 'villager']), RangeError);
	});

	it('rejects a composition where wolves >= village', () => {
		assert.throws(() => validateComposition(['werewolf', 'werewolf', 'werewolf', 'seer', 'villager']), Error);
	});

	it('rejects an unknown role id', () => {
		assert.throws(() => validateComposition(['werewolf', 'ninja', 'villager', 'villager', 'villager']), Error);
	});
});
