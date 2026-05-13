import chalk from 'chalk';
import fs from 'fs-extra';
import meow from 'meow';

const SETTINGS_PATH = './src/helper/config/settings.json';
const DEFAULT_SESSION = 'aestherix-bot';

const FLAGS = {
	readOnly: { type: 'boolean' },
	autoRead: { type: 'boolean' },
	restrict: { type: 'boolean' },
	onlyLogs: { type: 'boolean' },
	noLogs: { type: 'boolean' },
	selfMode: { type: 'boolean', shortFlag: 's' },
	debugMode: { type: 'boolean' },
	multiCmd: { type: 'boolean', shortFlag: 'm' },
	rainbow: { type: 'boolean', shortFlag: 'b' },
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
	printSelf: { type: 'boolean' },
	spin: { type: 'boolean' }
};

const HELP_TEXT = `
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
   --pair-mode              ${chalk.green('Enable pair mode.')}
   --pair-number            ${chalk.green('Use this number for pairing (no prompt).')}
   --test                   ${chalk.green('Test your connection.')}
   --print-self             ${chalk.green('Print every incoming messages from host number in terminal.')}
   --help, -h               ${chalk.green('Show this message.')}

 ${chalk.yellow('Examples')}
   ${chalk.italic('$ node . --read-only --self-mode -w --prefix !')}
`;

export class Cli {
	#result;
	#sessionName = null;

	constructor() {
		this.#result = meow(HELP_TEXT, {
			importMeta: import.meta,
			flags: FLAGS
		});
	}

	get flags() {
		return this.#result.flags;
	}

	get input() {
		return this.#result.input;
	}

	get help() {
		return this.#result.help;
	}

	get raw() {
		return this.#result;
	}

	async resolveSessionName() {
		if (this.#sessionName) {
			return this.#sessionName;
		}

		const fromCli = String(this.#result.input?.[0] || '').trim();

		if (fromCli) {
			this.#sessionName = fromCli;
			return this.#sessionName;
		}

		try {
			const settings = await fs.readJSON(SETTINGS_PATH);
			const fromSettings = String(settings?.main_session || '').trim();

			this.#sessionName = fromSettings || DEFAULT_SESSION;
		} catch {
			this.#sessionName = DEFAULT_SESSION;
		}

		return this.#sessionName;
	}

	get sessionName() {
		if (!this.#sessionName) {
			try {
				const settings = fs.readJSONSync(SETTINGS_PATH);

				this.#sessionName = String(settings?.main_session || '').trim() || DEFAULT_SESSION;
			} catch {
				this.#sessionName = DEFAULT_SESSION;
			}

			const fromCli = String(this.#result.input?.[0] || '').trim();

			if (fromCli) {
				this.#sessionName = fromCli;
			}
		}

		return this.#sessionName;
	}

	static get validFlags() {
		return Object.keys(FLAGS);
	}
}
