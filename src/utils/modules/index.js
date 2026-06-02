import chalk from 'chalk';

import { Logger } from '../../core/logger.js';

export { color } from './color.js';

export * from './http.js';
export * from './upload.js';
export * from './format.js';
export * from './string.js';
export * from './array.js';
export * from './math.js';
export * from './time.js';
export * from './file.js';
export * from './validation.js';
export * from './cloudflare.js';
export * from './manual-solve-error.js';
export * from './solver-manager.js';

export const boldify = (string) => chalk.bold(string);

export const loggers = new Logger();

export const getFunctions = (module) => {
	return Object.keys(module).filter((key) => typeof module[key] === 'function');
};
