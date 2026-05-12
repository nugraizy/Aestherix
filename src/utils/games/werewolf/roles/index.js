/**
 * Role module registry.
 *
 * `getRoleModule(roleId)` returns the module for a role, or `null` for
 * roles that have no per-player action (villager, jester).
 */

import * as alphaWerewolf from './alpha-werewolf.js';
import * as cupid from './cupid.js';
import * as guard from './guard.js';
import * as hunter from './hunter.js';
import * as jester from './jester.js';
import * as littleGirl from './little-girl.js';
import * as seer from './seer.js';
import * as villager from './villager.js';
import * as werewolf from './werewolf.js';
import * as witch from './witch.js';

const MODULES = {
	villager,
	werewolf,
	'alpha-werewolf': alphaWerewolf,
	seer,
	guard,
	witch,
	hunter,
	cupid,
	'little-girl': littleGirl,
	jester
};

export const getRoleModule = (roleId) => MODULES[roleId] ?? null;

export const ALL_ROLE_MODULES = MODULES;
