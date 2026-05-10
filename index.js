import chalk from 'chalk';
import meow from 'meow';

import { DEFAULT_SESSION_NAME, meowFlags } from './src/helper/connection/utils/check-flag.js';

const cli = meow(
	`${chalk.yellow('  Usage')}
  $ node ${chalk.hex('#ffadda')('.')} <?session> [options]

${chalk.yellow('  Options')}
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
  --test                   ${chalk.green('Test your connection.')}
  --print-self             ${chalk.green('Print every incoming messages from host number in terminal.')}
  --help, -h               ${chalk.green('Show this message.')}

${chalk.yellow('  Examples')}
  ${chalk.italic('$ node . --read-only --self-mode -w --prefix !')}`,
	{
		importMeta: import.meta,
		flags: meowFlags
	}
);

if (!cli.input?.[0]) {
	cli.input[0] = DEFAULT_SESSION_NAME;
}

if (cli.flags.help) {
	console.log(cli.help);
	process.exit(0);
}

import 'dayjs/locale/id.js';
import './src/helper/connection/utils/suppress-console-spam.js';
import './src/helper/prototypes.js';

import dotenvx from '@dotenvx/dotenvx';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import ora from 'ora';
import path from 'path';
import { platform } from 'process';
import table from 'text-table';

dotenvx.config({
	quiet: true
});

dayjs.locale('id');
dayjs.extend(timezone);
dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.tz.setDefault('Asia/Jakarta');

import configuration from './src/helper/config/connect.js';
import isInternetAvailable from './src/helper/connection/net.js';
import { printBanner } from './src/utils/modules/color.js';

const INTERNET_CHECK_TIMEOUT = 20_000;
const INTERNET_CHECK_INTERVAL = 1_000;
const DEFAULT_TIMEOUT = 10_000;
const DEFAULT_INTERVAL = 1_000;
const FLAGS_COLUMNS = 3;
const FLAGS_COLUMN_SPACING = 9;
const FLAGS_KEY_WIDTH = 14;

const moduleURL = new URL(import.meta.url);

export const __dirname = platform === 'win32' ? path.dirname(moduleURL.pathname).slice(1) : path.dirname(moduleURL.pathname);
global.__dirname = __dirname;
global.__botName = 'Aestherix';

const printFlags = (flags) => {
	flags = flags.sort(([a], [b]) => a.localeCompare(b));
	const rows = Math.ceil(flags.length / FLAGS_COLUMNS);
	const pad = ' '.repeat(FLAGS_COLUMN_SPACING);

	const data = Array.from({ length: rows }, (_, r) =>
		Array.from({ length: FLAGS_COLUMNS }, (_, c) => {
			const i = r + c * rows;
			const [key, value] = flags[i] || [];

			const boolText = value ? chalk.green('true') : chalk.grey('false');

			return key ? `${key.padEnd(FLAGS_KEY_WIDTH).capitalize()} ${boolText}${pad}` : '';
		})
	);

	console.log(table(data));
};

const waitForInternetConnection = async (timeout = DEFAULT_TIMEOUT, interval = DEFAULT_INTERVAL) => {
	const spinner = ora('Checking Internet connection...').start();
	const startTime = Date.now();

	while (Date.now() - startTime < timeout) {
		try {
			const online = await isInternetAvailable();

			if (online) {
				spinner.succeed(chalk.green('Internet connection is available.'));
				return true;
			}

			throw new Error('Internet connection is not available. Waiting for internet connection.');
		} catch (error) {
			spinner.text = error.message;
			await new Promise((resolve) => setTimeout(resolve, interval));
		}
	}

	spinner.fail('Could not establish connection. Please make sure you are connected to the internet.');
	return false;
};

async function main() {
	try {
		configuration.OPTIONS = cli.flags;

		const isInternetConnected = await waitForInternetConnection(INTERNET_CHECK_TIMEOUT, INTERNET_CHECK_INTERVAL);

		if (!isInternetConnected) {
			process.exit(1);
		}

		printBanner();
		printFlags(Object.entries(cli.flags));

		await import('./src/index.js');
	} catch (error) {
		console.error(chalk.red('Fatal error during startup:'), error.message);
		process.exit(1);
	}
}

main();
