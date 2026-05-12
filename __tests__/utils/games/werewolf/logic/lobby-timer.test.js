/**
 * Lobby-timer unit tests — exercise the driver with a fake in-memory
 * repository and recorded callbacks. No real timers involved.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { makeLobbyTimer } from '../../../../../src/utils/games/werewolf/logic/lobby-timer.js';
import { MIN_PLAYERS } from '../../../../../src/utils/games/werewolf/config/constants.js';
import { addPlayer, createSession, setPhase } from '../../../../../src/utils/games/werewolf/state/session.js';

const makeFakeRepository = () => {
	const sessions = new Map();

	return {
		sessions,
		async load(roomId) {
			return sessions.get(roomId) ?? null;
		},
		save(session) {
			sessions.set(session.roomId, session);
		},
		async delete(roomId) {
			sessions.delete(roomId);
		}
	};
};

const makeFakeClock = () => {
	const scheduled = [];

	return {
		scheduled,
		setTimeoutFn(fn, delay) {
			const handle = { fn, delay, cancelled: false };

			scheduled.push(handle);
			return handle;
		},
		clearTimeoutFn(handle) {
			if (handle) {
				handle.cancelled = true;
			}
		}
	};
};

const fillLobby = (session, count) => {
	for (let i = 1; i < count; i += 1) {
		addPlayer(session, { id: `p${i}@s`, name: `P${i}` });
	}
};

describe('werewolf lobby-timer', () => {
	it('auto-starts when the lobby has reached MIN_PLAYERS on fire', async () => {
		const repo = makeFakeRepository();
		const calls = { autoStart: [], disband: [] };
		const clock = makeFakeClock();

		const timer = makeLobbyTimer({
			repository: repo,
			onAutoStart: (s) => calls.autoStart.push(s.roomId),
			onDisband: (s) => calls.disband.push(s.roomId),
			setTimeoutFn: clock.setTimeoutFn,
			clearTimeoutFn: clock.clearTimeoutFn
		});

		const session = createSession({ roomId: 'room@g.us', roomMaster: 'm@s', roomMasterName: 'M' });

		fillLobby(session, MIN_PLAYERS);
		repo.save(session);

		timer.start(session.roomId, 60_000);

		assert.equal(clock.scheduled.length, 1, 'one timer scheduled');
		assert.equal(timer.has(session.roomId), true);

		await timer.fireNow(session.roomId);

		assert.deepEqual(calls.autoStart, [session.roomId]);
		assert.deepEqual(calls.disband, []);
		assert.equal(timer.has(session.roomId), false);
	});

	it('disbands when the lobby is below MIN_PLAYERS on fire', async () => {
		const repo = makeFakeRepository();
		const calls = { autoStart: [], disband: [] };
		const clock = makeFakeClock();

		const timer = makeLobbyTimer({
			repository: repo,
			onAutoStart: (s) => calls.autoStart.push(s.roomId),
			onDisband: (s) => calls.disband.push(s.roomId),
			setTimeoutFn: clock.setTimeoutFn,
			clearTimeoutFn: clock.clearTimeoutFn
		});

		const session = createSession({ roomId: 'room@g.us', roomMaster: 'm@s', roomMasterName: 'M' });

		fillLobby(session, MIN_PLAYERS - 1);
		repo.save(session);

		timer.start(session.roomId, 60_000);

		await timer.fireNow(session.roomId);

		assert.deepEqual(calls.autoStart, []);
		assert.deepEqual(calls.disband, [session.roomId]);
	});

	it('firing after the game has already started is a no-op', async () => {
		const repo = makeFakeRepository();
		const calls = { autoStart: [], disband: [] };
		const clock = makeFakeClock();

		const timer = makeLobbyTimer({
			repository: repo,
			onAutoStart: (s) => calls.autoStart.push(s.roomId),
			onDisband: (s) => calls.disband.push(s.roomId),
			setTimeoutFn: clock.setTimeoutFn,
			clearTimeoutFn: clock.clearTimeoutFn
		});

		const session = createSession({ roomId: 'room@g.us', roomMaster: 'm@s', roomMasterName: 'M' });

		fillLobby(session, MIN_PLAYERS);
		setPhase(session, 'night');
		repo.save(session);

		timer.start(session.roomId, 60_000);
		await timer.fireNow(session.roomId);

		assert.deepEqual(calls.autoStart, [], 'auto-start must not run once the game is past lobby');
		assert.deepEqual(calls.disband, [], 'disband must not run once the game is past lobby');
	});

	it('firing without a session is a silent no-op', async () => {
		const repo = makeFakeRepository();
		const calls = { autoStart: [], disband: [] };
		const clock = makeFakeClock();

		const timer = makeLobbyTimer({
			repository: repo,
			onAutoStart: (s) => calls.autoStart.push(s.roomId),
			onDisband: (s) => calls.disband.push(s.roomId),
			setTimeoutFn: clock.setTimeoutFn,
			clearTimeoutFn: clock.clearTimeoutFn
		});

		await timer.fireNow('missing@g.us');

		assert.deepEqual(calls.autoStart, []);
		assert.deepEqual(calls.disband, []);
	});

	it('stop() cancels the scheduled timer so firing does nothing', async () => {
		const repo = makeFakeRepository();
		const calls = { autoStart: [], disband: [] };
		const clock = makeFakeClock();

		const timer = makeLobbyTimer({
			repository: repo,
			onAutoStart: (s) => calls.autoStart.push(s.roomId),
			onDisband: (s) => calls.disband.push(s.roomId),
			setTimeoutFn: clock.setTimeoutFn,
			clearTimeoutFn: clock.clearTimeoutFn
		});

		const session = createSession({ roomId: 'room@g.us', roomMaster: 'm@s', roomMasterName: 'M' });

		fillLobby(session, MIN_PLAYERS);
		repo.save(session);

		timer.start(session.roomId, 60_000);
		timer.stop(session.roomId);

		assert.equal(timer.has(session.roomId), false);
		assert.equal(clock.scheduled[0].cancelled, true);
	});

	it('start() replaces an existing timer for the same roomId', () => {
		const repo = makeFakeRepository();
		const clock = makeFakeClock();

		const timer = makeLobbyTimer({
			repository: repo,
			onAutoStart: () => {},
			onDisband: () => {},
			setTimeoutFn: clock.setTimeoutFn,
			clearTimeoutFn: clock.clearTimeoutFn
		});

		timer.start('room@g.us', 5_000);
		timer.start('room@g.us', 10_000);

		assert.equal(clock.scheduled.length, 2, 'both schedules recorded');
		assert.equal(clock.scheduled[0].cancelled, true, 'first was cancelled');
		assert.equal(clock.scheduled[1].cancelled, false, 'second is live');
	});

	it('stopAll() cancels every timer', () => {
		const repo = makeFakeRepository();
		const clock = makeFakeClock();

		const timer = makeLobbyTimer({
			repository: repo,
			onAutoStart: () => {},
			onDisband: () => {},
			setTimeoutFn: clock.setTimeoutFn,
			clearTimeoutFn: clock.clearTimeoutFn
		});

		timer.start('room-a@g.us', 1_000);
		timer.start('room-b@g.us', 2_000);

		timer.stopAll();

		assert.equal(timer.has('room-a@g.us'), false);
		assert.equal(timer.has('room-b@g.us'), false);
		assert.ok(clock.scheduled.every((s) => s.cancelled));
	});
});
