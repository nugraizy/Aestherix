import chalk from 'chalk';
import fs from 'fs-extra';
import meow from 'meow';

export const startingConnection = Date.now();

const helpFlag = `
 ${chalk.yellow('Usage')}
   $ node ${chalk.hex('#ffadda')('.')} <?session> [options]

 ${chalk.yellow('Options')}
   --prefix, -p             ${chalk.green('Set your custom prefix.')}
   --read-only              ${chalk.green('Read only.')}
   --auto-read              ${chalk.green('Auto read every incoming message.')}
   --restrict               ${chalk.green('Restrict every moderator commands.')}
   --only-logs              ${chalk.green('Only showing logs but will ignore every message and commands.')}
   --no-logs                ${chalk.green('Not showing any logs in the meantime still respond for any commands.')}
   --self-mode, -s          ${chalk.green('Set self mode that only owner and the bot can use.')}
   --debug-mode             ${chalk.green('Show every metadata of any message.')}
   --multi-cmd, -m          ${chalk.green('Loop every command on your script. Use | to seperate each commands.')}
   --rainbow                ${chalk.green('Make your logs rainbow colors.')}
   --trace                  ${chalk.green('Show errors.')}
   --watch, -w              ${chalk.green('Watch every file on your script and reload it when it changed.')}
   --cool-down, -c          ${chalk.green('Set cool down for every command.')}
   --auto-correct           ${chalk.green('Enable auto correct for every incoming command.')}
   --story                  ${chalk.green('Auto download people story after the bot received the story.')}
   --offline                ${chalk.green('Set your current presence to offline.')}
   --no-call                ${chalk.green('Reject incoming call.')}
   --ai                     ${chalk.green('Handle incoming messages with AI.')}
   --limit-reset, -l        ${chalk.green('Enable auto-reset user limit.')}
   --reset-on-start         ${chalk.green('Auto reset DB connections every start of the script.')}
   --no-limit               ${chalk.green('Set commands limit to none.')}
   --pair-mode              ${chalk.green('Enable pair mode.')} ${chalk.hex('#ff00ff')('This needs to input your host number to get the code.')}
   --pair-number            ${chalk.hex('#05ffa1')('Use this number for pairing (no prompt).')}
   --spin                   ${chalk.green('Enable spinners for loading plugins.')}
   --test                   ${chalk.green('Test your connection.')}
   --print-self             ${chalk.green('Print every incoming messages from host number in terminal.')}
   --help, -h               ${chalk.green('Show this message.')}

 ${chalk.yellow('Examples')}
   ${chalk.italic('$ node . --read-only --self-mode -w --prefix !')}
`;

export const DEFAULT_SESSION_NAME = (() => {
	try {
		const settings = fs.readJSONSync('./src/helper/config/settings.json');
		const value = String(settings?.main_session || '').trim();

		return value || 'Session-debug';
	} catch {
		return 'Session-debug';
	}
})();

export const meowFlags = {
	readOnly: { type: 'boolean' },
	autoRead: { type: 'boolean' },
	restrict: { type: 'boolean' },
	onlyLogs: { type: 'boolean' },
	noLogs: { type: 'boolean' },
	selfMode: { type: 'boolean', shortFlag: 's' },
	debugMode: { type: 'boolean' },
	multiCmd: { type: 'boolean', shortFlag: 'm' },
	rainbow: { type: 'boolean' },
	trace: { type: 'boolean' },
	help: { type: 'boolean', shortFlag: 'h' },
	prefix: { type: 'string', shortFlag: 'p' },
	watch: { type: 'boolean', shortFlag: 'w' },
	coolDown: { type: 'boolean', shortFlag: 'c' },
	autoCorrect: { type: 'boolean' },
	story: { type: 'boolean' },
	offline: { type: 'boolean' },
	noCall: { type: 'boolean' },
	ai: { type: 'boolean' },
	limitReset: { type: 'boolean', shortFlag: 'l' },
	resetOnStart: { type: 'boolean' },
	noLimit: { type: 'boolean' },
	pairMode: { type: 'boolean' },
	pairNumber: { type: 'string' },
	test: { type: 'boolean' },
	printSelf: { type: 'boolean' }
};

export const parseCli = () =>
	meow(helpFlag, {
		importMeta: import.meta,
		flags: meowFlags
	});

export const createCli = () => {
	const cli = parseCli();

	if (!cli.input?.[0]) {
		cli.input[0] = DEFAULT_SESSION_NAME;
	}

	return cli;
};

export const cli = createCli();
