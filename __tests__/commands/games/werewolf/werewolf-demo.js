/**
 * Werewolf real-time demo.
 *
 * Runs a complete game end-to-end with real timers so you can watch it
 * unfold in real time. Every phase respects its PHASE_TIMERS value
 * (scaled by the speed multiplier):
 *   deal=0s → night=40s → day=20s → voting=30s → hunterShoot=20s
 *
 * Usage:
 *   node scripts/werewolf-demo.js [N] [speed]
 *
 * Examples:
 *   node scripts/werewolf-demo.js              N=5  · speed=1x  (~2 min game)
 *   node scripts/werewolf-demo.js 7            N=7  · speed=1x
 *   node scripts/werewolf-demo.js 10 4         N=10 · 4x faster
 *   node scripts/werewolf-demo.js 5 0.5        N=5  · half speed
 *   SEED=42 node scripts/werewolf-demo.js 8 2  N=8  · 2x · custom seed
 */

import { EventEmitter } from 'node:events';

import { Cache } from '../../../../src/helper/modules/cache.js';
import { buildComposition, summariseComposition } from '../../../../src/utils/games/werewolf/config/balance.js';
import { LOBBY_TIMEOUT_MS, MAX_PLAYERS, MIN_PLAYERS } from '../../../../src/utils/games/werewolf/config/constants.js';
import { EVENTS } from '../../../../src/utils/games/werewolf/events.js';
import { makeLobbyTimer } from '../../../../src/utils/games/werewolf/logic/lobby-timer.js';
import { makeScheduler } from '../../../../src/utils/games/werewolf/logic/scheduler.js';
import { makeRepository } from '../../../../src/utils/games/werewolf/state/repository.js';
import {
	addPlayer,
	createSession,
	dealRoles,
	getAlivePlayers,
	getPlayer,
	isLobbyReady,
	isWolfRole,
	setPhase
} from '../../../../src/utils/games/werewolf/state/session.js';

