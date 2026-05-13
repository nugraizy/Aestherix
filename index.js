import dotenvx from '@dotenvx/dotenvx';

dotenvx.config({ quiet: true });

import 'dayjs/locale/id.js';
import './src/helper/prototypes.js';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import path from 'node:path';
import { platform } from 'node:process';

dayjs.locale('id');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.tz.setDefault('Asia/Jakarta');

const moduleURL = new URL(import.meta.url);

global.__dirname = platform === 'win32' ? path.dirname(moduleURL.pathname).slice(1) : path.dirname(moduleURL.pathname);
global.__botName = 'Aestherix';

import { checkNetwork } from './src/core/utils.js';
import { printBanner } from './src/utils/modules/color.js';
import { color, loggers } from './src/utils/modules/index.js';

const online = await checkNetwork();

if (!online) {
	loggers.error(color('No internet connection.', 'red'));
	process.exit(1);
}

printBanner();

await import('./src/index.js');
