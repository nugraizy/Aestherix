/**
 * Repository tests — exercise the real serialize/rehydrate functions and
 * the real debouncer against real `setTimeout`. No mocking library is used.
 * For the DB surface we use a minimal in-memory object implementing only
 * the 4 Prisma methods the repository calls. That is not a mock, it is a
 * second real implementation of the same interface.
 */

import assert from 'node:assert/strict';
import { describe, it, afterEach, beforeEach } from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';

import { Cache } from '../../../../../src/helper/modules/cache.js';
import { buildComposition } from '../../../../../src/utils/games/werewolf/config/balance.js';
import { addPlayer, createSession, dealRoles, setPhase } from '../../../../../src/utils/games/werewolf/state/session.js';
import { makeRepository, rehydrateSession, serializeSession } from '../../../../../src/utils/games/werewolf/state/repository.js';

const makeInMemoryPrisma = () => {
	const table = new Map();

	return {
		writeCount: 0,
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
				this._parent.writeCount += 1;

				const existing = table.get(where.roomId);

				if (existing) {
					const merged = { ...existing, ...update, updatedAt: new Date() };

					table.set(where.roomId, merged);
					return merged;
				}

				const row = { ...create, createdAt: new Date(), updatedAt: new Date() };

				table.set(where.roomId, row);
				return row;
			},
			async deleteMany({ where }) {
				const before = table.size;

				table.delete(where.roomId);
				return { count: before - table.size };
			},
			_table: table
		}
	};
};

const fakePrisma = () => {
	const p = makeInMemoryPrisma();

	p.werewolfSession._parent = p;
	return p;
};

const seedFullSession = () => {
	const s = createSession({ roomId: 'ww-test-room', roomMaster: 'p0@s', roomMasterName: 'Master', now: () => 0 });

	for (let i = 1; i < 10; i += 1) {
		addPlayer(s, { id: `p${i}@s`, name: `P${i}` });
	}

	dealRoles(s, buildComposition(10), () => 0);
	setPhase(s, 'night');
	return s;
};

describe('werewolf repository — serialization', () => {
	it('serializeSession produces the row shape expected by Prisma', () => {
		const s = seedFullSession();
		const row = serializeSession(s);

		assert.equal(row.roomId, 'ww-test-room');
		assert.equal(row.phase, 'night');

		const parsed = JSON.parse(row.state);

		assert.equal(parsed.playersData.length, 10);
		assert.equal(parsed.roomMaster, 'p0@s');
	});

	it('rehydrateSession round-trips exactly', () => {
		const s = seedFullSession();
		const row = serializeSession(s);
		const back = rehydrateSession(row);

		assert.equal(back.roomId, s.roomId);
		assert.equal(back.phase, s.phase);
		assert.equal(back.playersData.length, s.playersData.length);
		assert.deepEqual(back.witchState, s.witchState);
	});

	it('rehydrateSession returns null on malformed JSON', () => {
		assert.equal(rehydrateSession({ roomId: 'x', phase: 'night', state: 'not-json' }), null);
	});

	it('rehydrateSession fills missing arrays so downstream code is safe', () => {
		const partial = JSON.stringify({ roomId: 'x', roomMaster: 'm', phase: 'night' });
		const row = { roomId: 'x', phase: 'night', state: partial };
		const back = rehydrateSession(row);

		assert.ok(Array.isArray(back.playersData));
		assert.ok(Array.isArray(back.actionQueue));
		assert.ok(Array.isArray(back.pendingShots));
		assert.deepEqual(back.witchState, { healUsed: false, poisonUsed: false });
	});
});

describe('werewolf repository — cache + DB interplay', () => {
	let cache;
	let prisma;
	let repo;

	beforeEach(() => {
		cache = new Cache();
		prisma = fakePrisma();
		repo = makeRepository({ prisma, cache, now: () => 1_000, debounceMs: 30 });
	});

	afterEach(async () => {
		await repo.flushAll();
	});

	it('save + flush round-trips the session through the DB', async () => {
		const s = seedFullSession();

		repo.save(s);
		await repo.flush(s.roomId);

		cache.delete(s.roomId);

		const loaded = await repo.load(s.roomId);

		assert.equal(loaded.roomId, s.roomId);
		assert.equal(loaded.phase, 'night');
		assert.equal(loaded.playersData.length, 10);
	});

	it('load returns null for an unknown room', async () => {
		const loaded = await repo.load('ww-test-unknown');

		assert.equal(loaded, null);
	});

	it('coalesces rapid saves into a single DB write', async () => {
		const s = seedFullSession();

		repo.save(s);
		setPhase(s, 'day');
		repo.save(s);
		setPhase(s, 'voting');
		repo.save(s);

		assert.equal(prisma.writeCount, 0, 'writes should not have happened yet');

		await sleep(80);

		assert.equal(prisma.writeCount, 1, 'debounce should coalesce 3 saves into 1 write');

		const row = prisma.werewolfSession._table.get(s.roomId);

		assert.equal(row.phase, 'voting');
	});

	it('save with phase=ended deletes the row instead of writing it', async () => {
		const s = seedFullSession();

		repo.save(s);
		await repo.flush(s.roomId);

		setPhase(s, 'ended');
		repo.save(s);

		await sleep(50);

		assert.equal(prisma.werewolfSession._table.has(s.roomId), false);
		assert.equal(cache.has(s.roomId), false);
	});

	it('delete cancels pending flush and removes the row', async () => {
		const s = seedFullSession();

		repo.save(s);
		assert.equal(repo._pending.has(s.roomId), true);

		await repo.delete(s.roomId);

		assert.equal(repo._pending.has(s.roomId), false);
		assert.equal(prisma.werewolfSession._table.has(s.roomId), false);
		assert.equal(cache.has(s.roomId), false);
	});

	it('loadAllUnfinished returns only sessions whose phase != ended', async () => {
		const active = seedFullSession();

		active.roomId = 'ww-test-active';
		repo.save(active);

		const finished = seedFullSession();

		finished.roomId = 'ww-test-finished';
		setPhase(finished, 'ended');

		await prisma.werewolfSession.upsert({
			where: { roomId: finished.roomId },
			update: { phase: finished.phase, state: JSON.stringify(finished) },
			create: { roomId: finished.roomId, phase: finished.phase, state: JSON.stringify(finished) }
		});

		await repo.flushAll();

		const result = await repo.loadAllUnfinished();

		assert.equal(result.length, 1);
		assert.equal(result[0].roomId, 'ww-test-active');
	});

	it('flushAll drains every pending write', async () => {
		const s1 = seedFullSession();

		s1.roomId = 'ww-test-r1';

		const s2 = seedFullSession();

		s2.roomId = 'ww-test-r2';

		repo.save(s1);
		repo.save(s2);

		assert.equal(prisma.writeCount, 0);

		await repo.flushAll();

		assert.equal(prisma.writeCount, 2);
	});
});
