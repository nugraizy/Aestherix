import 'dayjs/locale/id.js';
import './src/helper/prototypes.js';

import dotenvx from '@dotenvx/dotenvx';
import chalk from 'chalk';
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

/**
 * Waits for internet connection with timeout and interval
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @param {number} interval - Interval between checks in milliseconds
 * @returns {Promise<boolean>} - True if connected, false otherwise
 */
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

/**
 * Main application entry point
 */
async function main() {
	try {
		const flags = await import('./src/helper/connection/utils/check-flag.js');

		// console.clear();

		const isInternetConnected = await waitForInternetConnection(INTERNET_CHECK_TIMEOUT, INTERNET_CHECK_INTERVAL);

		if (!isInternetConnected) {
			process.exit(1);
		}

		printBanner();
		// printFlags(Object.entries(flags.cli.flags));

		await import('./src/index.js');
	} catch (error) {
		console.error(chalk.red('Fatal error during startup:'), error.message);
		process.exit(1);
	}
}

main();
