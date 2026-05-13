import 'dayjs/locale/id.js';
import './src/helper/prototypes.js';

import dotenvx from '@dotenvx/dotenvx';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import path from 'path';
import { platform } from 'process';

import { initializeDashboardMonitor } from './src/core/dashboard/monitor.js';
import { server } from './src/core/dashboard/server.js';
import configuration from './src/helper/config/connect.js';

dotenvx.config({
	quiet: true
});

dayjs.locale('id');
dayjs.extend(timezone);
dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.tz.setDefault('Asia/Jakarta');

const moduleURL = new URL(import.meta.url);

global.__dirname = platform === 'win32' ? path.dirname(moduleURL.pathname).slice(1) : path.dirname(moduleURL.pathname);
global.__botName = 'Aestherix Dashboard';

configuration.cli = configuration.cli || {};
configuration.flags = configuration.flags || {};

await initializeDashboardMonitor(configuration);
server();
