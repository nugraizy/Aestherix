import chalk from 'chalk';
import chokidar from 'chokidar';
import { highlight } from 'cli-highlight';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import syntaxError from 'syntax-error';

import { getSyntaxAdvice } from '../../../utils/ai/syntax-check-agent.js';
import { color, loadFiles, loggers } from '../../../utils/modules/index.js';
import configuration from '../../config/connect.js';
import { getAllContacts, upsertContacts } from '../../database/adapters/user.js';
import prisma from '../../database/prisma.js';
import { ModuleError, isMissingProperty } from './util.js';

const hostPlatform = os.platform();
const NOTE_BY_AGENT = true;
const NOTE_LANGUAGE = 'id';
let contactsDbCache = null;

const hl = (code) =>
	highlight(code.replace(/\t/g, ' '), { language: 'js', ignoreIllegals: true, theme: color.getSyntaxTheme() });
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

	const [, , error, arrow, typeError] = String(syntax).split('\n');

	const codesArr = str.split('\n');
	const displayName = path.relative(process.cwd(), filename);

	if (!syntax.line || syntax.line < 1) {
		loggers.error(
			color(displayName, 'purple'),
			isWatch
				? color('Syntax Error! Waiting for changes...', 'red')
				: color('Syntax Error! Fix the error and restart the bot.', 'red')
		);
		return;
	}

	loggers.error(
		color(displayName, 'purple'),
		isWatch
			? color('Syntax Error! Waiting for changes...', 'red')
			: color('Syntax Error! Fix the error and restart the bot.', 'red')
	);

	const indexCode = syntax.line - 1;
	const firstCode = codesArr[indexCode - 1] || '';
	const secondCode = codesArr[indexCode + 1] || '';

	const firstLine = Math.max(0, syntax.line - 1);
	const currentLine = syntax.line;
	const secondLine = syntax.line + 1;

	const longestLineLength = Math.max(String(firstLine).length, String(currentLine).length, String(secondLine).length);

	const linePadding = (line) => ' '.repeat(longestLineLength - String(line).length + 2);

	loggers.error(
		`${linePadding(firstLine)}`,
		color('⇢ ', 'white'),
		color(`${displayName}`, 'purple') +
			color(':', 'gray') +
			color(syntax.line, 'yellow') +
			color(':', 'gray') +
			color(syntax.column || 0, 'yellow')
	);
	loggers.error(`${linePadding(secondLine)}`, color('⇢ ', 'white'), color(typeError, 'red'));

	if (firstLine > 0) {
		loggers.error(
			chalk.bgHex(color.getHex('lavender'))(' ') + ` ${color(firstLine, 'gray')}` + hl(firstCode).trimEnd().replace('\n', '')
		);
	}

	loggers.error(chalk.bgRed(' ') + ` ${color(currentLine, 'white')}` + hl(error).trimEnd().replace('\n', ''));

	loggers.error(
		chalk.bgHex(color.getHex('lavender'))(' ') + ' '.repeat(longestLineLength) + color(arrow.replace(' ^', '˜˜˜'), 'red')
	);
	loggers.error(
		chalk.bgHex(color.getHex('lavender'))(' ') + ` ${color(secondLine, 'gray')}` + hl(secondCode).trimEnd().replace('\n', '')
	);

	if (NOTE_BY_AGENT) {
		const codeSnippet = [firstCode, codesArr[indexCode] || '', secondCode].join('\n');

		getSyntaxAdvice({
			filename: displayName,
			error: typeError || error,
			line: syntax.line,
			column: syntax.column || 0,
			code: codeSnippet,
			language: NOTE_LANGUAGE
		})
			.then((advice) => {
				if (advice) {
					const results = [...advice.matchAll(/```(\w+)?\n([\s\S]*?)```/g)];

					for (const result of results) {
						const original = result[0];
						const stripped = result[2];

						advice = advice.replaceAll(original, hl(stripped.trim()));
					}

					advice = advice.replace(/\n{2,}/g, '\n').trim();
					loggers.warning(color('💡 Agent Note:', 'cyan'), chalk.hex(color.getHex('lightGray')).italic(advice));
				}
			})
			.catch(() => {});
	}
};

