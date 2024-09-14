import path from 'path';

import configuration from '../../config/connect.js';
import { color, loadFiles } from '../../../utils/modules/index.js';
import { ICON, normalizeImportPath, watch, validatePlugins } from './cache.js';

export const loadCommands = async (OPTIONS) => {
	return new Promise(async (resolve) => {
		const commands = loadFiles('./src/commands');
		const folders = [];

		for (const command of commands) {
			if (command.includes('template') || command.includes('d.ts')) {
				continue;
			}

			const file = normalizeImportPath(command);
			const normalize = path.normalize(command);

			try {
				const module = await import(file);

				if (!module?.default) {
					loggers.ERR(
						color(`${ICON.ERROR}${normalize.split('/').slice(-2).join('/')}`, '#9f53ea'),
						OPTIONS.watch
							? color('File Error! Waiting for changes...', '#FF5555')
							: color('File Error! Fix the error and restart the bot to use this commands.', '#FF5555')
					);
					configuration.cmds.commands.set('UNKNOWN-' + Date.now(), {
						absolutePath: file,
						path: normalize
					});
					continue;
				}

				module.default.absolutePath = file;
				module.default.path = normalize;

				configuration.cmds.commands.set(module.default.name, module.default);
				configuration.cmds.aliases.push(...module.default.aliases);

				folders.push(path.dirname(command));
			} catch (e) {
				if (!OPTIONS.watch) {
					validatePlugins(command, false);
				}

				configuration.cmds.commands.set('UNKNOWN-' + Date.now(), {
					absolutePath: file,
					path: normalize
				});
			}
		}

		if (OPTIONS.watch) {
			for (const folder of new Set(folders)) {
				await watch(folder);
			}
		}

		configuration.cmds.aliases.filter(Boolean);

		resolve();
	});
};
