import meow from 'meow';
import chalk from 'chalk';

import { INFOLOG, color } from '../../../utils/modules/index.js';

const helpFlag = `
	 ${color('Usage', 'yellow')}
	   $ node ${color('.', 'cyan')} <?session> [options]

	 ${color('Options', 'yellow')}
	   --prefix, -p          ${color('Set your custom prefix.', '#05ffa1')}
	   --read_only, -y       ${color('Read only.', '#05ffa1')}
	   --auto_read, -r       ${color('Auto read every incoming message.', '#05ffa1')}
	   --restrict, -e        ${color('Restrict every moderator commands.', '#05ffa1')}
	   --only_logs, -o       ${color('Only showing logs but will ignore every message and commands.', '#05ffa1')}
	   --no_logs, -n         ${color('Not showing any logs in the meantime still respond for any commands.', '#05ffa1')}
	   --self_mode, -s       ${color('Set self mode that only owner and the bot can use.', '#05ffa1')}
	   --debug_mode, -g      ${color('Show every metadata of any message.', '#05ffa1')}
	   --multi_cmd, -m       ${color('Loop every command on your script. Use | to seperate each commands.', '#05ffa1')}
	   --rainbow, -b         ${color('make your logs rainbow colors.', '#05ffa1')}
	   --trace, -t           ${color('Show errors.', '#05ffa1')}
	   --watch, -w           ${color('Watch every file on your script and reload it when it changed.', '#05ffa1')}
	   --cool_down, -c       ${color('Set cool down for every command.', '#05ffa1')}
	   --auto_correct, -a    ${color('Enable auto correct for every incoming command.', '#05ffa1')}
	   ${color('--no_load, -v         ', 'gray')}[${color('Deprecated!', '#FF5555')}] ${color(
	'Disable module load animation.',
	'gray'
)}
	   ${color('--json, -j            ', 'gray')}[${color('Deprecated!', '#FF5555')}] ${color(
	'Use JSON DB to store data of the WhatsApp connection.',
	'gray'
)}
	   --reset, -k           ${color('Reset your WhatsApp connection session, and restart the script.', '#05ffa1')}
	   --story, q            ${color('Auto download people story after the bot received the story.', '#05ffa1')}
	   --offline, -f         ${color('Set your current presence to offline.', '#05ffa1')}
	   --no_call, -d         ${color('Reject incoming call.', '#05ffa1')}
	   --ai, -i              ${color('Handle incoming Messages, with AI.', '#05ffa1')}
	   --limit_reset, -l     ${color('Enable Auto-reset user limit.', '#05ffa1')}
	   --reset_on_start, -x  ${color('Auto reset DB-Connections every start of the script.', '#05ffa1')}
	   --no_limit, -u        ${color('Set commands limit to None.', '#05ffa1')}
	   --pair_mode, -z       ${color('Enable pair mode.', '#05ffa1')} ${color(
	'This needs to input your host number to get the code.',
	'#ef476f'
)}
	   --help, -h            ${color('Show this message.', '#05ffa1')}

	 ${color('Examples', 'yellow')}
	   ${chalk.italic('$ node . --read_only -t')}
 `;

export const parseCli = () =>
	meow(helpFlag, {
		importMeta: import.meta,
		flags: {
			/* eslint-disable */
			read_only: { type: 'boolean', shortFlag: 'y' },
			auto_read: { type: 'boolean', shortFlag: 'r' },
			restrict: { type: 'boolean', shortFlag: 'e' },
			only_logs: { type: 'boolean', shortFlag: 'o' },
			no_logs: { type: 'boolean', shortFlag: 'n' },
			self_mode: { type: 'boolean', shortFlag: 's' },
			debug_mode: { type: 'boolean', shortFlag: 'g' },
			multi_cmd: { type: 'boolean', shortFlag: 'm' },
			rainbow: { type: 'boolean', shortFlag: 'b' },
			trace: { type: 'boolean', shortFlag: 't' },
			help: { type: 'boolean', shortFlag: 'h' },
			prefix: { type: 'string', shortFlag: 'p' },
			watch: { type: 'boolean', shortFlag: 'w' },
			cool_down: { type: 'boolean', shortFlag: 'c' },
			auto_correct: { type: 'boolean', shortFlag: 'a' },
			no_load: { type: 'boolean', shortFlag: 'v' },
			json: { type: 'boolean', shortFlag: 'j' },
			reset: { type: 'boolean', shortFlag: 'k' },
			story: { type: 'boolean', shortFlag: 'q' },
			offline: { type: 'boolean', shortFlag: 'f' },
			no_call: { type: 'boolean', shortFlag: 'd' },
			ai: { type: 'boolean', shortFlag: 'i' },
			limit_reset: { type: 'boolean', shortFlag: 'l' },
			reset_on_start: { type: 'boolean', shortFlag: 'x' },
			no_limit: { type: 'boolean', shortFlag: 'u' },
			pair_mode: { type: 'boolean', shortFlag: 'z' }
		}
	});

const cli = parseCli();

if (cli.flags.help) {
	console.log(cli.help);
	process.exit(0);
}

if (cli.flags.noLoad) {
	INFOLOG(
		color('[WARN]', 'yellow'),
		'-v',
		'This flag is ' + color('deprecated', '#FF5555') + '. The module load animation will be disabled by default.'
	);
	cli.flags.noLoad = false;
	cli.unnormalizedFlags.v = false;
}

if (cli.flags.json) {
	INFOLOG(
		color('[WARN]', 'yellow'),
		'-j',
		'This flag is ' + color('deprecated', '#FF5555') + '. The JSON DB will be disabled by default.'
	);
	cli.flags.json = false;
	cli.unnormalizedFlags.j = false;
}

export { cli };
