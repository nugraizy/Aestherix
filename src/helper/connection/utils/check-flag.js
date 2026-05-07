import chalk from 'chalk';
import fs from 'fs-extra';
import meow from 'meow';

import { color } from '../../../utils/modules/index.js';

export const startingConnection = Date.now();

const deprecated = (flag, warning) => `${color(flag, 'gray')}[${color('Deprecated!', '#FF5555')}] ${color(warning, 'gray')}`;

const helpFlag = `
	 ${color('Usage', 'yellow')}
	   $ node ${color('.', '#FF99C8')} <?session> [options]

	 ${color('Options', 'yellow')}
	   --prefix, -p          ${color('Set your custom prefix.', '#05ffa1')}
	   --readOnly, -y        ${color('Read only.', '#05ffa1')}
	   --autoRead, -r        ${color('Auto read every incoming message.', '#05ffa1')}
	   --restrict, -e        ${color('Restrict every moderator commands.', '#05ffa1')}
	   --onlyLogs, -o        ${color('Only showing logs but will ignore every message and commands.', '#05ffa1')}
	   --noLogs, -n          ${color('Not showing any logs in the meantime still respond for any commands.', '#05ffa1')}
	   --selfMode, -s        ${color('Set self mode that only owner and the bot can use.', '#05ffa1')}
	   --debugMode, -g       ${color('Show every metadata of any message.', '#05ffa1')}
	   --multiCmd, -m        ${color('Loop every command on your script. Use | to seperate each commands.', '#05ffa1')}
	   --rainbow, -b         ${color('make your logs rainbow colors.', '#05ffa1')}
	   --trace, -t           ${color('Show errors.', '#05ffa1')}
	   --watch, -w           ${color('Watch every file on your script and reload it when it changed.', '#05ffa1')}
	   --coolDown, -c        ${color('Set cool down for every command.', '#05ffa1')}
	   --autoCorrect, -a     ${color('Enable auto correct for every incoming command.', '#05ffa1')}
	   --story, -q           ${color('Auto download people story after the bot received the story.', '#05ffa1')}
	   --offline, -f         ${color('Set your current presence to offline.', '#05ffa1')}
	   --noCall, -d          ${color('Reject incoming call.', '#05ffa1')}
	   --ai, -i              ${color('Handle incoming Messages, with AI.', '#05ffa1')}
	   --limitReset, -l      ${color('Enable Auto-reset user limit.', '#05ffa1')}
	   --resetOnStart, -x    ${color('Auto reset DB-Connections every start of the script.', '#05ffa1')}
	   --noLimit, -u         ${color('Set commands limit to None.', '#05ffa1')}
	   --pairMode, -z        ${color('Enable pair mode.', '#05ffa1')} ${color(
				'This needs to input your host number to get the code.',
				'#ef476f'
			)}
	   --pairNumber          ${color('Use this number for pairing (no prompt).', '#05ffa1')}
	   --spin                ${color('Enable spinners for loading plugins.', '#05ffa1')}
	   --test                ${color('Test your connection.', '#05ffa1')}
	   --help, -h            ${color('Show this message.', '#05ffa1')}

	 ${color('Examples', 'yellow')}
	   ${chalk.italic('$ node . --readOnly -t')}
 `;

const DEFAULT_SESSION_NAME = (() => {
	try {
		const settings = fs.readJSONSync('./src/helper/config/settings.json');
		const value = String(settings?.main_session || '').trim();

		return value || 'Session-debug';
	} catch {
		return 'Session-debug';
	}
})();

export const parseCli = () =>
	meow(helpFlag, {
		importMeta: import.meta,
		flags: {
			readOnly: { type: 'boolean', shortFlag: 'y' },
			autoRead: { type: 'boolean', shortFlag: 'r' },
			restrict: { type: 'boolean', shortFlag: 'e' },
			onlyLogs: { type: 'boolean', shortFlag: 'o' },
			noLogs: { type: 'boolean', shortFlag: 'n' },
			selfMode: { type: 'boolean', shortFlag: 's' },
			debugMode: { type: 'boolean', shortFlag: 'g' },
			multiCmd: { type: 'boolean', shortFlag: 'm' },
			rainbow: { type: 'boolean', shortFlag: 'b' },
			trace: { type: 'boolean', shortFlag: 't' },
			help: { type: 'boolean', shortFlag: 'h' },
			prefix: { type: 'string', shortFlag: 'p' },
			watch: { type: 'boolean', shortFlag: 'w' },
			coolDown: { type: 'boolean', shortFlag: 'c' },
			autoCorrect: { type: 'boolean', shortFlag: 'a' },
			story: { type: 'boolean', shortFlag: 'q' },
			offline: { type: 'boolean', shortFlag: 'f' },
			noCall: { type: 'boolean', shortFlag: 'd' },
			ai: { type: 'boolean', shortFlag: 'i' },
			limitReset: { type: 'boolean', shortFlag: 'l' },
			resetOnStart: { type: 'boolean', shortFlag: 'x' },
			noLimit: { type: 'boolean', shortFlag: 'u' },
			pairMode: { type: 'boolean', shortFlag: 'z' },
			pairNumber: { type: 'string' },
			test: { type: 'boolean' },
			spin: { type: 'boolean' }
		}
	});

const cli = parseCli();

if (!cli.input?.[0]) {
	cli.input[0] = DEFAULT_SESSION_NAME;
}

if (cli.flags.help) {
	console.log(cli.help);
	process.exit(0);
}

export { cli };
