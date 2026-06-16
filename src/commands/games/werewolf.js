import { getLocale, t } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

import * as convert from './werewolf/subcommands/convert.js';
import * as deleteCmd from './werewolf/subcommands/delete.js';
import * as exitCmd from './werewolf/subcommands/exit.js';
import * as guard from './werewolf/subcommands/guard.js';
import * as heal from './werewolf/subcommands/heal.js';
import * as help from './werewolf/subcommands/help.js';
import * as join from './werewolf/subcommands/join.js';
import * as kill from './werewolf/subcommands/kill.js';
import * as lang from './werewolf/subcommands/lang.js';
import * as lovers from './werewolf/subcommands/lovers.js';
import * as newGame from './werewolf/subcommands/new-game.js';
import * as peek from './werewolf/subcommands/peek.js';
import * as poison from './werewolf/subcommands/poison.js';
import * as seer from './werewolf/subcommands/seer.js';
import * as shoot from './werewolf/subcommands/shoot.js';
import * as start from './werewolf/subcommands/start.js';
import * as vote from './werewolf/subcommands/vote.js';

const SUBCOMMANDS = {
	newGame,
	newgame: newGame,
	'new-game': newGame,
	join,
	start,
	exit: exitCmd,
	delete: deleteCmd,
	kill,
	seer,
	guard,
	vote,
	heal,
	poison,
	shoot,
	lovers,
	peek,
	convert,
	lang,
	help
};

export default defineCommand({
	name: 'werewolf',
	minifiedDescription: 'Play Werewolf (5–20 players, 10 roles, id/en)',
	description:
		'Play Werewolf. Supports 5–20 players with dynamic role composition (Villager, Werewolf, Alpha Werewolf, Seer, Guard, Witch, Hunter, Cupid, Little Girl, Jester). Sessions persist across bot restarts.',
	usage: '!ww <subcommand> [args]',
	category: 'Games',
	aliases: ['ww'],
	cooldown: 1,
	limit: 0,
	status: 'enable',
	async run(ctx, client) {
		const sub = ctx.args?.[1]?.toLowerCase();
		const module = sub ? SUBCOMMANDS[sub] : null;

		if (!module) {
			const locale = await getLocale(ctx.from);

			return client.reply(ctx.from, t(locale, 'werewolf.help'), ctx.message);
		}

		return module.run(ctx, client);
	}
});
