import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import {
	buildLobbyButtons,
	buildTargetActionMessage,
	buildTargetButtons,
	buildTargetListBody
} from '../../../../../src/commands/games/werewolf/ui/buttons.js';

const fixtureTargets = () => [
	{ id: 'p1@s.whatsapp.net', name: 'Alice' },
	{ id: 'p2@s.whatsapp.net', name: 'Bob' },
	{ id: 'p3@s.whatsapp.net', name: 'Charlie' }
];

describe('werewolf ui — buttons', () => {
	before(() => {});

	it('buildTargetButtons produces one reply button per target with a 1-based index', () => {
		const buttons = buildTargetButtons({
			subcommand: 'kill',
			roomId: 'room@g',
			targets: fixtureTargets(),
			labelPrefix: 'KILL',
			ctx: { prefix: '.' }
		});

		assert.equal(buttons.length, 3);
		assert.equal(buttons[0].display, 'KILL Alice');
		assert.equal(buttons[0].id, '.ww kill 1 room@g');
		assert.equal(buttons[2].id, '.ww kill 3 room@g');
	});

	it('buildTargetListBody writes a numbered list with mention spans', () => {
		const body = buildTargetListBody(fixtureTargets());

		assert.match(body, /^1\. @p1 Alice$/m);
		assert.match(body, /^3\. @p3 Charlie$/m);
	});

	it('buildTargetActionMessage composes body + buttons + mentions', () => {
		const msg = buildTargetActionMessage({
			subcommand: 'vote',
			roomId: 'room@g',
			targets: fixtureTargets(),
			labelPrefix: 'VOTE',
			bodyText: 'Choose someone to hang',
			footerText: 'Tap a button',
			ctx: { prefix: '.' }
		});

		assert.equal(msg.buttons.length, 3);
		assert.ok(msg.body.startsWith('Choose someone to hang'));
		assert.ok(msg.body.includes('@p1 Alice'));
		assert.equal(msg.footer, 'Tap a button');
		assert.deepEqual(
			msg.mentions,
			fixtureTargets().map((t) => t.id)
		);
	});

	it('buildTargetActionMessage accepts extraButtons and appends them last', () => {
		const extra = [{ display: 'Cancel', id: '.ww cancel' }];
		const msg = buildTargetActionMessage({
			subcommand: 'vote',
			roomId: 'room@g',
			targets: fixtureTargets(),
			labelPrefix: 'VOTE',
			bodyText: 'x',
			footerText: 'y',
			extraButtons: extra,
			ctx: { prefix: '.' }
		});

		assert.equal(msg.buttons[msg.buttons.length - 1].display, 'Cancel');
	});

	it('buildLobbyButtons returns 4 buttons with consistent ids', () => {
		const labels = { join: 'Join', start: 'Start', exit: 'Leave', delete: 'Delete' };
		const buttons = buildLobbyButtons({ roomId: 'room@g', labels, ctx: { prefix: '.' } });

		assert.equal(buttons.length, 4);
		assert.equal(buttons[0].display, 'Join');
		assert.equal(buttons[0].id, '.ww join room@g');
		assert.equal(buttons[3].id, '.ww delete room@g');
	});
});
