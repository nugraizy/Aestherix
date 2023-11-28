import path from 'path';
import chokidar from 'chokidar';
import fs from 'fs-extra';
import syntaxError from 'syntax-error';
import os from 'os';
import chalk from 'chalk';

import configuration from '../../config/connect.js';
import { color, ERRLOG, INFOLOG, loadFiles } from '../../../utils/modules/index.js';

const hostPlatform = os.platform();

const nocache = (module, newFile = false) => {
	let param = '?v=' + Date.now();
	const newPath = module + (newFile ? param : '');

	return { import: import(newPath), param };
};

export const ICON = {
	ADD: '🆕 ',
	DELETED: '🗑️  ',
	CHANGED: '✏️ ',
	ERROR: '⚠️  ',
	RENAMED: '🔂 '
};

export const normalizeImportPath = (file) => {
	const absolutePath =
		hostPlatform === 'win32' ? 'file:' + path.win32.resolve(path.win32.join(file)) : path.resolve(path.join(file));

	return absolutePath;
};

export const saveContacts = (store, contactsList) => {
	const { contacts } = store;

	const contactsValue = Object.keys(contacts);

	for (const { id, name } of contactsList) {
		if (contactsValue.includes(id)) {
			contacts[id].name = name;
			continue;
		}

		contacts[id] = { name, id };
	}
};

export const validatePlugins = async (filename) => {
	const normalizedPath = normalizeImportPath(filename);
	const str = (
		await fs.readFile(normalizedPath, {
			encoding: 'utf-8'
		})
	).replace(/\t/g, '    ');
	const syntax = syntaxError(str, normalizedPath, {
		allowReturnOutsideFunction: true,
		allowAwaitOutsideFunction: true,
		sourceType: 'module'
	});

	if (syntax) {
		const [, path, error, arrow, typeError] = String(syntax).split('\n');

		const codesArr = str.split('\n');
		const indexCode = codesArr.findIndex((v) => v.includes(error));

		const [firstCode, secondCode] = [codesArr[indexCode - 1], codesArr[indexCode + 1]];
		const [firstLine, currentLine, secondLine] = [syntax.line - 1, syntax.line, syntax.line + 1];
		const [firstLineLength, currentLineLength, secondLineLength] = [
			String(firstLine).length,
			String(currentLine).length,
			String(secondLine).length
		];

		const longestLine = Math.max(firstLineLength, currentLineLength, secondLineLength);

		const linePaddingFirst = ' '.repeat(longestLine - String(firstLine).length + 2);
		const linePaddingCurrent = ' '.repeat(longestLine - String(currentLine).length + 2);
		const linePaddingSecond = ' '.repeat(longestLine - String(secondLine).length + 2);

		console.log(chalk.gray(path), '\n');

		console.log(chalk.gray(`  ${linePaddingFirst}${firstLine}:`), chalk.hex('#fff')(firstCode));
		console.log('  ' + chalk.bold.hex('#fff').bgRed(`${linePaddingCurrent}${currentLine}: ${error}`));
		console.log(chalk.gray(`  ${linePaddingSecond}${' '.repeat(longestLine)}:`), chalk.bold.hex('#fff')(arrow));
		console.log(chalk.gray(`  ${linePaddingSecond}${secondLine}:`), chalk.hex('#fff')(secondCode), '\n');

		console.log(chalk.gray(typeError));

		ERRLOG(
			color(`${ICON.ERROR}${filename.split('/').slice(-2).join('/')}`, '#9f53ea'),
			color('File Error! Waiting for changes...', '#FF5555')
		);
	}
};

