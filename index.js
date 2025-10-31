import 'dayjs/locale/id.js';
import 'dotenv/config.js';
import './src/helper/prototypes.js';

import axios from 'axios';
import chalk from 'chalk';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
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

async function main() {
	const flags = await import('./src/helper/connection/utils/check-flag.js');

	console.clear();
	console.warn('Checking internet connection.');

	const online = await isInternetAvailable();

	console.clear();

	if (!online) {
		console.error('Internet connection is not available.\nMake sure to connect to the internet and try again.');
		process.exit(1);
	}

	console.log(chalk.green('Internet connection is available.'));

	axios.head('http://localhost:5173').catch(() => {
		throw new Error('Vite server is not running. Please run "npm run dev:react".');
	});

	printBanner();
	printFlags(Object.entries(flags.cli.flags));

	await import('./src/index.js');
}

main();
