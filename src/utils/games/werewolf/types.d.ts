/**
 * Werewolf game module — public type definitions shared across the rewrite.
 *
 * The runtime code is written in plain JavaScript (ESM).  These `.d.ts`
 * declarations are informational for editors and for JSDoc `@typedef`
 * imports (`@typedef {import('./types.js').Session} Session`).
 */

export type Team = 'village' | 'wolves' | 'solo';

export type RoleId =
	| 'villager'
	| 'werewolf'
	| 'alpha-werewolf'
	| 'seer'
	| 'guard'
	| 'witch'
	| 'hunter'
	| 'cupid'
	| 'little-girl'
	| 'jester';

export type PhaseName = 'lobby' | 'deal' | 'night' | 'day' | 'voting' | 'hunterShoot' | 'ended';

export interface RoleDescriptor {
	id: RoleId;
	team: Team;
	priority: number;
	minPlayers: number;
	maxCount: number;
	required?: boolean;
}

export interface Player {
	id: string;
	index: number;
	name: string;
	role: RoleId | '';
	dialogue: string;
	isProtected: boolean;
	isAlive: boolean;
	isAction: boolean;
	isVoted: boolean;
	loverId?: string;
}

export interface WitchState {
	healUsed: boolean;
	poisonUsed: boolean;
}

export interface Vote {
	voterId: string;
	targetId: string;
	voterName: string;
}

export type Action =
	| { type: 'kill'; actorId: string; targetId: string }
	| { type: 'guard'; actorId: string; targetId: string }
	| { type: 'seer'; actorId: string; targetId: string }
	| { type: 'heal'; actorId: string; targetId: string }
	| { type: 'poison'; actorId: string; targetId: string }
	| { type: 'peek'; actorId: string }
	| { type: 'convert'; actorId: string; targetId: string }
	| { type: 'lovers'; actorId: string; targetIds: [string, string] }
	| { type: 'shoot'; actorId: string; targetId: string };

export interface NightResult {
	killedIds: string[];
	protectedIds: string[];
	convertedIds: string[];
	peekedIds: string[];
	seerObservations: Array<{ seerId: string; targetId: string; role: RoleId }>;
	loverCascadeIds: string[];
}

export interface Session {
	roomId: string;
	roomMaster: string;
	roomMasterName: string;
	locale: string;
	phase: PhaseName;
	gameTime: number;
	gameTimeStarted: number | null;
	timeSpent: number;
	gameAfk: number;
	firstNight: boolean;
	playersData: Player[];
	playersDead: Player[];
	playersKilled: Player[];
	playerVoted: Vote[];
	guardLastTargetId: string | null;
	witchState: WitchState;
	alphaConverted: boolean;
	loverIds: string[];
	jesterLynched: boolean;
	pendingShots: Array<{ actorId: string; targetId: string | null }>;
	actionQueue: Action[];
	gameDialogue: string;
	createdAt: number;
	updatedAt: number;
}
