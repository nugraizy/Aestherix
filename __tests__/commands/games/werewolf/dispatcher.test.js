/**
 * Dispatcher + subcommand tests.
 *
 * Uses a real Cache-backed repository with an in-memory Prisma double and a
 * minimal fake `client.instance` that records every `.reply()` and
 * `.send()` call. No mocking library involved — just plain record-and-check.
 */

import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import werewolfCommand from '../../../../src/commands/games/werewolf.js';
import configuration from '../../../../src/helper/config/connect.js';
import { setPrefix } from '../../../../src/helper/modules/prefix.js';
import { buildComposition } from '../../../../src/utils/games/werewolf/config/balance.js';
import { setLobbyTimer } from '../../../../src/utils/games/werewolf/logic/lobby-timer-singleton.js';
import { makeLobbyTimer } from '../../../../src/utils/games/werewolf/logic/lobby-timer.js';
import { setScheduler } from '../../../../src/utils/games/werewolf/logic/scheduler-singleton.js';
import { makeRepository, setRepositoryForTest } from '../../../../src/utils/games/werewolf/state/repository.js';
import { addPlayer, dealRoles, setPhase } from '../../../../src/utils/games/werewolf/state/session.js';

const makeFakePrisma = () => {
	const table = new Map();
	const api = {
		werewolfSession: {
			async findUnique({ where }) {
				return table.get(where.roomId) ?? null;
			},
			async findMany({ where } = {}) {
				const rows = [...table.values()];

				return where?.phase?.not ? rows.filter((r) => r.phase !== where.phase.not) : rows;
			},
			async upsert({ where, update, create }) {
				const existing = table.get(where.roomId);

				if (existing) {
					table.set(where.roomId, { ...existing, ...update });
					return table.get(where.roomId);
				}

				table.set(where.roomId, { ...create });
				return create;
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

const makeFakeClient = () => {
	const replies = [];
	const sends = [];

	return {
		replies,
		sends,
		instance: {
			TemplateBuilder: {
				Native: class {
					constructor() {
						this.args = { destination: null, body: '', footer: '', buttons: [] };
						this.button = {
							reply: ({ display, id }) => ({ display, id })
						};
					}
					destination(d) {
						this.args.destination = d;
						return this;
					}
					body(b) {
						this.args.body = b;
						return this;
					}
					footer(f) {
						this.args.footer = f;
						return this;
					}
					buttons(...bs) {
						this.args.buttons = bs;
						return this;
					}
					send() {
						sends.push({ ...this.args });
						return Promise.resolve();
					}
				}
			},
			reply(to, text) {
				replies.push({ to, text });
				return Promise.resolve();
			},
			send(to, payload) {
				sends.push({ to, ...payload });
				return Promise.resolve();
			}
		}
	};
};

const ctx = (overrides) => ({
	from: 'room@g.us',
	sender: 'master@s.whatsapp.net',
	pushname: 'Master',
	isGroup: true,
	args: [],
	message: {},
	...overrides
});

describe('werewolf command dispatcher', () => {
	let repo;

	beforeEach(() => {
		setPrefix('.');
		configuration.games.werewolf.clear();
		repo = makeRepository({ prisma: makeFakePrisma(), cache: configuration.games.werewolf, debounceMs: 0 });
		setRepositoryForTest(repo);

		setScheduler({ start: () => {}, stop: () => {}, stopAll: () => {}, tickNow: async () => {} });
	});

	it('unknown subcommand prints the help text', async () => {
		const client = makeFakeClient();

		await werewolfCommand.run(ctx({ args: ['ww', 'bogus'] }), client);

		assert.equal(client.replies.length, 1);
		assert.ok(client.replies[0].text.toLowerCase().includes('werewolf') || client.replies[0].text.includes('.ww'));
	});

	it('newGame creates a lobby and sends the lobby prompt', async () => {
		const client = makeFakeClient();

		await werewolfCommand.run(ctx({ args: ['ww', 'newGame'] }), client);

		assert.equal(client.sends.length, 1, 'lobby prompt should be sent');

		const prompt = client.sends[0];

		assert.equal(prompt.destination, 'room@g.us');
		assert.ok(prompt.buttons.length >= 4, 'lobby prompt should offer 4 buttons');
	});

	it('join rejects when there is no session', async () => {
		const client = makeFakeClient();

		await werewolfCommand.run(ctx({ args: ['ww', 'join'] }), client);

		assert.equal(client.replies.length, 1);
		assert.match(client.replies[0].text, /(noSessionExist|Werewolf|Sesi)/i);
	});

	it('start refuses before MIN_PLAYERS are in the lobby', async () => {
		const client = makeFakeClient();

		await werewolfCommand.run(ctx({ args: ['ww', 'newGame'] }), client);

		await werewolfCommand.run(ctx({ args: ['ww', 'start'] }), client);

		const last = client.replies.at(-1).text;

		assert.match(last, /(\d|cukup|need)/i, `expected a not-enough-players error, got: ${last}`);
	});

	it('vote with invalid index rejects', async () => {
		const client = makeFakeClient();

		await werewolfCommand.run(ctx({ args: ['ww', 'newGame'] }), client);

		const session = configuration.games.werewolf.get('room@g.us');

		for (let i = 1; i < 7; i += 1) {
			addPlayer(session, { id: `p${i}@s`, name: `P${i}` });
		}

		dealRoles(session, buildComposition(7), () => 0);
		setPhase(session, 'voting');

		await werewolfCommand.run(ctx({ args: ['ww', 'vote', '99'], sender: 'master@s.whatsapp.net' }), client);

		const last = client.replies.at(-1).text;

		assert.match(last, /(target|Target|tidak ada|missing)/i);
	});
});

describe('werewolf command — newGame → join → start lifecycle', () => {
	let repo;

	beforeEach(() => {
		setPrefix('.');
		configuration.games.werewolf.clear();
		repo = makeRepository({ prisma: makeFakePrisma(), cache: configuration.games.werewolf, debounceMs: 0 });
		setRepositoryForTest(repo);

		setScheduler({ start: () => {}, stop: () => {}, stopAll: () => {}, tickNow: async () => {} });
	});

	const runAs = (command, sender, pushname, client, args = []) =>
		werewolfCommand.run(ctx({ args: ['ww', command, ...args], sender, pushname }), client);

	const currentSession = () => configuration.games.werewolf.get('room@g.us');

	it('master opens a lobby, dummies join up to MIN_PLAYERS, then start deals roles', async () => {
		const client = makeFakeClient();

		await runAs('newGame', 'master@s.whatsapp.net', 'Master', client);

		let session = currentSession();

		assert.ok(session, 'session should exist after newGame');
		assert.equal(session.phase, 'lobby');
		assert.equal(session.playersData.length, 1, 'master is auto-joined as player #1');
		assert.equal(session.playersData[0].id, 'master@s.whatsapp.net');

		for (let i = 1; i <= 4; i += 1) {
			await runAs('join', `p${i}@s.whatsapp.net`, `Dummy${i}`, client);

			session = currentSession();
			assert.equal(session.playersData.length, 1 + i, `player count after join #${i}`);
			assert.equal(session.phase, 'lobby', 'phase stays lobby while joining');
		}

		assert.equal(session.playersData.length, 5, 'reached MIN_PLAYERS');

		await runAs('start', 'master@s.whatsapp.net', 'Master', client);

		session = currentSession();
		assert.equal(session.phase, 'deal', 'start transitions phase to deal');
		assert.ok(
			session.playersData.every((p) => p.role && p.role.length > 0),
			'every player received a role'
		);

		const wolves = session.playersData.filter((p) => p.role === 'werewolf' || p.role === 'alpha-werewolf');

		assert.ok(wolves.length >= 1, 'at least one wolf was dealt');
	});

	it('gradually fills to MAX_PLAYERS; the 21st join is rejected as full', async () => {
		const client = makeFakeClient();

		await runAs('newGame', 'master@s.whatsapp.net', 'Master', client);

		for (let i = 1; i <= 19; i += 1) {
			await runAs('join', `p${i}@s.whatsapp.net`, `Dummy${i}`, client);
		}

		assert.equal(currentSession().playersData.length, 20, 'lobby at MAX_PLAYERS');

		const repliesBefore = client.replies.length;

		await runAs('join', 'p20@s.whatsapp.net', 'Dummy20', client);

		assert.equal(currentSession().playersData.length, 20, 'no additional player was added');

		const last = client.replies.at(-1).text;

		assert.ok(client.replies.length > repliesBefore, 'an error reply was sent for the 21st joiner');
		assert.match(last, /(full|penuh)/i, `expected a full-lobby error, got: ${last}`);
	});

	it('only the room master can start the game', async () => {
		const client = makeFakeClient();

		await runAs('newGame', 'master@s.whatsapp.net', 'Master', client);

		for (let i = 1; i <= 4; i += 1) {
			await runAs('join', `p${i}@s.whatsapp.net`, `Dummy${i}`, client);
		}

		await runAs('start', 'p1@s.whatsapp.net', 'Dummy1', client);

		assert.equal(currentSession().phase, 'lobby', 'non-master start is ignored');

		const last = client.replies.at(-1).text;

		assert.match(last, /(master|room|kamar)/i, `expected a not-room-master error, got: ${last}`);

		await runAs('start', 'master@s.whatsapp.net', 'Master', client);

		assert.equal(currentSession().phase, 'deal', 'master can start the game');
	});

	it('rejects duplicate join attempts from the same player', async () => {
		const client = makeFakeClient();

		await runAs('newGame', 'master@s.whatsapp.net', 'Master', client);
		await runAs('join', 'p1@s.whatsapp.net', 'Dummy1', client);

		assert.equal(currentSession().playersData.length, 2);

		await runAs('join', 'p1@s.whatsapp.net', 'Dummy1', client);

		assert.equal(currentSession().playersData.length, 2, 'duplicate join did not increase the count');

		const last = client.replies.at(-1).text;

		assert.match(last, /(join|gabung|sudah|already)/i, `expected an already-joined error, got: ${last}`);
	});

	it('start is rejected below MIN_PLAYERS even by the master', async () => {
		const client = makeFakeClient();

		await runAs('newGame', 'master@s.whatsapp.net', 'Master', client);

		for (let i = 1; i <= 3; i += 1) {
			await runAs('join', `p${i}@s.whatsapp.net`, `Dummy${i}`, client);
		}

		assert.equal(currentSession().playersData.length, 4, 'below MIN_PLAYERS (=5)');

		await runAs('start', 'master@s.whatsapp.net', 'Master', client);

		assert.equal(currentSession().phase, 'lobby', 'start did nothing');

		const last = client.replies.at(-1).text;

		assert.match(last, /(\d|need|cukup)/i, `expected a not-enough-players error, got: ${last}`);
	});

	describe('werewolf command — lobby timer integration', () => {
		let repo;
		let lobbyClock;
		let lobbyCalls;

		const makeLobbyClock = () => {
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

		beforeEach(() => {
			setPrefix('.');
			configuration.games.werewolf.clear();
			repo = makeRepository({ prisma: makeFakePrisma(), cache: configuration.games.werewolf, debounceMs: 0 });
			setRepositoryForTest(repo);

			setScheduler({ start: () => {}, stop: () => {}, stopAll: () => {}, tickNow: async () => {} });

			lobbyClock = makeLobbyClock();
			lobbyCalls = { autoStart: [], disband: [] };

			setLobbyTimer(
				makeLobbyTimer({
					repository: repo,
					onAutoStart: (session) => lobbyCalls.autoStart.push(session.roomId),
					onDisband: (session) => lobbyCalls.disband.push(session.roomId),
					setTimeoutFn: lobbyClock.setTimeoutFn,
					clearTimeoutFn: lobbyClock.clearTimeoutFn
				})
			);
		});

		const runAs = (command, sender, pushname, client, args = []) =>
			werewolfCommand.run(ctx({ args: ['ww', command, ...args], sender, pushname }), client);

		const currentSession = () => configuration.games.werewolf.get('room@g.us');

		it('newGame schedules the lobby timer', async () => {
			const client = makeFakeClient();

			await runAs('newGame', 'master@s.whatsapp.net', 'Master', client);

			assert.equal(lobbyClock.scheduled.length, 1, 'lobby timer was scheduled');
			assert.equal(lobbyClock.scheduled[0].cancelled, false);
			assert.ok(lobbyClock.scheduled[0].delay > 0, 'delay is positive');
		});

		it('timer auto-starts the game when MIN_PLAYERS are in the lobby', async () => {
			const client = makeFakeClient();
			const { getLobbyTimer } = await import('../../../../src/utils/games/werewolf/logic/lobby-timer-singleton.js');

			await runAs('newGame', 'master@s.whatsapp.net', 'Master', client);

			for (let i = 1; i <= 4; i += 1) {
				await runAs('join', `p${i}@s.whatsapp.net`, `Dummy${i}`, client);
			}

			assert.equal(currentSession().playersData.length, 5, 'lobby at MIN_PLAYERS');

			await getLobbyTimer().fireNow('room@g.us');

			assert.deepEqual(lobbyCalls.autoStart, ['room@g.us']);
			assert.deepEqual(lobbyCalls.disband, []);
		});

		it('timer disbands the lobby when below MIN_PLAYERS', async () => {
			const client = makeFakeClient();
			const { getLobbyTimer } = await import('../../../../src/utils/games/werewolf/logic/lobby-timer-singleton.js');

			await runAs('newGame', 'master@s.whatsapp.net', 'Master', client);

			for (let i = 1; i <= 2; i += 1) {
				await runAs('join', `p${i}@s.whatsapp.net`, `Dummy${i}`, client);
			}

			assert.equal(currentSession().playersData.length, 3, 'below MIN_PLAYERS');

			await getLobbyTimer().fireNow('room@g.us');

			assert.deepEqual(lobbyCalls.autoStart, []);
			assert.deepEqual(lobbyCalls.disband, ['room@g.us']);
		});

		it('manual !ww start cancels the lobby timer', async () => {
			const client = makeFakeClient();
			const { getLobbyTimer } = await import('../../../../src/utils/games/werewolf/logic/lobby-timer-singleton.js');

			await runAs('newGame', 'master@s.whatsapp.net', 'Master', client);

			for (let i = 1; i <= 4; i += 1) {
				await runAs('join', `p${i}@s.whatsapp.net`, `Dummy${i}`, client);
			}

			await runAs('start', 'master@s.whatsapp.net', 'Master', client);

			assert.equal(lobbyClock.scheduled[0].cancelled, true, 'timer was cancelled on start');
			assert.equal(getLobbyTimer().has('room@g.us'), false);

			await getLobbyTimer().fireNow('room@g.us');

			assert.deepEqual(lobbyCalls.autoStart, [], 'auto-start must not run after manual start');
		});

		it('!ww delete cancels the lobby timer', async () => {
			const client = makeFakeClient();
			const { getLobbyTimer } = await import('../../../../src/utils/games/werewolf/logic/lobby-timer-singleton.js');

			await runAs('newGame', 'master@s.whatsapp.net', 'Master', client);
			await runAs('delete', 'master@s.whatsapp.net', 'Master', client);

			assert.equal(lobbyClock.scheduled[0].cancelled, true, 'timer was cancelled on delete');
			assert.equal(getLobbyTimer().has('room@g.us'), false);
		});

		it('firing after the game already started is a no-op', async () => {
			const client = makeFakeClient();
			const { getLobbyTimer } = await import('../../../../src/utils/games/werewolf/logic/lobby-timer-singleton.js');

			await runAs('newGame', 'master@s.whatsapp.net', 'Master', client);

			const session = currentSession();

			for (let i = 1; i <= 4; i += 1) {
				addPlayer(session, { id: `p${i}@s.whatsapp.net`, name: `Dummy${i}` });
			}

			dealRoles(session, buildComposition(session.playersData.length), () => 0);
			setPhase(session, 'night');
			repo.save(session);

			await getLobbyTimer().fireNow('room@g.us');

			assert.deepEqual(lobbyCalls.autoStart, [], 'no auto-start once past lobby');
			assert.deepEqual(lobbyCalls.disband, [], 'no disband once past lobby');
		});
	});
});
