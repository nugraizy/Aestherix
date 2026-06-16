/**
 * i18n coverage — the id and en tables must expose the same set of keys so
 * translations cannot silently drift.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import enTable from '../../../../../src/i18n/werewolf/en.js';
import idTable from '../../../../../src/i18n/werewolf/id.js';

const flatten = (obj, prefix = '') => {
	const out = [];

	for (const [key, value] of Object.entries(obj)) {
		const path = prefix ? `${prefix}.${key}` : key;

		if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
			out.push(...flatten(value, path));
		} else {
			out.push(path);
		}
	}

	return out.sort();
};

describe('werewolf i18n coverage', () => {
	it('id and en expose the exact same key paths', () => {
		const idKeys = flatten(idTable);
		const enKeys = flatten(enTable);

		assert.deepEqual(
			idKeys,
			enKeys,
			`keys differ:\n  only in id: ${idKeys.filter((k) => !enKeys.includes(k)).join(', ')}\n  only in en: ${enKeys.filter((k) => !idKeys.includes(k)).join(', ')}`
		);
	});

	it('every string key resolves to a non-empty value in both locales', () => {
		for (const table of [idTable, enTable]) {
			for (const path of flatten(table)) {
				const segments = path.split('.');
				let node = table;

				for (const s of segments) {
					node = node[s];
				}

				if (Array.isArray(node)) {
					assert.ok(node.length > 0, `array is empty at ${path}`);

					for (const item of node) {
						assert.ok(typeof item === 'string' && item.length > 0, `array item is not a non-empty string at ${path}`);
					}
				} else {
					assert.ok(typeof node === 'string' && node.length > 0, `value is not a non-empty string at ${path}`);
				}
			}
		}
	});
});