const add = async (filename) => {
	if (configuration.isFirstConnection) {
		return;
	}

	const existingCommands = Array.from(configuration.cmds.commands.entries());
	const resolvedFilename = path.resolve(filename);
	const fileExists = existingCommands.some(([, command]) => path.resolve(command.path) === resolvedFilename);

	if (fileExists) {
		return;
	}

	const file = normalizeImportPath(filename, true);
	const displayName = path.relative(process.cwd(), filename);

	try {
		const _command = nocache(file, true);
		const module = await _command.import;

		if (!module?.default) {
			loggers.warning(color(displayName, 'purple'), color('No default export. Waiting for changes...', 'indigo'));
			return;
		}

		if (!module.default.name) {
			loggers.error(color(displayName, 'purple'), color('Missing required "name" property. Waiting for changes...', 'red'));
			return;
		}

		if (configuration.cmds.commands.has(module.default.name)) {
			loggers.error(
				color(displayName, 'purple'),
				'Has the same command name as the',
				color(configuration.cmds.commands.get(module.default.name).path.split('/').slice(-2).join('/'), 'purple')
			);
			return;
		}

		const check = isMissingProperty(module.default);

		configuration.cmds.commands.set(module.default.name, {
			...check,
			absolutePath: file,
			path: resolvedFilename
		});
		loggers.info(color(displayName, 'purple'), color('New plugin loaded', 'neonGreen'));
	} catch (error) {
		if (error instanceof ModuleError) {
			loggers.error(color(displayName, 'purple'), color(error.info, 'red'), color('Waiting for changes...', 'indigo'));
			return;
		}

		await validatePlugins(filename, true);
	}
};

const change = async (filename) => {
	const displayName = path.relative(process.cwd(), filename);

	const normalizedPath = normalizeImportPath(filename, true);
	const _command = nocache(normalizedPath, true);

	const cmds = configuration.cmds.commands.entries();
	const resolvedFilename = path.resolve(filename);
	const index = cmds.findIndex((v) => path.resolve(v[1].path) === resolvedFilename);

	if (index === -1) {
		return add(filename);
	}

	try {
		const command = (await _command.import)?.default;

		if (!command) {
			loggers.error(color(displayName, 'purple'), color('No default export. Waiting for changes...', 'indigo'));
			return;
		}

		if (typeof command.run !== 'function') {
			loggers.error(color(displayName, 'purple'), color('Missing required "run" function. Waiting for changes...', 'red'));
			return;
		}

		if (!command.name) {
			loggers.error(color(displayName, 'purple'), color('Missing required "name" property. Waiting for changes...', 'red'));
			return;
		}

		const commandPath = configuration.cmds.commands.get(command.name)?.path?.split('/').slice(-2).join('/');

		if (configuration.cmds.commands.has(command.name) && displayName !== commandPath) {
			loggers.error(color(displayName, 'purple'), 'Has the same command name as the', color(commandPath, 'purple'));

			return;
		}

		const validated = isMissingProperty(command);

		const currentCommand = cmds[index][1];

		loggers.info(
			color(currentCommand.path?.split('/').slice(-2).join('/'), 'purple'),
			color('⤑ ', 'lavender'),
			color('File has been changed', 'neonGreen'),
			color('&', 'white'),
			color('Reloaded!', 'neonGreen')
		);

		let _commandName = cmds[index][0];

		if (_commandName !== command.name) {
			configuration.cmds.commands.delete(_commandName);
			_commandName = command.name;
		}

		configuration.cmds.commands.set(_commandName, {
			...validated,
			absolutePath: currentCommand.absolutePath,
			path: currentCommand.path
		});
	} catch (error) {
		if (error instanceof ModuleError) {
			loggers.error(color(displayName, 'purple'), color(error.info, 'red'), color('Waiting for changes...', 'indigo'));
			return;
		}

		await validatePlugins(filename, true);
	}
};

const unlink = (filename) => {
	const displayName = path.relative(process.cwd(), filename);
	const cmds = configuration.cmds.commands.entries();
	const resolvedFilename = path.resolve(filename);
	const indexPath = cmds.findIndex((v) => path.resolve(v[1].path) === resolvedFilename);

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
