/**
 * Command contract test.
 *
 * Walks src/commands/**\/*.js, dynamically imports each file, and validates
 * the default export against the same yup schema CommandLoader uses at
 * runtime.
 *
 * Goals:
 *   - Catch shape regressions before they reach the bot (missing fields,
 *     wrong category, unset status, run is not a function, etc.).
 *   - Keep import time bounded so adding a command does not silently
 *     balloon startup.
 *   - Surface broken modules with a usable file path.
 *
 * Non-goals:
 *   - Executing run(). Many commands hit network/disk/ffmpeg. Behavior tests
 *     belong with each command, using the fakes in __tests__/_fixtures/.
 */

import assert from 'node:assert/strict';
import { readdirSync, statSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { join, relative, sep } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';

import { COMMAND_SCHEMA } from '../../src/core/command-loader.js';

const COMMANDS_DIR = join(process.cwd(), 'src', 'commands');
const EXCLUDE_DIR = /([/\\])(subcommands|ui|__tests__|_)([/\\]|$)/;
const EXCLUDE_FILE = /(template|\.d\.ts$)/;
const IMPORT_BUDGET_MS = 5000;

function walk(dir) {
	const out = [];

	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);

		if (entry.isDirectory()) {
			out.push(...walk(full));
		} else if (entry.isFile() && entry.name.endsWith('.js')) {
			out.push(full);
		}
	}

	return out;
}

function collectCommandFiles() {
	if (!statSync(COMMANDS_DIR, { throwIfNoEntry: false })?.isDirectory()) {
		return [];
	}

	return walk(COMMANDS_DIR)
		.filter((file) => !EXCLUDE_DIR.test(file))
		.filter((file) => !EXCLUDE_FILE.test(file))
		.filter((file) => !file.endsWith(`${sep}_define.js`));
}

const files = collectCommandFiles();

describe('command contract', () => {
	before(async () => {
		// Pre-warm heavy shared modules so the per-command import budget
		// reflects per-command cost rather than cold-cache cost.
		await import('../../src/utils/index.js');
		await import('../../src/utils/modules/index.js');
		await import('../../src/helper/index.js');
	});

	after(async () => {
		const { default: prisma } = await import('../../src/helper/database/prisma.js');

		await prisma.$disconnect();
	});

	it('finds at least one command file', () => {
		assert.ok(files.length > 0, `no command files found under ${COMMANDS_DIR}`);
	});

	for (const file of files) {
		const rel = relative(process.cwd(), file).replaceAll(sep, '/');

		describe(rel, () => {
			let mod;
			let importMs = 0;

			it('imports cleanly', async () => {
				const start = performance.now();

				mod = await import(pathToFileURL(file).href);
				importMs = performance.now() - start;
				assert.ok(mod, `import returned nothing for ${rel}`);
				assert.ok(mod.default, `${rel} has no default export`);
			});

			it(`imports under ${IMPORT_BUDGET_MS}ms`, () => {
				assert.ok(
					importMs < IMPORT_BUDGET_MS,
					`${rel} took ${importMs.toFixed(0)}ms to import (budget ${IMPORT_BUDGET_MS}ms). Move heavy work behind a lazy import.`
				);
			});

			it('matches the command schema', () => {
				assert.ok(mod?.default, `${rel} has no default export`);
				try {
					COMMAND_SCHEMA.validateSync(mod.default, { abortEarly: false, strict: false });
				} catch (err) {
					const lines = Array.isArray(err.errors) ? err.errors.join('\n  • ') : err.message;

					throw new Error(`${rel} fails schema:\n  • ${lines}`);
				}
			});

			it('run is a function', () => {
				assert.equal(typeof mod?.default?.run, 'function', `${rel}: run must be a function`);
			});
		});
	}
});
