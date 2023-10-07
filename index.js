import './src/helper/prototypes/prototypes.js';
import path from 'path';
import { platform } from 'process';
import dotenv from 'dotenv';

const moduleURL = new URL(import.meta.url);

export const __dirname = platform === 'win32' ? path.dirname(moduleURL.pathname).slice(1) : path.dirname(moduleURL.pathname);
global.__dirname = __dirname;

dotenv.config();

await import('./src/index.js');