const add = async (filename, stats, icon = ICON.ADD) => {
	const cmds = configuration.cmds.commands.entries();
	const index = cmds.findIndex((v) => v[1].path === filename);
	const files = loadFiles('./src/commands').filter((v) => !v.includes('template'));

	const file = normalizeImportPath(filename);

	if (index === -1 && files.length !== cmds.length) {
		let module;

		try {
			module = await import(file);
			INFOLOG(color(`${icon}${filename?.split('/')?.slice(-2).join('/')}`, '#9f53ea'), color('New File Added!', '#ff71ce'));
			INFOLOG(color('checking if its valid plugins...', '#ffb86c'));
		} catch (error) {
			return await validatePlugins(filename);
		}

		if (module?.default) {
			configuration.cmds.commands.set(module.default.name, {
				...module.default,
				absolutePath: file,
				path: filename
			});
			INFOLOG(
				color(`${icon}${filename?.split('/')?.slice(-2).join('/')}`, '#9f53ea'),
				color('Plugins are valid! Waiting for changes...', '#50fa7b')
			);
		} else {
			ERRLOG(
				color(`${icon}${filename.split('/').slice(-2).join('/')}`, '#9f53ea'),
				color('File Error! Waiting for changes...', '#FF5555')
			);
			configuration.cmds.commands.set('UNKNOWN-' + Date.now(), {
				absolutePath: file,
				path: filename
			});
		}
	} else {
		try {
			await import(file);
			INFOLOG(color(`${icon}${filename?.split('/')?.slice(-2).join('/')}`, '#9f53ea'), color('New File Added!', '#ff71ce'));
		} catch (error) {
			await validatePlugins(filename);
		}
	}
};

const change = async (filename, stats, icon = ICON.CHANGED) => {
	INFOLOG(
		color(`${icon} ${filename?.split('/')?.slice(-2).join('/')}`, '#9f53ea'),
		color('File has been changed!', '#ff71ce')
	);

	const _command = nocache(normalizeImportPath(filename), true);

	const cmds = configuration.cmds.commands.entries();

	const index = cmds.findIndex((v) => {
		return v[1].path === filename;
	});

	let command;

	try {
		command = (await _command.import)?.default;
	} catch {
		return await validatePlugins(filename);
	}

	const _commandObj = cmds[index][1];

	INFOLOG(
		color(`${icon} ${_commandObj.path?.split('/')?.slice(-2).join('/')}`, '#9f53ea'),
		color('File Reloaded!', '#05ffa1')
	);

	const _absolutePath = _commandObj.absolutePath;
	const _path = _commandObj.path;
	let _commandName = cmds[index][0];

	if (_commandName !== command.name) {
		configuration.cmds.commands.delete(_commandName);
		_commandName = command.name;
	}

	configuration.cmds.commands.set(_commandName, {
		...command,
		absolutePath: _absolutePath,
		path: _path
	});
};

const unlink = (filename, icon = ICON.DELETED) => {
	const cmds = configuration.cmds.commands.entries();
	const indexPath = cmds.findIndex((v) => v[1].path === filename);

	if (indexPath === -1) {
		return;
	}

	const commands = loadFiles('./src/commands').filter((v) => !v.includes('template'));

	const _filesContainer = cmds.map((v) => v[1].path);

	const index = commands.map((c) => path.normalize(c));

	const renamedFile = index.find((v) => !_filesContainer.includes(v));

	if (renamedFile ? true : false) {
		const file = cmds[indexPath];

		configuration.cmds.commands.delete(cmds[0]);

		delete file[1].path;
		delete file[1].absolutePath;

		configuration.cmds.commands.set(
			file[0],
			Object.assign(file[1], { path: renamedFile, absolutePath: normalizeImportPath(renamedFile) })
		);

		INFOLOG(
			color(`${ICON.RENAMED}${filename?.split('/')?.slice(-2).join('/')}`, '#9f53ea'),
			color('File Renamed!', '#ff71ce'),
			color('to', 'cyan'),
			color(renamedFile.split('/')?.slice(-2).join('/'), '#9f53ea'),
			color('Waiting for changes...', '#ff71ce')
		);

		return;
	}

	configuration.cmds.commands.delete(cmds[indexPath][0]);

	INFOLOG(color(`${icon}${filename?.split('/')?.slice(-2).join('/')}`, '#9f53ea'), color('File Deleted!', '#FF5555'));
};

export const watch = (folder) => {
	chokidar.watch(folder).on('add', add).on('change', change).on('unlink', unlink);
};
