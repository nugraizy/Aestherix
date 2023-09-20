import path from 'path';
import dayjs from 'dayjs';

import configuration from '../../config/connect.js';
import { color, ERRLOG, loadFiles } from '../../../utils/modules/index.js';
import { ICON, normalizeImportPath, watch } from './cache.js';

export const loadCommands = async (OPTIONS) => {
	const commands = loadFiles('./src/commands');
	const folder = [];

	const time = dayjs().format('HH:mm:ss DD/MM');

	for (const command of commands) {
		if (command.includes('template')) {
			continue;
		}

		const file = normalizeImportPath(command);
		const normalize = path.normalize(command);

		try {
			const module = await import(file);

			if (!module?.default) {
				ERRLOG(
					`[${color(time, 'cyan')}]`,
					color(`${ICON.ADD} ${normalize.split('/').slice(-2).join('/')}`, '#9f53ea'),
					color('File Error! Waiting for changes...', 'red')
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

			folder.push(path.dirname(command));
		} catch {
			configuration.cmds.commands.set('UNKNOWN-' + Date.now(), {
				absolutePath: file,
				path: normalize
			});
		}
	}

	if (OPTIONS.watch) {
		new Set(folder).forEach(watch);
	}

	configuration.cmds.aliases.filter(Boolean);
};