const C = {
	reset: '\x1b[0m',
	bold: '\x1b[1m',
	dim: '\x1b[2m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	gray: '\x1b[90m'
};

const ROLE_COLOR = {
	werewolf: C.red,
	'alpha-werewolf': `${C.red}${C.bold}`,
	villager: C.green,
	seer: C.cyan,
	guard: C.blue,
	hunter: C.yellow,
	witch: C.magenta,
	cupid: `${C.magenta}${C.bold}`,
	'little-girl': C.cyan,
	jester: `${C.yellow}${C.bold}`
};

const parseIntArg = (raw, fallback, min, max) => {
	const parsed = Number.parseInt(raw ?? '', 10);

	if (!Number.isFinite(parsed)) {
		return fallback;
	}

	return Math.max(min, Math.min(max, parsed));
};

const parseFloatArg = (raw, fallback, min) => {
	const parsed = Number.parseFloat(raw ?? '');

	if (!Number.isFinite(parsed)) {
		return fallback;
	}

	return Math.max(min, parsed);
};

const [nArg, speedArg] = process.argv.slice(2);

const N = parseIntArg(nArg, 5, MIN_PLAYERS, MAX_PLAYERS);
const SPEED = parseFloatArg(speedArg ?? process.env.SPEED, 1, 0.05);
const SEED = Number.parseInt(process.env.SEED ?? String(N * 31 + 7), 10);

const startWall = Date.now();

const wallStamp = () => {
	const ms = Date.now() - startWall;
	const seconds = Math.floor(ms / 1000);
	const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
	const ss = String(seconds % 60).padStart(2, '0');
	const mmm = String(ms % 1000).padStart(3, '0');

	return `${mm}:${ss}.${mmm}`;
};

const log = (line) => console.log(`${C.gray}[${wallStamp()}]${C.reset} ${line}`);

const colorPlayer = (player) => {
	const role = player.role || 'lobby';
	const color = ROLE_COLOR[role] ?? '';
	const marker = player.isAlive === false ? `${C.dim}†${C.reset}` : '';

	return `${color}${player.name}${C.reset}${C.dim}[${role}]${C.reset}${marker}`;
};

const speedTimeout = (fn, delay) => {
	const handle = setTimeout(fn, Math.max(0, (delay ?? 0) / SPEED));

	if (handle && typeof handle === 'object') {
		handle.unref = () => handle;
	}

	return handle;
};
const speedClear = clearTimeout;

const makeRng = (seed) => {
	let state = Math.abs(seed) % 2147483647 || 1;

	return () => {
		state = (state * 48271) % 2147483647;
		return state / 2147483647;
	};
};

const rng = makeRng(SEED);

const makeFakePrisma = () => {
	const table = new Map();

	return {
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
};

const prisma = makeFakePrisma();
const cache = new Cache();
const repo = makeRepository({ prisma, cache, debounceMs: 1 });
const emitter = new EventEmitter();

const scheduler = makeScheduler({
	repository: repo,
	emit: (name, payload) => emitter.emit(name, payload),
	rng,
	setTimeoutFn: speedTimeout,
	clearTimeoutFn: speedClear
});

const lobbyTimer = makeLobbyTimer({
	repository: repo,
	onAutoStart: () => {
		log(`${C.yellow}⏰ lobby timeout → auto-start${C.reset}`);
	},
	onDisband: () => {
		log(`${C.red}⏰ lobby timeout → disband${C.reset}`);
	},
	setTimeoutFn: speedTimeout,
	clearTimeoutFn: speedClear
});

const roomId = `demo-${N}@g.us`;
const composition = buildComposition(N);

const formatAction = (action, session) => {
	if (action.type === 'lovers') {
		const [a, b] = action.targetIds;

		return `binds ${getPlayer(session, a)?.name} ❤ ${getPlayer(session, b)?.name}`;
	}

	if (action.type === 'peek') {
		return 'peeks the wolf chat';
	}

	const targetName = action.targetId ? getPlayer(session, action.targetId)?.name : null;

	switch (action.type) {
		case 'kill':
			return `${C.red}targets${C.reset} ${targetName}`;
		case 'seer':
			return `${C.cyan}inspects${C.reset} ${targetName}`;
		case 'guard':
			return `${C.blue}protects${C.reset} ${targetName}`;
		case 'heal':
			return `${C.green}heals${C.reset} ${targetName}`;
		case 'poison':
			return `${C.magenta}poisons${C.reset} ${targetName}`;
		case 'convert':
			return `${C.red}converts${C.reset} ${targetName}`;
		default:
			return `${action.type}${targetName ? ` → ${targetName}` : ''}`;
	}
};

const injectNightActions = (session, timerSec) => {
	const windowMs = timerSec * 1000;
	const alive = getAlivePlayers(session);
	const wolves = alive.filter((p) => isWolfRole(p.role));
	const nonWolves = alive.filter((p) => !isWolfRole(p.role));
	const victim = nonWolves[0];

	const intents = [];

	if (victim && wolves.length > 0) {
		for (const wolf of wolves) {
			intents.push({ actor: wolf, action: { type: 'kill', actorId: wolf.id, targetId: victim.id } });
		}
	}

	const seer = alive.find((p) => p.role === 'seer');

	if (seer) {
		const target = alive.find((p) => p.id !== seer.id);

		if (target) {
			intents.push({ actor: seer, action: { type: 'seer', actorId: seer.id, targetId: target.id } });
		}
	}

	const guard = alive.find((p) => p.role === 'guard');

	if (guard) {
		const target = alive.find((p) => p.id !== guard.id);

		if (target) {
			intents.push({ actor: guard, action: { type: 'guard', actorId: guard.id, targetId: target.id } });
		}
	}

	if (session.firstNight) {
		const cupid = alive.find((p) => p.role === 'cupid');

		if (cupid) {
			const candidates = alive.filter((p) => p.id !== cupid.id);

			if (candidates.length >= 2) {
				intents.push({
					actor: cupid,
					action: { type: 'lovers', actorId: cupid.id, targetIds: [candidates[0].id, candidates[1].id] }
				});
			}
		}
	}

	const littleGirl = alive.find((p) => p.role === 'little-girl');

	if (littleGirl) {
		intents.push({ actor: littleGirl, action: { type: 'peek', actorId: littleGirl.id } });
	}

	const alpha = alive.find((p) => p.role === 'alpha-werewolf');

	if (alpha && !session.alphaConverted) {
		const target = nonWolves.find((p) => p.role === 'villager');

		if (target) {
			intents.push({
				actor: alpha,
				action: { type: 'convert', actorId: alpha.id, targetId: target.id }
			});
		}
	}

	intents.forEach(({ actor, action }, idx) => {
		const delay = Math.floor((windowMs * (idx + 1)) / (intents.length + 1));

		speedTimeout(async () => {
			const live = await repo.load(roomId);

			if (!live || live.phase !== 'night') {
				return;
			}

			live.actionQueue.push(action);
			repo.save(live);

			log(`  ${C.dim}⚡${C.reset} ${colorPlayer(actor)} ${formatAction(action, live)}`);
		}, delay);
	});
};

const injectVotes = (session, timerSec) => {
	const windowMs = timerSec * 1000;
	const alive = getAlivePlayers(session);
	const wolves = alive.filter((p) => isWolfRole(p.role));
	const nonWolves = alive.filter((p) => !isWolfRole(p.role));
	const wolfTarget = wolves[0];
	const villageTarget = nonWolves[0];

	alive.forEach((voter, idx) => {
		const target = isWolfRole(voter.role) ? villageTarget : wolfTarget;

		if (!target) {
			return;
		}

		const delay = Math.floor((windowMs * (idx + 1)) / (alive.length + 1));

		speedTimeout(async () => {
			const live = await repo.load(roomId);

			if (!live || live.phase !== 'voting') {
				return;
			}

			live.playerVoted.push({ voterId: voter.id, voterName: voter.name, targetId: target.id });
			repo.save(live);

			log(`  ${C.dim}🗳️${C.reset}  ${colorPlayer(voter)} votes ${C.bold}${target.name}${C.reset}`);
		}, delay);
	});
};

const injectHunterShots = (session, timerSec) => {
	const windowMs = timerSec * 1000;
	const alive = getAlivePlayers(session);

	session.pendingShots.forEach((shot) => {
		if (shot.targetId !== null) {
			return;
		}

		const actor = getPlayer(session, shot.actorId);
		const priority = alive.find((p) => p.id !== shot.actorId && isWolfRole(p.role));
		const fallback = alive.find((p) => p.id !== shot.actorId);
		const target = priority ?? fallback;

		if (!target) {
			return;
		}

		const delay = Math.floor(windowMs / 2);

		speedTimeout(async () => {
			const live = await repo.load(roomId);

			if (!live || live.phase !== 'hunterShoot') {
				return;
			}

			const pending = live.pendingShots.find((s) => s.actorId === shot.actorId && s.targetId === null);

			if (pending) {
				pending.targetId = target.id;
				repo.save(live);
			}

			log(`  ${C.red}🏹${C.reset} ${actor?.name ?? 'Hunter'} ${C.dim}(dying)${C.reset} shoots ${colorPlayer(target)}`);
		}, delay);
	});
};

emitter.on(EVENTS.PHASE_CHANGED, async (payload) => {
	const session = await repo.load(roomId);
	const phaseColor =
		payload.phase === 'night'
			? C.blue
			: payload.phase === 'day'
				? C.yellow
				: payload.phase === 'voting'
					? C.magenta
					: payload.phase === 'hunterShoot'
						? C.red
						: C.gray;

	console.log('');
	log(
		`${phaseColor}${C.bold}━━━ ${payload.previousPhase} → ${payload.phase} ` +
			`· timer=${payload.timerSec}s (scaled ${(payload.timerSec / SPEED).toFixed(1)}s)${C.reset}`
	);

	if (session) {
		log(`    alive: ${getAlivePlayers(session).map(colorPlayer).join(', ')}`);
	}

	if (!session || session.phase === 'ended') {
		return;
	}

	if (payload.phase === 'night') {
		injectNightActions(session, payload.timerSec);
	} else if (payload.phase === 'voting') {
		injectVotes(session, payload.timerSec);
	} else if (payload.phase === 'hunterShoot') {
		injectHunterShots(session, payload.timerSec);
	}
});

emitter.on(EVENTS.MORNING_REPORT, (payload) => {
	const parts = [];

	if (payload.killedIds.length) {
		parts.push(`${C.red}killed=[${payload.killedIds.join(',')}]${C.reset}`);
	}

	if (payload.protectedIds.length) {
		parts.push(`${C.blue}protected=[${payload.protectedIds.join(',')}]${C.reset}`);
	}

	if (payload.convertedIds.length) {
		parts.push(`${C.red}converted=[${payload.convertedIds.join(',')}]${C.reset}`);
	}

	if (payload.loverCascadeIds.length) {
		parts.push(`${C.magenta}❤ loverCascade=[${payload.loverCascadeIds.join(',')}]${C.reset}`);
	}

	if (payload.seerObservations.length) {
		parts.push(`${C.cyan}seer saw ${payload.seerObservations.length}${C.reset}`);
	}

	log(`  ${C.yellow}☀️  MORNING${C.reset} ${parts.join(' · ') || C.dim + '(quiet night)' + C.reset}`);
});

emitter.on(EVENTS.VOTING_OPENED, (payload) => {
	log(`  ${C.magenta}🗳️  voting opened${C.reset} · candidates=${payload.candidates.length}`);
});

emitter.on(EVENTS.VOTING_CLOSED, (payload) => {
	const tally = Object.entries(payload.tally || {})
		.map(([id, t]) => `${id}:${t.count}`)
		.join(', ');

	if (payload.isNoVotes) {
		log(`  ${C.yellow}🪑 voting closed${C.reset} ${C.dim}(no votes — AFK bump)${C.reset}`);
	} else if (payload.isDraw) {
		log(`  ${C.yellow}🤝 voting closed${C.reset} ${C.dim}(draw, no lynch) tally={${tally}}${C.reset}`);
	} else {
		log(
			`  ${C.red}🪓 voting closed${C.reset} lynched=${C.bold}${payload.lynchedId}${C.reset} ` +
				`role=${payload.lynchedRole} tally={${tally}}`
		);
	}
});

emitter.on(EVENTS.WARNING, (payload) => {
	log(`  ${C.yellow}⚠ warning${C.reset} code=${payload.code}`);
});

emitter.on(EVENTS.GAME_ENDED, (payload) => {
	const survivors = payload.stats.players
		.filter((p) => p.isAlive)
		.map((p) => `${ROLE_COLOR[p.role] ?? ''}${p.name}${C.reset}${C.dim}[${p.role}]${C.reset}`);
	const dead = payload.stats.players
		.filter((p) => !p.isAlive)
		.map((p) => `${ROLE_COLOR[p.role] ?? ''}${p.name}${C.reset}${C.dim}[${p.role}]†${C.reset}`);

	console.log('');
	log(`${C.bold}${C.green}🏁 GAME ENDED · winner=${payload.winner ?? 'none'} · reason=${payload.reason}${C.reset}`);
	log(`   survivors: ${survivors.join(', ') || '(none)'}`);
	log(`   dead:      ${dead.join(', ') || '(none)'}`);
	console.log('');

	setTimeout(() => process.exit(0), Math.max(200, 500 / SPEED));
});

process.on('SIGINT', () => {
	console.log(`\n${C.dim}cancelled${C.reset}`);
	process.exit(130);
});

const compositionSummary = Object.entries(summariseComposition(composition))
	.sort(([a], [b]) => a.localeCompare(b))
	.map(([role, count]) => `${ROLE_COLOR[role] ?? ''}${role}×${count}${C.reset}`)
	.join(', ');

console.log('');
console.log(`${C.bold}${C.cyan}════════════════════════════════════════════════════════════════════════${C.reset}`);
console.log(`${C.bold}${C.cyan}  WEREWOLF REAL-TIME DEMO · N=${N} · speed=${SPEED}x · seed=${SEED}${C.reset}`);
console.log(`${C.cyan}  composition: ${compositionSummary}${C.reset}`);
console.log(
	`${C.cyan}  lobby timeout: ${LOBBY_TIMEOUT_MS / 1000}s ` +
		`(scaled: ${(LOBBY_TIMEOUT_MS / SPEED / 1000).toFixed(1)}s)${C.reset}`
);
console.log(`${C.dim}  tip: press Ctrl+C to abort.${C.reset}`);
console.log(`${C.bold}${C.cyan}════════════════════════════════════════════════════════════════════════${C.reset}`);
console.log('');

log(`${C.bold}📣 P0 runs ${C.yellow}!wolf newgame${C.reset} — lobby opens`);

const session = createSession({ roomId, roomMaster: 'p0@s', roomMasterName: 'P0' });

repo.save(session);
lobbyTimer.start(session.roomId, LOBBY_TIMEOUT_MS);

log(`    ✔ ${colorPlayer(session.playersData[0])} seated (1/${N})`);

const JOIN_BASE_MS = 3500;
const JOIN_JITTER_MS = 2000;
const PRE_START_MS = 4000;

let cumulative = 0;

for (let i = 1; i < N; i += 1) {
	const gap = JOIN_BASE_MS + Math.floor(rng() * JOIN_JITTER_MS);

	cumulative += gap;

	const id = `p${i}@s`;
	const name = `P${i}`;
	const plannedOffset = cumulative;

	speedTimeout(async () => {
		const live = await repo.load(roomId);

		if (!live) {
			return;
		}

		const result = addPlayer(live, { id, name });

		repo.save(live);

		if (result.ok) {
			log(`${C.green}👋 ${name}${C.reset} runs ${C.yellow}!wolf join${C.reset} — roster ${live.playersData.length}/${N}`);
		}
	}, plannedOffset);
}

const startOffset = cumulative + PRE_START_MS;

speedTimeout(async () => {
	const live = await repo.load(roomId);

	if (!live || !isLobbyReady(live)) {
		log(`${C.red}❌ lobby not ready, aborting${C.reset}`);
		process.exit(1);
	}

	console.log('');
	log(`${C.bold}🎬 P0 runs ${C.yellow}!wolf start${C.reset}`);
	lobbyTimer.stop(live.roomId);

	dealRoles(live, composition, rng);
	setPhase(live, 'deal');
	live.gameTimeStarted = Date.now();
	repo.save(live);

	log('    ✔ roles dealt, phase=deal');

	for (const player of live.playersData) {
		log(`      ${colorPlayer(player)}`);
	}

	scheduler.start(live.roomId, 0);
	log(`${C.bold}▶️  scheduler running${C.reset}`);
}, startOffset);
