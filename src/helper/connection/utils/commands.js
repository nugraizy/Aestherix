import { pathToFileURL } from 'url';
import path from 'path';

import configuration from '../../config/connect.js';
import { color, ERRLOG, loadFiles } from '../../../utils/modules/index.js';
import { watchFile } from './cache.js';

export const loadCommands = async (OPTIONS, __dirname) => {
	const commands = loadFiles('./src/commands');

	const container = [];

	(
		await Promise.all(
			commands.map((v) => {
				container.push({ pathname: v });

				return import(pathToFileURL(path.join(__dirname, v)));
			})
		)
	).forEach((v, i) => (container[i].imports = v));

	for (const obj of container) {
		try {
			const cmd = obj.imports.default;

			if (cmd.status !== 'disable') {
				if (OPTIONS.watch) {
					await watchFile(pathToFileURL(path.join(__dirname, obj.pathname)), cmd.name);
				}

				const modules =
					process.platform === 'win32'
						? pathToFileURL(path.join(__dirname, obj.pathname)).pathname.slice(1)
						: pathToFileURL(path.join(__dirname, obj.pathname)).pathname;

				configuration.cmds.commands.set(cmd.name, { ...cmd, pathname: decodeURI(modules) });
				configuration.cmds.aliases = [...cmd.aliases, ...configuration.cmds.aliases];
				configuration.commandsPath.push(decodeURI(modules));
			}
		} catch (e) {
			console.log(e);
			ERRLOG(`${color(obj.pathname, 'red')} ${color('is causing error. Please check the file before running.', 'white')}`);
			process.exit(0);
		}
	}
};
