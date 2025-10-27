import 'dotenv/config.js';
import './src/helper/prototypes.js';

import axios from 'axios';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import path from 'path';
import { platform } from 'process';

dayjs.extend(timezone);
dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.tz.setDefault('Asia/Jakarta');

import isInternetAvailable from './src/helper/connection/net.js';
import { printBanner } from './src/utils/modules/color.js';

const moduleURL = new URL(import.meta.url);

export const __dirname = platform === 'win32' ? path.dirname(moduleURL.pathname).slice(1) : path.dirname(moduleURL.pathname);
global.__dirname = __dirname;

async function main() {
	console.clear();
	console.warn('Checking internet connection.');

	const online = await isInternetAvailable();

	if (!online) {
		console.error('Internet connection is not available.\nMake sure to connect to the internet and try again.');
		process.exit(1);
	}

	axios.head('http://localhost:5173').catch(() => {
		throw new Error('Vite server is not running. Please run "npm run dev:react".');
	});

	await import('./src/helper/connection/utils/check-flag.js');

	console.log('Internet connection is available.');
	printBanner();

	await import('./src/index.js');
}

main();
