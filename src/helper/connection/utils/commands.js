import path from 'path';

import configuration from '../../config/connect.js';
import { color, loadFiles, loggers } from '../../../utils/modules/index.js';
import { normalizeImportPath, watch, validatePlugins } from './cache.js';
import { ModuleError, isMissingProperty } from './util.js';

const loadCommand = async (command, OPTIONS) => {
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
			loggers.error(
				color(command, '#BD93F9'),
				color(
					OPTIONS.watch
						? 'File Error as it has no default property! Waiting for changes...'
						: 'File Error as it has no default property! Fix the error and restart the bot to use this commands.',
					'#FF5555'
				)
			);

			return null;
		}

		if (configuration.cmds.commands.has(module.default.name)) {
			loggers.error(
				color(command, '#BD93F9'),
				color('Has the same command name as the', 'white'),
				color(configuration.cmds.commands.get(module.default.name).path.split('/').slice(-2).join('/'), '#BD93F9')
			);

			return null;
		}

		const check = await isMissingProperty(module.default);

		check.absolutePath = file;
		check.path = normalize;

		configuration.cmds.commands.set(check.name, check);
		configuration.cmds.aliases.push(...(check?.aliases || []));

		const duration = Date.now() - start;

		loggers.info(color('Loaded', 'white'), color(command, '#BD93F9'), color('in', 'white'), color(duration + 'ms', '#F1FA8C'));

		return path.dirname(command);
	} catch (error) {
		if (error instanceof ModuleError) {
			loggers.warning(color(command, '#BD93F9'), error.info);
			configuration.cmds.commands.set('UNKNOWN-' + Date.now(), {
				absolutePath: file,
				path: normalize
			});
			return;
		}

		loggers.error(color(command, '#BD93F9'), error.message);
		validatePlugins(command, OPTIONS.watch);

		configuration.cmds.commands.set('UNKNOWN-' + Date.now(), {
			absolutePath: file,
			path: normalize
		});

		return null;
	}
};

const folderToLoad = './src/commands';
const filesToExclude = ['template', 'd.ts'];
const filesToInclude = ['menu', 'ping', 'moderate', 'owner'];

const exclude = (file) => !filesToExclude.some((value) => file.includes(value));
const include = (file) => filesToInclude.some((value) => file.includes(value));

export const loadCommands = async (OPTIONS) => {
	return new Promise(async (resolve) => {
		const folders = new Set();
		let commands = loadFiles(folderToLoad).filter(exclude);

		if (configuration.OPTIONS.test) {
			commands = commands.filter(include);
		}

		for await (const command of commands) {
			const folder = await loadCommand(command, OPTIONS);

			if (folder) {
				folders.add(folder);
			}
		}

		if (OPTIONS.watch) {
			await watch(commands, {
				alwaysStat: false
			});
		}

		configuration.cmds.aliases.filter(Boolean);

		resolve();
	});
};
