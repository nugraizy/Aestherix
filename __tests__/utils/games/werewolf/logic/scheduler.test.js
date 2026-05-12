/**
 * Scheduler tests — no mocking library. We wire up:
 *   - a real `makeRepository` against an in-memory Prisma double,
 *   - a real `EventEmitter` to catch emits,
 *   - a controllable fake setTimeout that just records (fn, delay) pairs and
 *     lets the test call the fn manually.
 *
 * This lets us assert the full driver behaviour in milliseconds without any
 * flaky real timers.
 */

import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import { EventEmitter } from 'node:events';

import { Cache } from '../../../../../src/helper/modules/cache.js';
import { addPlayer, createSession, dealRoles, getPlayer, setPhase } from '../../../../../src/utils/games/werewolf/state/session.js';
import { buildComposition } from '../../../../../src/utils/games/werewolf/config/balance.js';
import { makeRepository } from '../../../../../src/utils/games/werewolf/state/repository.js';
import { makeScheduler } from '../../../../../src/utils/games/werewolf/logic/scheduler.js';
import { EVENTS } from '../../../../../src/utils/games/werewolf/events.js';

const makeFakePrisma = () => {
	const table = new Map();
	const api = {
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
				api.writeCount += 1;

				const existing = table.get(where.roomId);

				if (existing) {
					const merged = { ...existing, ...update };

					table.set(where.roomId, merged);
					return merged;
				}

				const row = { ...create };

				table.set(where.roomId, row);
				return row;
			},
			async deleteMany({ where }) {
				const before = table.size;

				table.delete(where.roomId);
				return { count: before - table.size };
			}
		}
	};

	return api;
};

const makeFakeClock = () => {
	const queue = [];

	return {
		queue,
		setTimeout(fn, delay) {
			const entry = { fn, delay, id: Symbol('timer') };

			queue.push(entry);
			return entry.id;
		},
		clearTimeout(id) {
			const i = queue.findIndex((e) => e.id === id);

			if (i >= 0) {
				queue.splice(i, 1);
			}
		},
		async drainOnce() {
			const next = queue.shift();

			if (!next) {
				return false;
			}

			await next.fn();
			return true;
		},
		async drain(limit = 50) {
			let steps = 0;

			while (queue.length > 0 && steps < limit) {
				await this.drainOnce();
				steps += 1;
			}

			return steps;
		}
	};
};

const seed = (roomId) => {
	const s = createSession({ roomId, roomMaster: 'p0@s', roomMasterName: 'Master', now: () => 0 });

	for (let i = 1; i < 7; i += 1) {
		addPlayer(s, { id: `p${i}@s`, name: `P${i}` });
	}

	dealRoles(s, buildComposition(7), () => 0);
	setPhase(s, 'deal');
	s.gameTimeStarted = 0;
	return s;
};

describe('werewolf scheduler', () => {
	let prisma;
	let cache;
	let repo;
	let emitter;
	let emitted;
	let clock;
	let scheduler;

	beforeEach(() => {
		prisma = makeFakePrisma();
		cache = new Cache();
		repo = makeRepository({ prisma, cache, debounceMs: 1 });
		emitter = new EventEmitter();
		emitted = [];

		for (const name of Object.values(EVENTS)) {
			emitter.on(name, (payload) => emitted.push({ name, payload }));
		}

		clock = makeFakeClock();
		scheduler = makeScheduler({
			repository: repo,
			emit: (name, payload) => emitter.emit(name, payload),
			rng: () => 0,
			setTimeoutFn: clock.setTimeout,
			clearTimeoutFn: clock.clearTimeout
		});
	});

	it('start → tick advances deal to night on the first fire', async () => {
		const session = seed('r1');

		repo.save(session);
		scheduler.start('r1', 0);

		assert.equal(clock.queue.length, 1);

		await clock.drainOnce();

		const after = await repo.load('r1');

		assert.equal(after.phase, 'night');
		assert.ok(emitted.some((e) => e.name === EVENTS.PHASE_CHANGED));
	});

	it('runs a full lobby → deal → night → day → voting sequence', async () => {
		const session = seed('r2');

		repo.save(session);
		scheduler.start('r2', 0);

		await clock.drain(6);

		const after = await repo.load('r2');

		assert.ok(['day', 'voting', 'night'].includes(after.phase), `unexpected phase: ${after.phase}`);
		assert.ok(emitted.length >= 3);
	});

	it('stops ticking when the game ends and deletes the session', async () => {
		const session = seed('r3');
		const wolf = session.playersData.find((p) => p.role === 'werewolf');
		const survivors = ['seer'];

		for (const p of session.playersData) {
			if (p.id !== wolf.id && !survivors.includes(p.role)) {
				p.isAlive = false;
			}
		}

		setPhase(session, 'night');
		session.actionQueue = [
			{ type: 'kill', actorId: wolf.id, targetId: session.playersData.find((p) => p.role === 'seer').id }
		];
		repo.save(session);
		scheduler.start('r3', 0);

		await clock.drain(3);

		const after = await repo.load('r3');

		assert.equal(after, null, 'ended session should be deleted');
		assert.equal(clock.queue.length, 0, 'no further timers should be scheduled');
		assert.ok(emitted.some((e) => e.name === EVENTS.GAME_ENDED));
	});

	it('emits WARNING on an idle night queue', async () => {
		const session = seed('r4');

		setPhase(session, 'night');
		session.actionQueue = [];
		repo.save(session);
		scheduler.start('r4', 0);

		await clock.drainOnce();

		assert.ok(emitted.some((e) => e.name === EVENTS.WARNING && e.payload.code === 'nightIdle'));
	});

	it('stop cancels the pending timer without touching state', async () => {
		const session = seed('r5');

		repo.save(session);
		scheduler.start('r5', 0);

		assert.equal(clock.queue.length, 1);

		scheduler.stop('r5');

		assert.equal(clock.queue.length, 0);

		const after = await repo.load('r5');

		assert.equal(after.phase, 'deal');
	});

	it('stopAll clears every scheduled room', async () => {
		repo.save(seed('r6a'));
		repo.save(seed('r6b'));
		scheduler.start('r6a', 0);
		scheduler.start('r6b', 0);

		assert.equal(clock.queue.length, 2);

		scheduler.stopAll();

		assert.equal(clock.queue.length, 0);
	});

	it('tickNow runs a tick immediately (bypassing the timer)', async () => {
		const session = seed('r7');

		repo.save(session);
		scheduler.start('r7', 999);

		assert.equal(clock.queue.length, 1);

		await scheduler.tickNow('r7');

		const after = await repo.load('r7');

		assert.equal(after.phase, 'night');
		assert.ok(emitted.some((e) => e.name === EVENTS.PHASE_CHANGED));

		const loaded = getPlayer(after, 'p0@s');

		assert.ok(loaded);
	});
});
