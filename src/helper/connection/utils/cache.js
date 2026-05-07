import chalk from 'chalk';
import chokidar from 'chokidar';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import syntaxError from 'syntax-error';

import { color, loadFiles, loggers } from '../../../utils/modules/index.js';
import configuration from '../../config/connect.js';
import { getAllContacts, upsertContacts } from '../../database/adapters/user.js';
import prisma from '../../database/prisma.js';
import { ModuleError, isMissingProperty } from './util.js';

const hostPlatform = os.platform();

let contactsDbCache = null;

const getContactsCache = async () => {
	if (!contactsDbCache) {
		contactsDbCache = await getAllContacts(prisma).catch(() => []);
	}

	return contactsDbCache;
};

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
export const initContact = async (store, contactsList) => {
	const storedContacts = await getContactsCache();

	if (!contactsList.length) {
		for (const { id, name } of storedContacts) {
			store.localContacts[id] = { name, id };
		}
	}

	if (contactsList.length) {
		const toUpsert = contactsList.map(({ id, name }) => ({ jid: id, name: name || 'Unknown' }));

		await upsertContacts(prisma, toUpsert).catch(() => {});
		contactsDbCache = null;

		for (const { id, name } of contactsList) {
			store.localContacts[id] = { name, id };
		}
	}
};

export const updateContact = async (store, contactsList) => {
	const { localContacts } = store;
	const contactsValue = Object.keys(localContacts);
	const toUpsert = [];

	for (const { id, notify, verifiedName, name } of contactsList) {
		const resolvedName = name || notify || verifiedName || 'Unknown';

		if (contactsValue.includes(id)) {
			localContacts[id].name = resolvedName;
		} else {
			localContacts[id] = { name: resolvedName, id };
		}

		toUpsert.push({ jid: id, name: resolvedName });
	}

	if (toUpsert.length) {
		await upsertContacts(prisma, toUpsert).catch(() => {});
		contactsDbCache = null;
	}
};

const handlePluginError = (filename) => {
	loggers.error(
		color(filename.split('/').slice(-2).join('/'), 'purple'),
		color('File Error! Waiting for changes...', 'indigo')
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
		loggers.error(
			color(filename.split('/').slice(-2).join('/'), 'purple'),
			isWatch
				? color('Syntax Error! Waiting for changes...', 'indigo')
				: color('Syntax Error! Fix the error and restart the bot.', 'indigo')
		);
		return;
	}

	loggers.error(
		color(filename.split('/').slice(-2).join('/'), 'purple'),
		isWatch
			? color('File Error! Waiting for changes...', 'indigo')
			: color('File Error! Fix the error and restart the bot to use this commands.', 'indigo')
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
	const fileExists = existingCommands.some(([, command]) => command.path === filename);
	const files = loadFiles('./src/commands').filter((v) => !v.includes('template'));

	const file = normalizeImportPath(filename, true);
	const displayName = filename.split('/').slice(-2).join('/');

	if (!fileExists && files.length !== existingCommands.length) {
		try {
			const module = await import(file);

			if (module?.default) {
				if (configuration.cmds.commands.has(module.default.name)) {
					loggers.error(
						color(displayName, 'purple'),
						'Has the same command name as the',
						color(configuration.cmds.commands.get(module.default.name).path.split('/').slice(-2).join('/'))
					);

					return;
				}

				const check = await isMissingProperty(module.default);

				configuration.cmds.commands.set(module.default.name, {
					...check,
					absolutePath: file,
					path: filename
				});
				loggers.info(color(displayName, 'purple'), 'New plugin loaded');
			} else {
				handlePluginError(filename);
			}
		} catch (error) {
			if (error instanceof ModuleError) {
				loggers.warning(color(displayName, 'purple'), error.info);
				return;
			}

			await validatePlugins(filename, true);
		}
	}
};

const change = async (filename) => {
	const displayName = filename?.split('/').slice(-2).join('/');

	const normalizedPath = normalizeImportPath(filename, true);
	const _command = nocache(normalizedPath, true);

	const cmds = configuration.cmds.commands.entries();
	const index = cmds.findIndex((v) => v[1].path === filename);

	if (index === -1) {
		return loggers.error(color(displayName, 'purple'), color('Command not found in configuration!', 'red'));
	}

	try {
		const command = (await _command.import)?.default;

		if (!command) {
			loggers.error(
				color(displayName, 'purple'),
				color('File does not contain valid Command Properties! Please check the example to create new commands.', 'neonGreen')
			);
			return;
		}

		const commandPath = configuration.cmds.commands.get(command.name).path.split('/').slice(-2).join('/');

		if (configuration.cmds.commands.has(command.name) && displayName !== commandPath) {
			loggers.error(color(displayName, 'purple'), 'Has the same command name as the', color(commandPath, 'purple'));

			return;
		}

		await isMissingProperty(command);

		const currentCommand = cmds[index][1];

		loggers.info(
			color(currentCommand.path?.split('/').slice(-2).join('/'), 'purple'),
			color('File has been changed', 'neonGreen'),
			color('&', 'white'),
			color('Reloaded!', 'lilac')
		);

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
		if (error instanceof ModuleError) {
			loggers.warning(color(displayName, 'purple'), error.info);
			return;
		}

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

		loggers.warning(
			color(displayName, 'purple'),
			color('File Renamed!', 'white'),
			color('to', 'white'),
			color(renamedFile.split('/')?.slice(-2).join('/'), 'purple'),
			color('Waiting for changes...', 'purple')
		);
	} else {
		configuration.cmds.commands.delete(cmds[indexPath][0]);

		loggers.warning(color(displayName, 'purple'), color('File Deleted!', 'indigo'));
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
