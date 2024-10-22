import path from 'path';
import chokidar from 'chokidar';
import fs from 'fs-extra';
import syntaxError from 'syntax-error';
import os from 'os';
import chalk from 'chalk';

import configuration from '../../config/connect.js';
import { color, loggers, loadFiles } from '../../../utils/modules/index.js';
import { isMissingProperty } from './util.js';

/**
 * @type {{name: string, id: string}[]}
 */
const conctactsDatabases = fs.readJSONSync('./databases/users/contacts.json');

const hostPlatform = os.platform();

const nocache = (module, newFile = false) => {
	let param = '?v=' + Date.now();
	const newPath = module + (newFile ? param : '');

	return { import: import(newPath), param };
};

export const normalizeImportPath = (file, asURL = false) => {
	const absolutePath = path.resolve(file);

	if (asURL) {
		return hostPlatform === 'win32' ? `file://${absolutePath.replace(/\\/g, '/')}` : `file://${absolutePath}`;
	} else {
		return absolutePath;
	}
};

/**
 * @param {import('../../../types/Socket/index.js').Store} store
 * @param {{name: string, id: string}[]} contactsList
 */
export const initContact = (store, contactsList) => {
	if (!contactsList.length) {
		for (const { id, name } of conctactsDatabases) {
			store.localContacts[id] = { name, id };
		}
	}

	if (!conctactsDatabases.length) {
		fs.writeJSONSync('./databases/users/contacts.json', contactsList);
	}

	const freshContactsDatabases = fs.readJSONSync('./databases/users/contacts.json');

	if (!Object.keys(store.localContacts).length) {
		for (const { id, name } of contactsList) {
			const index = freshContactsDatabases.findIndex((v) => v.id === id);

			if (index !== -1) {
				freshContactsDatabases[index].name = name;
			}

			store.localContacts[id] = { name, id };
		}
	}

	fs.writeJSONSync('./databases/users/contacts.json', freshContactsDatabases);
};

export const updateContact = (store, contactsList) => {
	const freshContactsDatabases = fs.readJSONSync('./databases/users/contacts.json');

	const { localContacts } = store;

	const contactsValue = Object.keys(localContacts);

	for (const { id, notify, verifiedName, name } of contactsList) {
		if (contactsValue.includes(id)) {
			localContacts[id].name = name || notify || verifiedName;

			if (conctactsDatabases.length !== 0) {
				if (freshContactsDatabases?.[freshContactsDatabases.findIndex((v) => v.id === id)]?.name) {
					freshContactsDatabases[freshContactsDatabases.findIndex((v) => v.id === id)].name = name || notify || verifiedName;
				}
			}

			continue;
		}

		localContacts[id] = { name: name || notify || verifiedName || 'Unknown', id };
		freshContactsDatabases.push({ name: name || notify || verifiedName || 'Unknown', id });
	}

	fs.writeJSONSync('./databases/users/contacts.json', freshContactsDatabases);
};

const handlePluginError = (filename) => {
	loggers.ERR(
		color(filename.split('/').slice(-2).join('/'), '#BD93F9'),
		color('File Error! Waiting for changes...', '#5954cc')
	);
	configuration.cmds.commands.set('UNKNOWN-' + Date.now(), {
		absolutePath: normalizeImportPath(filename),
		path: filename
	});
};

export const validatePlugins = async (filename, isWatch) => {
	const normalizedPath = normalizeImportPath(filename);

	const str = (await fs.readFile(normalizedPath, { encoding: 'utf-8' })).replace(/\t/g, '    ');

	const syntax = syntaxError(str, normalizedPath, {
		allowReturnOutsideFunction: true,
		allowAwaitOutsideFunction: true,
		sourceType: 'module'
	});

	if (!syntax) {
		return;
	}

	const [, path, error, arrow, typeError] = String(syntax).split('\n');

	const codesArr = str.split('\n');
	const indexCode = codesArr.findIndex((v) => v.includes(error));

	if (indexCode === -1) {
		loggers.ERR(
			color(filename.split('/').slice(-2).join('/'), '#BD93F9'),
			isWatch
				? color('Syntax Error! Waiting for changes...', '#5954cc')
				: color('Syntax Error! Fix the error and restart the bot.', '#5954cc')
		);
		return;
	}

	loggers.ERR(
		color(filename.split('/').slice(-2).join('/'), '#BD93F9'),
		isWatch
			? color('File Error! Waiting for changes...', '#5954cc')
			: color('File Error! Fix the error and restart the bot to use this commands.', '#5954cc')
	);

	const firstCode = codesArr[indexCode - 1] || '';
	const secondCode = codesArr[indexCode + 1] || '';

	const firstLine = Math.max(0, syntax.line - 1);
	const currentLine = syntax.line;
	const secondLine = syntax.line + 1;

	const longestLineLength = Math.max(String(firstLine).length, String(currentLine).length, String(secondLine).length);

	const linePadding = (line) => ' '.repeat(longestLineLength - String(line).length + 2);

	console.log(`  ${linePadding(firstLine)}`, chalk.gray('⇢', path));
	console.log(`  ${linePadding(secondLine)}`, chalk.gray('⇢', typeError));

	if (firstLine > 0) {
		console.log(chalk.gray(`  ${linePadding(firstLine)}${firstLine}:`), chalk.hex('#fff')(firstCode));
	}

	console.log('  ' + chalk.bold.hex('#fff').bgRed(`${linePadding(currentLine)}${currentLine}: ${error}`));
	console.log(
		chalk.gray(`  ${linePadding(currentLine)}${' '.repeat(longestLineLength)}:`) + chalk.bold.hex('#fff')(arrow + '^^')
	);

	console.log(chalk.gray(`  ${linePadding(secondLine)}${secondLine}:`), chalk.hex('#fff')(secondCode));
};

