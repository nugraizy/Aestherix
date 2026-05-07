import ora from 'ora';
import path from 'path';

import { color, loadFiles, loggers } from '../../../utils/modules/index.js';
import configuration from '../../config/connect.js';
import { normalizeImportPath, validatePlugins, watch } from './cache.js';
import { ModuleError, isMissingProperty } from './util.js';

/**
 *
 * @param {string} command
 * @param {{[key: string]: boolean}} OPTIONS
 * @param {import('ora').Ora} spinner
 * @returns
 */
const loadCommand = async (command, OPTIONS, spinner) =>
	new Promise(async (resolve) => {
		spinner && (spinner.text = loggers.warning(color('Loading', 'white'), color(command, 'purple'), { ignore: true }));

		const start = Date.now();
		const file = normalizeImportPath(command, true);
		const normalize = path.normalize(command);

		try {
			const module = await import(file);

			if (!module?.default) {
				configuration.cmds.commands.set('UNKNOWN-' + Date.now(), {
					absolutePath: file,
					path: normalize
				});

				spinner && spinner.clear();

				loggers.error(
					color(command, 'purple'),
					color(
						OPTIONS.watch
							? 'File Error as it has no default property! Waiting for changes...'
							: 'File Error as it has no default property! Fix the error and restart the bot to use this commands.',
						'red'
					)
				);

				resolve(null);
			}

			if (configuration.cmds.commands.has(module.default.name)) {
				spinner && spinner.clear();

				loggers.error(
					color(command, 'purple'),
					color('Has the same command name as the', 'white'),
					color(configuration.cmds.commands.get(module.default.name).path.split('/').slice(-2).join('/'), 'purple')
				);

				resolve(null);
			}

			const check = await isMissingProperty(module.default);

			check.absolutePath = file;
			check.path = normalize;

			configuration.cmds.commands.set(check.name, check);
			configuration.cmds.aliases.push(...(check?.aliases || []));

			const duration = Date.now() - start;

			await new Promise((resolve) => setTimeout(resolve, 100));

			spinner &&
				(spinner.text = loggers.info(
					color('Loaded', 'white'),
					color(command, 'purple'),
					color('in', 'white'),
					color(duration + 'ms', 'yellow'),
					{ ignore: true }
				));

			resolve(path.dirname(command));
		} catch (error) {
			spinner && spinner.clear();

			if (error instanceof ModuleError) {
				loggers.warning(color(command, 'purple'), error.info);
				configuration.cmds.commands.set('UNKNOWN-' + Date.now(), {
					absolutePath: file,
					path: normalize
				});
				resolve();
			}

			loggers.error(color(command, 'purple'), error.message);
			validatePlugins(command, OPTIONS.watch);

			configuration.cmds.commands.set('UNKNOWN-' + Date.now(), {
				absolutePath: file,
				path: normalize
			});

			resolve(null);
		}
	});

const folderToLoad = './src/commands';
const filesToExclude = ['template', 'd.ts'];
const filesToInclude = ['menu', 'ping', 'moderate', 'owner'];

const exclude = (file) => !filesToExclude.some((value) => file.includes(value));
const include = (file) => filesToInclude.some((value) => file.includes(value));

export const loadCommands = async (OPTIONS) => {
	return new Promise(async (resolve) => {
		const spinner = OPTIONS.spin
			? ora({
					text: 'Loading Plugins...',
					hideCursor: true,
					discardStdin: false
				}).start() // eslint-disable-line
			: null;

		const folders = new Set();
		let commands = loadFiles(folderToLoad).filter(exclude);

		if (configuration.OPTIONS.test) {
			commands = commands.filter(include);
		}

		await Promise.all(
			commands.map(async (command) => {
				const folder = await loadCommand(command, OPTIONS, spinner);

				if (folder) {
					folders.add(folder);
				}
			})
		);

		(spinner &&
			spinner.stopAndPersist({
				text: loggers.info(color('Loaded all the plugins.', 'white'), { ignore: true }),
				symbol: ''
			})) ||
			loggers.info(color('Loaded all the plugins.', 'white'));

		if (OPTIONS.watch) {
			await watch(commands, {
				alwaysStat: false
			});
		}

		configuration.cmds.aliases.filter(Boolean);

		resolve();
	});
};
