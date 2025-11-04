import 'dayjs/locale/id.js';
import 'dotenv/config.js';
import './src/helper/prototypes.js';

import axios from 'axios';
import chalk from 'chalk';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import ora from 'ora';
import path from 'path';
import { platform } from 'process';
import table from 'text-table';

dayjs.locale('id');
dayjs.extend(timezone);
dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.tz.setDefault('Asia/Jakarta');

import isInternetAvailable from './src/helper/connection/net.js';
import { printBanner } from './src/utils/modules/color.js';

const moduleURL = new URL(import.meta.url);

export const __dirname = platform === 'win32' ? path.dirname(moduleURL.pathname).slice(1) : path.dirname(moduleURL.pathname);
global.__dirname = __dirname;

const printFlags = (flags) => {
	const isAscending = false;

	flags = flags.sort(([a], [b]) => (isAscending ? a.localeCompare(b) : b.localeCompare(a)));
	const columns = 3;
	const rows = Math.ceil(flags.length / columns);
	const columnSpacing = 9;
	const pad = ' '.repeat(columnSpacing);

	const data = Array.from({ length: rows }, (_, r) =>
		Array.from({ length: columns }, (_, c) => {
			const i = r + c * rows;
			const [key, value] = flags[i] || [];

			const boolText = value ? chalk.green('true') : chalk.grey('false');

			return key ? `${key.padEnd(14).capitalize()} ${boolText}${pad}` : '';
		})
	);

	console.log(table(data));
};

const waitForViteConnection = async (timeout = 10000, interval = 1000) => {
	const spinner = ora('Checking Vite server...').start();
	const viteUrl = 'http://localhost:5173';
	const startTime = Date.now();

	while (Date.now() - startTime < timeout) {
		try {
			await axios.head(viteUrl, { timeout: 1000 });
			spinner.succeed(chalk.green('Vite server is running.'));
			return true;
		} catch {
			spinner.text = 'Waiting for Vite server to start. Please run "npm run dev:react".';
			await new Promise((resolve) => setTimeout(resolve, interval));
		}
	}

	spinner.fail('Vite server is not running. Please run "npm run dev:react".');
	return false;
};

const waitForInternetConnection = async (timeout = 10000, interval = 1000) => {
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
	const flags = await import('./src/helper/connection/utils/check-flag.js');

	console.clear();

	const isInternetConnected = await waitForInternetConnection(20_000);

	if (!isInternetConnected) {
		process.exit(0);
	}

	const isViteConnected = await waitForViteConnection(20_000);

	if (!isViteConnected) {
		process.exit(0);
	}

	printBanner();
	printFlags(Object.entries(flags.cli.flags));

	await import('./src/index.js');
}

main();
