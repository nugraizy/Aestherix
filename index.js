import './src/helper/prototypes.js';
import 'dotenv/config.js';

import path from 'path';
import { platform } from 'process';

import isInternetAvailable from './src/helper/connection/net.js';
import { printBanner } from './src/utils/modules/color.js';

const moduleURL = new URL(import.meta.url);

export const __dirname = platform === 'win32' ? path.dirname(moduleURL.pathname).slice(1) : path.dirname(moduleURL.pathname);
global.__dirname = __dirname;

console.clear();

console.warn('Checking internet connection.');

if (!(await isInternetAvailable())) {
	console.error('Internet connection is not available.\nMake sure to connect to the internet and try again.');
	process.exit(1);
}

await import('./src/helper/connection/utils/check-flag.js');

console.log('Internet connection is available.');
printBanner();

await import('./src/index.js');