const add = async (filename) => {
	if (configuration.isFirstConnection) {
		return;
	}

	const existingCommands = Array.from(configuration.cmds.commands.entries());
	const fileExists = existingCommands.some(([_, command]) => command.path === filename);
	const files = loadFiles('./src/commands').filter((v) => !v.includes('template'));

	const file = normalizeImportPath(filename, true);
	const displayName = filename.split('/').slice(-2).join('/');

	if (!fileExists && files.length !== existingCommands.length) {
		try {
			const module = await import(file);
			if (module?.default) {
				if (configuration.cmds.commands.has(module.default.name)) {
					loggers.ERR(
						color(displayName, '#BD93F9'),
						'Has the same command name as the',
						color(configuration.cmds.commands.get(module.default.name).path.split('/').slice(-2).join('/'))
					);

					return;
				}

				const check = isMissingProperty(module.default);

				if (!check.status) {
					loggers.WRN(color(displayName, '#BD93F9'), check.message);

					if (check.shouldStop) {
						return;
					}
				}

				configuration.cmds.commands.set(module.default.name, {
					...module.default,
					absolutePath: file,
					path: filename
				});
				loggers.INF(color(displayName, '#BD93F9'), 'New plugin loaded');
			} else {
				handlePluginError(filename);
			}
		} catch (error) {
			await validatePlugins(filename, true);
		}
	}
};

const change = async (filename) => {
	const displayName = filename?.split('/').slice(-2).join('/');
	loggers.WRN(color(displayName, '#BD93F9'), color('File has been changed!', 'white'));

	const normalizedPath = normalizeImportPath(filename, true);
	const _command = nocache(normalizedPath, true);

	const cmds = configuration.cmds.commands.entries();
	const index = cmds.findIndex((v) => v[1].path === filename);

	if (index === -1) {
		return loggers.ERR(color(displayName, '#BD93F9'), color('Command not found in configuration!', '#FF5555'));
	}

	try {
		const command = (await _command.import)?.default;

		if (!command) {
			loggers.ERR(
				color(displayName, '#BD93F9'),
				color('File does not contain valid Command Properties! Please check the example to create new commands.', '#05ffa1')
			);
			return;
		}

		const commandPath = configuration.cmds.commands.get(command.name).path.split('/').slice(-2).join('/');
		if (configuration.cmds.commands.has(command.name) && displayName !== commandPath) {
			loggers.ERR(color(displayName, '#BD93F9'), 'Has the same command name as the', color(commandPath, '#BD93F9 '));

			return;
		}

		const check = isMissingProperty(command);

		if (!check.status) {
			loggers.WRN(color(displayName, '#BD93F9'), check.message);

			if (check.shouldStop) {
				return;
			}
		}

		const currentCommand = cmds[index][1];
		loggers.INF(color(currentCommand.path?.split('/').slice(-2).join('/'), '#BD93F9'), color('File Reloaded!', '#05ffa1'));

		let _commandName = cmds[index][0];

		if (_commandName !== command.name) {
			configuration.cmds.commands.delete(_commandName);
			_commandName = command.name;
		}

		configuration.cmds.commands.set(_commandName, {
			...command,
			absolutePath: currentCommand.absolutePath,
			path: currentCommand.path
		});
	} catch (error) {
		await validatePlugins(filename, true);
	}
};

const unlink = (filename) => {
	const displayName = filename?.split('/')?.slice(-2).join('/');
	const cmds = configuration.cmds.commands.entries();
	const indexPath = cmds.findIndex((v) => v[1].path === filename);

	if (indexPath === -1) {
		return;
	}

	const commandFiles = loadFiles('./src/commands').filter((v) => !v.includes('template'));
	const existingPaths = cmds.map((v) => v[1].path);
	const normalizedCommands = commandFiles.map((c) => path.normalize(c));

	const renamedFile = normalizedCommands.find((v) => !existingPaths.includes(v));

	if (renamedFile) {
		const file = cmds[indexPath];

		configuration.cmds.commands.delete(file[0]);

		file[1].path = renamedFile;
		file[1].absolutePath = normalizeImportPath(renamedFile);

		configuration.cmds.commands.set(file[0], file[1]);

		loggers.WRN(
			color(displayName, '#BD93F9'),
			color('File Renamed!', 'white'),
			color('to', 'white'),
			color(renamedFile.split('/')?.slice(-2).join('/'), '#BD93F9'),
			color('Waiting for changes...', '#BD93F9')
		);
	} else {
		configuration.cmds.commands.delete(cmds[indexPath][0]);

		loggers.WRN(color(displayName, '#BD93F9'), color('File Deleted!', '#5954cc'));
	}
};

export const watch = (folder, options) =>
	new Promise((resolve) => {
		chokidar
			.watch(folder, options)
			.on('add', (path) => add(path))
			.on('change', (path) => change(path))
			.on('unlink', (path) => unlink(path))
			.on('ready', () => {
				configuration.isFirstConnection = false;
				resolve();
			});
	});
