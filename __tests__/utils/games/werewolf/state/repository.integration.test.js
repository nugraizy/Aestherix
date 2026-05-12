/**
 * Werewolf repository — real-DB integration test.
 *
 * Skipped by default.  Run with:
 *
 *     WW_REPO_INTEGRATION=1 npm test
 *
 * Every test uses a unique `ww-test-*` roomId and cleans up after itself.
 * On accidental crashes, the afterAll teardown purges any leftover rows
 * with roomId starting with `ww-test-`.
 */

import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { Cache } from '../../../../../src/helper/modules/cache.js';
import { buildComposition } from '../../../../../src/utils/games/werewolf/config/balance.js';
import { addPlayer, createSession, dealRoles, setPhase } from '../../../../../src/utils/games/werewolf/state/session.js';
import { makeRepository } from '../../../../../src/utils/games/werewolf/state/repository.js';

const ENABLED = process.env.WW_REPO_INTEGRATION === '1';

const integrationDescribe = ENABLED ? describe : describe.skip;

integrationDescribe('werewolf repository — real DB (gated)', () => {
	let prisma;
	let repo;
	let cache;

	before(async () => {
		const module = await import('../../../../../src/helper/database/prisma.js');

		prisma = module.default;
		cache = new Cache();
		repo = makeRepository({ prisma, cache, debounceMs: 50 });
	});

	after(async () => {
		await repo?.flushAll();

		await prisma?.werewolfSession.deleteMany({
			where: { roomId: { startsWith: 'ww-test-' } }
		});
	});

	it('persists a 12-player session and reloads it identically', async () => {
		const s = createSession({ roomId: `ww-test-${Date.now()}`, roomMaster: 'master@s', roomMasterName: 'M' });

		for (let i = 1; i < 12; i += 1) {
			addPlayer(s, { id: `p${i}@s`, name: `P${i}` });
		}

		dealRoles(s, buildComposition(12), () => 0);
		setPhase(s, 'night');

		repo.save(s);
		await repo.flush(s.roomId);

		cache.delete(s.roomId);

		const loaded = await repo.load(s.roomId);

		assert.equal(loaded.playersData.length, 12);
		assert.equal(loaded.phase, 'night');

		await repo.delete(s.roomId);
	});

	it('loadAllUnfinished filters phase=ended', async () => {
		const active = createSession({ roomId: `ww-test-active-${Date.now()}`, roomMaster: 'm', roomMasterName: 'M' });

		for (let i = 1; i < 5; i += 1) {
			addPlayer(active, { id: `p${i}@s`, name: `P${i}` });
		}

		dealRoles(active, buildComposition(5), () => 0);
		setPhase(active, 'day');

		const done = createSession({ roomId: `ww-test-done-${Date.now()}`, roomMaster: 'm', roomMasterName: 'M' });

		for (let i = 1; i < 5; i += 1) {
			addPlayer(done, { id: `p${i}@s`, name: `P${i}` });
		}

		dealRoles(done, buildComposition(5), () => 0);
		done.phase = 'lobby';

		repo.save(active);
		repo.save(done);
		await repo.flushAll();

		await prisma.werewolfSession.update({
			where: { roomId: done.roomId },
			data: { phase: 'ended' }
		});

		const all = await repo.loadAllUnfinished();
		const ids = all.map((s) => s.roomId);

		assert.ok(ids.includes(active.roomId));
		assert.ok(!ids.includes(done.roomId));

		await repo.delete(active.roomId);
		await prisma.werewolfSession.deleteMany({ where: { roomId: done.roomId } });
	});
});
