import { pathToFileURL } from 'url';
import fs from 'fs-extra';
import dayjs from 'dayjs';

import configuration from '../../config/connect.js';
import { color, ERRLOG, INFOLOG, loadFiles } from '../../../utils/modules/index.js';

export const nocache = async (module) => {
	const tempModules = `${module}?update=${Date.now()}`;

	return await import(tempModules);
};

export const watchFile = (module) => {
	const modules = process.platform === 'win32' ? decodeURI(module.pathname.slice(1)) : decodeURI(module.pathname);

	fs.watchFile(module, async () => {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (fs.existsSync(module)) {
			INFOLOG(`[${color(time, 'cyan')}]`, color(`${modules?.split('/')?.reverse()[0]} has been changed`, '#9f53ea'));
			await reloadModule(module, false);
		} else {
			await reloadModule(module, true, modules);
		}
	});
};

export const reloadModule = async (module, isNewFile, newFilePath) => {
	if (isNewFile) {
		try {
			const time = dayjs().format('HH:mm:ss DD/MM');
			const commands = await new Promise(async (resolve) => {
				const files = (
					await Promise.all(
						loadFiles('./src/commands').map(async (v) => {
							const modules =
								process.platform === 'win32'
									? decodeURI(pathToFileURL(v).pathname.slice(1))
									: decodeURI(pathToFileURL(v).pathname);
							const module = (await import(pathToFileURL(modules))).default;

							return { ...module, pathname: modules };
						})
					)
				)
					.filter((v) => v.status === 'enable')
					.map((v) => v.pathname);

				resolve(files);
			});
			let afterCommands;
			let renamedCommand;

			for (const commandModule of configuration.commandsPath) {
				let status = false;

				if (fs.existsSync(commandModule)) {
					status = true;
				}

				if (!status) {
					renamedCommand = commands.filter((v) => !configuration.commandsPath.includes(v))[0];
					afterCommands = commandModule;
					break;
				}
			}

			try {
				configuration.commandsPath.push(renamedCommand);
				configuration.commandsPath.splice(configuration.commandsPath.indexOf(afterCommands), 1);
				const cmd = (await import(pathToFileURL(renamedCommand))).default;

				configuration.cmds.commands.set(cmd.name, cmd);
				watchFile(pathToFileURL(renamedCommand), cmd.name);
				fs.unwatchFile(module);
			} catch (e) {
				console.log(e);
				configuration.commandsPath.splice(configuration.commandsPath.indexOf(newFilePath), 1);
				configuration.cmds.commands.delete(
					Array.from(configuration.cmds.commands.values()).find((v) => v.pathname === newFilePath).name
				);
				fs.unwatchFile(module);
				return ERRLOG(`[${color(time, 'cyan')}]`, color(`⚠️ ${newFilePath.split('/').reverse()[0]} is deleted`, 'red'));
			} finally {
				INFOLOG(
					`[${color(time, 'cyan')}]`,
					color(
						`${newFilePath.split('/').reverse()[0]} has been renamed to ${renamedCommand.split('/').reverse()[0]}`,
						'#9f53ea'
					)
				);
			}
		} catch (e) {
			console.log(e);
		}
		return;
	}

	try {
		fs.unwatchFile(module);
		const cmd = (await nocache(module)).default;

		configuration.cmds.commands.delete(cmd.name);
		configuration.cmds.commands.set(cmd.name, cmd);
		watchFile(module);
	} catch (e) {
		console.log(e);
	}
};
