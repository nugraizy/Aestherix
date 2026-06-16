import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import {
	buildAlphaConvertPrompt,
	buildCupidPrompt,
	buildGuardPrompt,
	buildHunterRevengePrompt,
	buildLittleGirlPrompt,
	buildLobbyPrompt,
	buildSeerPrompt,
	buildVotingPrompt,
	buildWerewolfPrompt,
	buildWitchHealPrompt,
	buildWitchPoisonPrompt
} from '../../../../../src/commands/games/werewolf/ui/prompts.js';
import { setPrefix } from '../../../../../src/helper/modules/prefix.js';
import { buildComposition } from '../../../../../src/utils/games/werewolf/config/balance.js';
import { addPlayer, createSession, dealRoles, setPhase } from '../../../../../src/utils/games/werewolf/state/session.js';

const makeTenPlayer = () => {
	const s = createSession({ roomId: 'room@g', roomMaster: 'p0@s', roomMasterName: 'M', now: () => 0 });

	for (let i = 1; i < 10; i += 1) {
		addPlayer(s, { id: `p${i}@s`, name: `P${i}` });
	}

	s.playersData.forEach((p, i) => {
		p.role = [
			'werewolf',
			'alpha-werewolf',
			'seer',
			'guard',
			'witch',
			'hunter',
			'cupid',
			'little-girl',
			'villager',
			'villager'
		][i];
	});

	setPhase(s, 'night');
	return s;
};

describe('werewolf ui — prompts', () => {
	before(() => {
		setPrefix('.');
	});

	it('werewolf prompt targets only non-wolves', () => {
		const s = makeTenPlayer();

		const msg = buildWerewolfPrompt(s, 'en');

		assert.ok(msg.buttons.every((b) => b.display.startsWith('KILL ')));
		const targetNames = msg.buttons.map((b) => b.display.replace('KILL ', ''));

		assert.ok(!targetNames.includes('P1'));
		assert.equal(msg.buttons.length, 8);
	});

	it('seer prompt excludes the seer itself', () => {
		const s = makeTenPlayer();

		const msg = buildSeerPrompt(s, 'en');

		assert.ok(msg.buttons.every((b) => b.display.startsWith('PEEK ')));
		assert.equal(msg.buttons.length, 9);
	});

	it('guard prompt excludes the guard and the last-guarded player', () => {
		const s = makeTenPlayer();

		s.guardLastTargetId = 'p1@s';

		const msg = buildGuardPrompt(s, 'en');

		assert.equal(msg.buttons.length, 8);
		assert.ok(
			msg.buttons.every((b) => !b.display.endsWith(' P1')),
			'last-guarded P1 must not appear'
		);
		assert.ok(
			msg.buttons.every((b) => !b.display.endsWith(' P3')),
			'guard self must not appear'
		);
	});

	it('witch heal/poison prompts disappear once their potion is used', () => {
		const s = makeTenPlayer();

		assert.ok(buildWitchHealPrompt(s, 'en'));
		assert.ok(buildWitchPoisonPrompt(s, 'en'));

		s.witchState.healUsed = true;
		s.witchState.poisonUsed = true;

		assert.equal(buildWitchHealPrompt(s, 'en'), null);
		assert.equal(buildWitchPoisonPrompt(s, 'en'), null);
	});

	it('hunter revenge prompt excludes the actor', () => {
		const s = makeTenPlayer();

		const msg = buildHunterRevengePrompt(s, 'p5@s', 'en');

		assert.equal(msg.buttons.length, 9);
		assert.ok(msg.buttons.every((b) => b.display.startsWith('SHOOT ')));
	});

	it('cupid prompt lists every other alive player as a LOVER button', () => {
		const s = makeTenPlayer();

		const msg = buildCupidPrompt(s, 'en');

		assert.equal(msg.buttons.length, 9);
		assert.ok(msg.buttons.every((b) => b.display.startsWith('LOVER 1 ')));
		assert.ok(msg.body.includes('Reply: .ww lovers'));
	});

	it('cupid second-pick prompt excludes the first lover', () => {
		const s = makeTenPlayer();
		const cupid = s.playersData.find((p) => p.role === 'cupid');
		const firstLover = s.playersData.find((p) => p.isAlive && p.id !== cupid.id);

		const msg = buildCupidPrompt(s, 'en', { excludeId: firstLover.id });

		assert.equal(msg.buttons.length, 8);
		assert.ok(msg.buttons.every((b) => b.display.startsWith('LOVER 2 ')));
		assert.ok(msg.buttons.every((b) => !b.display.endsWith(` ${firstLover.name}`)));
		assert.ok(msg.body.includes(firstLover.name));
	});

	it('little-girl prompt has a single peek button', () => {
		const s = makeTenPlayer();

		const msg = buildLittleGirlPrompt(s, 'en');

		assert.equal(msg.buttons.length, 1);
		assert.equal(msg.buttons[0].display, 'PEEK WOLF CHAT');
	});

	it('alpha convert prompt vanishes after alphaConverted flag is set', () => {
		const s = makeTenPlayer();

		assert.ok(buildAlphaConvertPrompt(s, 'en'));
		s.alphaConverted = true;
		assert.equal(buildAlphaConvertPrompt(s, 'en'), null);
	});

	it('voting prompt excludes the voter and labels with VOTE', () => {
		const s = makeTenPlayer();

		setPhase(s, 'voting');

		const msg = buildVotingPrompt(s, 'p0@s', 'en');

		assert.equal(msg.buttons.length, 9);
		assert.ok(msg.buttons.every((b) => b.display.startsWith('VOTE ')));
	});

	it('lobby prompt emits the 4 standard lobby buttons', () => {
		const s = makeTenPlayer();

		s.phase = 'lobby';

		const msg = buildLobbyPrompt(s, 'en');

		assert.equal(msg.buttons.length, 4);
		assert.equal(msg.buttons[0].display, 'Join');
		assert.equal(msg.buttons[3].display, 'Delete');
	});

	it('produces Indonesian labels by default', () => {
		const s = makeTenPlayer();

		const msg = buildWerewolfPrompt(s, 'id');

		assert.ok(msg.buttons.every((b) => b.display.startsWith('BUNUH ')));
	});
});

describe('werewolf ui — composition covers prompts for N=20', () => {
	before(() => {
		setPrefix('.');
	});

	it('every alive player at N=20 yields a valid prompt for their role', () => {
		const s = createSession({ roomId: 'room@g', roomMaster: 'p0@s', roomMasterName: 'M', now: () => 0 });

		for (let i = 1; i < 20; i += 1) {
			addPlayer(s, { id: `p${i}@s`, name: `P${i}` });
		}

		dealRoles(s, buildComposition(20), () => 0);
		setPhase(s, 'night');

		for (const player of s.playersData) {
			if (player.role === 'werewolf') {
				assert.ok(buildWerewolfPrompt(s, 'en').buttons.length > 0);
			}

			if (player.role === 'seer') {
				assert.ok(buildSeerPrompt(s, 'en').buttons.length > 0);
			}

			if (player.role === 'guard') {
				assert.ok(buildGuardPrompt(s, 'en').buttons.length > 0);
			}
		}
	});
});
