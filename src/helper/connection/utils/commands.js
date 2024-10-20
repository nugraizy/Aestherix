import path from 'path';

import configuration from '../../config/connect.js';
import { color, loadFiles, loggers } from '../../../utils/modules/index.js';
import { normalizeImportPath, watch, validatePlugins } from './cache.js';
import { add, fail, success, spinner } from './spinners.js';

const loadCommand = async (command, OPTIONS) => {
	const start = Date.now();
	const file = normalizeImportPath(command, true);
	const normalize = path.normalize(command);

	add(command, spinner);

	try {
		const module = await import(file);

		if (!module?.default) {
			loggers.ERR(
				color(normalize.split('/').slice(-2).join('/'), '#9f53ea'),
				OPTIONS.watch
					? color('File Error! Waiting for changes...', '#FF5555')
					: color('File Error! Fix the error and restart the bot to use this commands.', '#FF5555')
			);
			configuration.cmds.commands.set('UNKNOWN-' + Date.now(), {
				absolutePath: file,
				path: normalize
			});
			return null;
		}

		module.default.absolutePath = file;
		module.default.path = normalize;

		configuration.cmds.commands.set(module.default.name, module.default);
		configuration.cmds.aliases.push(...module.default.aliases);

		const duration = Date.now() - start;
		success(command, duration, spinner);

		return path.dirname(command);
	} catch (e) {
		fail(command, spinner, e.message);
		validatePlugins(command, OPTIONS.watch, spinnies);

		configuration.cmds.commands.set('UNKNOWN-' + Date.now(), {
			absolutePath: file,
			path: normalize
		});

		return null;
	}
};

const dontInclude = (file) => !(file.includes('template') || file.includes('d.ts'));

export const loadCommands = async (OPTIONS) => {
	return new Promise(async (resolve) => {
		const folders = new Set();
		const commands = loadFiles('./src/commands').filter(dontInclude);

		for await (const command of commands) {
			const folder = await loadCommand(command, OPTIONS);

			if (folder) {
				folders.add(folder);
			}
		}

		// await Promise.all(
		// 	commands.map(async (command) => {
		// 		if (command.includes('template') || command.includes('d.ts')) {
		// 			return;
		// 		}

		// 		const folder = await loadCommand(command, OPTIONS);

		// 		if (folder) {
		// 			folders.add(folder);

		// 			return {
		// 				file: command
		// 			};
		// 		}
		// 	})
		// );

		if (OPTIONS.watch) {
			await watch('./src/commands/**/*.js', {
				alwaysStat: false,
				ignored: (path) => path.includes('template.example.js')
			});
		}

		configuration.cmds.aliases.filter(Boolean);

		resolve();
	});
};
