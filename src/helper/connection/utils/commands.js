import path from 'path';

import { color, loadFiles, loggers } from '../../../utils/modules/index.js';
import configuration from '../../config/connect.js';
import { normalizeImportPath, validatePlugins, watch } from './cache.js';
import { ModuleError, isMissingProperty } from './util.js';

/**
 *
 * @param {string} command
 * @param {{[key: string]: boolean}} OPTIONS
 * @returns
 */
const loadCommand = async (command, OPTIONS, seenErrors) =>
	new Promise(async (resolve) => {
		const file = normalizeImportPath(command, true);
		const normalize = path.normalize(command);

		try {
			const module = await import(file);

			if (!module?.default) {
				configuration.cmds.commands.set('UNKNOWN-' + Date.now(), {
					absolutePath: file,
					path: normalize
				});

				loggers.error(
					color(command, 'purple'),
					color(
						OPTIONS.watch
							? 'File Error as it has no default property! Waiting for changes...'
							: 'File Error as it has no default property! Fix the error and restart the bot to use this commands.',
						'red'
					)
				);

				return resolve(null);
			}

			if (configuration.cmds.commands.has(module.default.name)) {
				loggers.error(
					color(command, 'purple'),
					color('Has the same command name as the', 'white'),
					color(configuration.cmds.commands.get(module.default.name).path.split('/').slice(-2).join('/'), 'purple')
				);

				return resolve(null);
			}

			const check = await isMissingProperty(module.default);

			check.absolutePath = file;
			check.path = normalize;

			configuration.cmds.commands.set(check.name, check);
			configuration.cmds.aliases.push(...(check?.aliases || []));

			await new Promise((resolve) => setTimeout(resolve, 100));

			resolve(path.dirname(command));
		} catch (error) {
			if (error instanceof ModuleError) {
				loggers.warning(color(command, 'purple'), error.info);
				configuration.cmds.commands.set('UNKNOWN-' + Date.now(), {
					absolutePath: file,
					path: normalize
				});
				return resolve();
			}

			const key = String(error?.message || error);

			if (!seenErrors.has(key)) {
				seenErrors.add(key);
				loggers.error(color(command, 'purple'), key);
				validatePlugins(command, OPTIONS.watch);
			}

			configuration.cmds.commands.set('UNKNOWN-' + Date.now(), {
				absolutePath: file,
				path: normalize
			});

			return resolve(null);
		}
	});

const folderToLoad = './src/commands';
const filesToExclude = ['template', 'd.ts'];
const filesToInclude = ['menu', 'ping', 'moderate', 'owner'];

const exclude = (file) => !filesToExclude.some((value) => file.includes(value));
const include = (file) => filesToInclude.some((value) => file.includes(value));

export const loadCommands = async (OPTIONS) => {
	return new Promise(async (resolve) => {
		const folders = new Set();
		const seenErrors = new Set();
		let commands = loadFiles(folderToLoad).filter(exclude);

		if (configuration.OPTIONS.test) {
			commands = commands.filter(include);
		}

		await Promise.all(
			commands.map(async (command) => {
				const folder = await loadCommand(command, OPTIONS, seenErrors);

				if (folder) {
					folders.add(folder);
				}
			})
		);

		loggers.info(color('Loaded all the plugins.', 'white'));

		if (OPTIONS.watch) {
			const watchPath = path.resolve(folderToLoad);

			await watch(watchPath, {
				ignoreInitial: true,
				ignored: /(template|\.d\.ts$)/
			});
		}

		configuration.cmds.aliases.filter(Boolean);

		resolve();
	});
};
