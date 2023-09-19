import path from 'path';
import dayjs from 'dayjs';
import chokidar from 'chokidar';

import configuration from '../../config/connect.js';
import { color, ERRLOG, INFOLOG, loadFiles } from '../../../utils/modules/index.js';

const nocache = (module, newFile = false) => {
	let param = '?v=' + Date.now();
	const newPath = module + (newFile ? param : '');

	return { import: import(newPath), param };
};

export const ICON = {
	ADD: '🆕',
	DELETED: '🗑️ ',
	CHANGED: '✏️ ',
	RENAMED: '🔂'
};

export const normalizeImportPath = (file) => {
	return path.resolve(path.join(file));
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

const add = async (filename, stats, icon = ICON.ADD) => {
	const time = dayjs().format('HH:mm:ss DD/MM');

	const cmds = configuration.cmds.commands.entries();
	const index = cmds.findIndex((v) => v[1].path === filename);
	const files = loadFiles('./src/commands').filter((v) => !v.includes('template'));

	if (index === -1 && files.length !== cmds.length) {
		const file = normalizeImportPath(filename);

		const module = await import(file);

		INFOLOG(
			`[${color(time, 'cyan')}]`,
			color(`${icon} ${filename?.split('/')?.slice(-2).join('/')}`, '#9f53ea'),
			color('New File Added!', 'yellow')
		);

		INFOLOG(`[${color(time, 'cyan')}]`, color('checking if its valid plugins...', '#ffb86c'));

		if (module?.default) {
			configuration.cmds.commands.set(module.default.name, {
				...module.default,
				absolutePath: file,
				path: filename
			});
			INFOLOG(
				`[${color(time, 'cyan')}]`,
				color(`${icon} ${filename?.split('/')?.slice(-2).join('/')}`, '#9f53ea'),
				color('Plugins are valid! Waiting for changes...', '#50fa7b')
			);
		} else {
			ERRLOG(
				`[${color(time, 'cyan')}]`,
				color(`${icon} ${filename.split('/').slice(-2).join('/')}`, '#9f53ea'),
				color('File Error! Waiting for changes...', 'red')
			);
			configuration.cmds.commands.set('UNKNOWN-' + Date.now(), {
				absolutePath: file,
				path: filename
			});
		}
	}
};

const change = async (filename, stats, icon = ICON.CHANGED) => {
	const time = dayjs().format('HH:mm:ss DD/MM');

	INFOLOG(
		`[${color(time, 'cyan')}]`,
		color(`${icon} ${filename?.split('/')?.slice(-2).join('/')}`, '#9f53ea'),
		color('File has been changed!', 'yellow')
	);

	const _command = nocache(normalizeImportPath(filename), true);

	const cmds = configuration.cmds.commands.entries();

	const index = cmds.findIndex((v) => {
		return v[1].path === filename;
	});

	const command = (await _command.import)?.default;

	if (!command) {
		ERRLOG(
			`[${color(time, 'cyan')}]`,
			color(`⚠️ ${filename.split('/').slice(-2).join('/')}`, '#9f53ea'),
			color('File Error! Waiting for changes...', 'red')
		);
		return;
	}

	const _commandObj = cmds[index][1];

	INFOLOG(
		`[${color(time, 'cyan')}]`,
		color(`${icon} ${(_commandObj.path + _command.param)?.split('/')?.slice(-2).join('/')}`, '#9f53ea'),
		color('File Reloaded!', 'yellow')
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
	const time = dayjs().format('HH:mm:ss DD/MM');

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
			`[${color(time, 'cyan')}]`,
			color(`${ICON.RENAMED} ${filename?.split('/')?.slice(-2).join('/')}`, '#9f53ea'),
			color('File Renamed!', 'yellow'),
			color('to', 'cyan'),
			color(renamedFile.split('/')?.slice(-2).join('/'), '#9f53ea'),
			color('Waiting for changes...', 'yellow')
		);

		return;
	}

	commands.cmds.commands.delete(cmds[indexPath][0]);

	INFOLOG(
		`[${color(time, 'cyan')}]`,
		color(`${icon}${filename?.split('/')?.slice(-2).join('/')}`, '#9f53ea'),
		color('File Deleted!', 'red')
	);
};

export const watch = (folder) => {
	chokidar.watch(folder).on('add', add).on('change', change).on('unlink', unlink);
};
