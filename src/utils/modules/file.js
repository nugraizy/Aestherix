import fs from 'fs-extra';

import { getFilesizeFromBytes } from './format.js';

export const getFilesize = (filename) => {
	const stats = fs.statSync(filename);

	return getFilesizeFromBytes(stats.size);
};

export const parseHumanReadableToBytes = (s) => {
	s = String(s);

	const units = ['bytes', 'kb', 'mb', 'gb', 'tb'];
	const POWER_BASE = 1024;
	const data = {};

	data.numericPart = s.replace(/[^\d.]+/gim, '');
	data.unitPart = s
		.replace(/[^a-z]+/gim, '')
		.trim()
		.toLowerCase();
	data.index = -1 !== units.indexOf(data.unitPart) ? units.indexOf(data.unitPart) : 0;
	data.unit = units[data.index];
	data.factor = Math.pow(POWER_BASE, data.index);
	data.valueBytes = Math.trunc(Number(data.numericPart) * data.factor);

	return data.valueBytes;
};

export function loadFiles(dir, options = {}) {
	const files = [];
	const excludeDir = options.excludeDir || null;
	const excludeFile = options.excludeFile || null;

	const walkDir = (curDir) => {
		const list = fs.readdirSync(curDir, { withFileTypes: true });

		for (const entry of list) {
			const entryPath = `${curDir}/${entry.name}`;

			if (entry.isDirectory()) {
				if (excludeDir && excludeDir.test(entryPath)) {
					continue;
				}

				walkDir(entryPath);
				continue;
			}

			if (excludeFile && excludeFile.test(entryPath)) {
				continue;
			}

			files.push(entryPath);
		}
	};

	walkDir(dir);

	return files;
}
