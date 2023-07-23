import './src/helper/prototypes/prototypes.js';
import path from 'path';
import { platform } from 'process';

const moduleURL = new URL(import.meta.url);

export const __dirname = platform === 'win32' ? path.dirname(moduleURL.pathname).slice(1) : path.dirname(moduleURL.pathname);
global.__dirname = __dirname;

await import('./src/index.js');
