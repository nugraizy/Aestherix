import fs from 'fs-extra';
import path from 'path';
import prettier from 'prettier';

import { EDITOR_ROOT_PATH } from '../lib/paths.js';

export const EDITOR_MAX_FILE_SIZE = 600 * 1024;
export const EDITOR_MAX_NODES = 1400;
export const EDITOR_MAX_DEPTH = 8;

function normalizePath(value) {
	const raw = String(value || '')
		.trim()
		.replace(/\\/g, '/')
		.replace(/^\/+/, '');

	if (!raw || raw.includes('\u0000')) {
		return null;
	}

	const resolved = path.resolve(EDITOR_ROOT_PATH, raw);
	const relative = path.relative(EDITOR_ROOT_PATH, resolved);

	if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
		return null;
	}

	return {
		resolved,
		relative: relative.replace(/\\/g, '/')
	};
}

async function buildTree() {
	let nodeCount = 0;

	const walk = async (dirPath, relativePath, depth) => {
		if (depth > EDITOR_MAX_DEPTH || nodeCount >= EDITOR_MAX_NODES) {
			return null;
		}

		let entries = [];

		try {
			entries = await fs.readdir(dirPath, { withFileTypes: true });
		} catch {
			return null;
		}

		const children = [];

		for (const entry of entries) {
			if (nodeCount >= EDITOR_MAX_NODES) {
				break;
			}

			if (entry.isSymbolicLink()) {
				continue;
			}

			const nextPath = path.join(dirPath, entry.name);
			const nextRelative = path.join(relativePath, entry.name).replace(/\\/g, '/');

			if (entry.isDirectory()) {
				const child = await walk(nextPath, nextRelative, depth + 1);

				if (child) {
					children.push(child);
					nodeCount += 1;
				}

				continue;
			}

			if (entry.isFile()) {
				children.push({ type: 'file', name: entry.name, path: nextRelative });
				nodeCount += 1;
			}
		}

		children.sort((a, b) => {
			if (a.type !== b.type) {
				return a.type === 'folder' ? -1 : 1;
			}

			return a.name.localeCompare(b.name);
		});

		return {
			type: 'folder',
			name: relativePath ? path.basename(dirPath) : 'commands',
			path: relativePath,
			children
		};
	};

	return walk(EDITOR_ROOT_PATH, '', 0);
}

async function loadPrettierConfig(filePath, configJson) {
	let baseConfig = {};

	try {
		const resolved = await prettier.resolveConfig(filePath, {
			config: path.resolve(process.cwd(), '.prettierrc.json')
		});

		if (resolved && typeof resolved === 'object') {
			baseConfig = resolved;
		}
	} catch {
		baseConfig = {};
	}

	if (!Object.keys(baseConfig).length) {
		try {
			baseConfig = await fs.readJSON(path.resolve(process.cwd(), '.prettierrc.json'));
		} catch {
			baseConfig = {};
		}
	}

	let customConfig = {};

	if (configJson) {
		try {
			const parsed = JSON.parse(configJson);

			if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
				return { error: 'Custom Prettier config must be a JSON object.' };
			}

			customConfig = parsed;
		} catch {
			return { error: 'Invalid custom Prettier config JSON.' };
		}
	}

	return {
		config: {
			...baseConfig,
			...customConfig,
			filepath: filePath
		}
	};
}

export function createEditorService() {
	async function readFile(rawPath) {
		const resolved = normalizePath(rawPath);

		if (!resolved) {
			return { ok: false, status: 400, message: 'Invalid file path.' };
		}

		try {
			const stats = await fs.lstat(resolved.resolved);

			if (stats.isSymbolicLink()) {
				return { ok: false, status: 400, message: 'Symbolic links are not allowed.' };
			}

			if (!stats.isFile()) {
				return { ok: false, status: 400, message: 'Path is not a file.' };
			}

			if (stats.size > EDITOR_MAX_FILE_SIZE) {
				return { ok: false, status: 413, message: 'File is too large to open.' };
			}

			const content = await fs.readFile(resolved.resolved, 'utf8');

			return { ok: true, path: resolved.relative, content };
		} catch (error) {
			return { ok: false, status: 404, message: error?.message || 'File not found.' };
		}
	}

	async function writeFile(rawPath, content) {
		const resolved = normalizePath(rawPath);

		if (!resolved) {
			return { ok: false, status: 400, message: 'Invalid file path.' };
		}

		const safeContent = String(content ?? '');

		if (Buffer.byteLength(safeContent, 'utf8') > EDITOR_MAX_FILE_SIZE) {
			return { ok: false, status: 413, message: 'File is too large to save.' };
		}

		try {
			const stats = await fs.lstat(resolved.resolved);

			if (stats.isSymbolicLink()) {
				return { ok: false, status: 400, message: 'Symbolic links are not allowed.' };
			}

			if (!stats.isFile()) {
				return { ok: false, status: 400, message: 'Path is not a file.' };
			}

			await fs.writeFile(resolved.resolved, safeContent, 'utf8');

			return { ok: true, path: resolved.relative };
		} catch (error) {
			return { ok: false, status: 500, message: error?.message || 'Failed saving file.' };
		}
	}

	async function format(rawPath, content, configJson) {
		const resolved = normalizePath(rawPath);

		if (!resolved) {
			return { ok: false, status: 400, message: 'Invalid file path.' };
		}

		const configResult = await loadPrettierConfig(resolved.resolved, configJson);

		if (configResult?.error) {
			return { ok: false, status: 400, message: configResult.error };
		}

		try {
			const formatted = await prettier.format(String(content ?? ''), configResult.config);

			return { ok: true, content: formatted };
		} catch (error) {
			return { ok: false, status: 400, message: error?.message || 'Failed formatting file.' };
		}
	}

	return {
		normalizePath,
		buildTree,
		readFile,
		writeFile,
		format,
		EDITOR_MAX_FILE_SIZE
	};
}
