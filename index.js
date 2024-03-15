import './src/helper/prototypes.js';
import 'dotenv/config.js';

import path from 'path';
import { platform } from 'process';

import isInternetAvailable from './src/helper/connection/net.js';

const moduleURL = new URL(import.meta.url);

export const __dirname = platform === 'win32' ? path.dirname(moduleURL.pathname).slice(1) : path.dirname(moduleURL.pathname);
global.__dirname = __dirname;

await import('./src/helper/connection/utils/check-flag.js');

if (!(await isInternetAvailable())) {
	console.error('Internet connection is not available.\n Make sure to connect to the internet and try again.');
	process.exit(1);
}

console.log('Internet connection is available.');

await import('./src/index.js');
