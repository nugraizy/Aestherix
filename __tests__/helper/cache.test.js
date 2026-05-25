import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Cache } from '../../src/helper/modules/cache.js';

describe('Cache', () => {
	it('stores and retrieves values', () => {
		const c = new Cache();

		c.set('a', 1);

		assert.equal(c.get('a'), 1);
		assert.equal(c.size, 1);
	});

	it('returns null for missing keys by default', () => {
		const c = new Cache();

		assert.equal(c.get('missing'), null);
	});

	it('throws on missing key when throws=true', () => {
		const c = new Cache({ throws: true });

		assert.throws(() => c.get('missing'), /Key not found/);
	});

	it('respects allowOverwrite=false', () => {
		const c = new Cache({ allowOverwrite: false });

		c.set('a', 1);
		c.set('a', 2); // silently ignored

		assert.equal(c.get('a'), 1);
	});

	it('evicts the oldest entry when limit is exceeded', () => {
		const c = new Cache({ limit: 2 });

		c.set('a', 1);
		c.set('b', 2);
		c.set('c', 3);

		assert.equal(c.size, 2);
		assert.equal(c.has('a'), false);
		assert.equal(c.get('b'), 2);
		assert.equal(c.get('c'), 3);
	});

	it('clear() empties the cache', () => {
		const c = new Cache();

		c.set('a', 1);
		c.set('b', 2);
		c.clear();

		assert.equal(c.size, 0);
		assert.deepEqual(c.keys(), []);
	});

	describe('baileys CacheStore compatibility', () => {
		it('exposes .get / .set / .del so it can replace node-cache', () => {
			const c = new Cache();

			assert.equal(typeof c.get, 'function');
			assert.equal(typeof c.set, 'function');
			assert.equal(typeof c.del, 'function');
		});

		it('del(key) is an alias for delete(key)', () => {
			const c = new Cache();

			c.set('x', 'value');
			assert.equal(c.has('x'), true);

			c.del('x');
			assert.equal(c.has('x'), false);
			assert.equal(c.size, 0);
		});

		it('del on a missing key is a no-op', () => {
			const c = new Cache();

			assert.doesNotThrow(() => c.del('never-set'));
			assert.equal(c.size, 0);
		});
	});

	describe('filter()', () => {
		it('action=find returns the first match', () => {
			const c = new Cache();

			c.set('a', { score: 1 });
			c.set('b', { score: 2 });

			const found = c.filter((_key, val) => val.score === 2, 'find');

			assert.deepEqual(found, { score: 2 });
		});

		it('action=filter returns all matches as an array', () => {
			const c = new Cache();

			c.set('a', 1);
			c.set('b', 2);
			c.set('c', 3);

			const out = c.filter((_key, val) => val % 2 === 1, 'filter');

			assert.deepEqual(out.sort(), [1, 3]);
		});

		it('action=remove deletes matching entries', () => {
			const c = new Cache();

			c.set('a', 1);
			c.set('b', 2);
			c.set('c', 3);

			c.filter((_key, val) => val > 1, 'remove');

			assert.equal(c.size, 1);
			assert.equal(c.get('a'), 1);
		});

		it('rejects an unknown action', () => {
			const c = new Cache();

			assert.throws(() => c.filter(() => true, 'bogus'), /TypeError/);
		});
	});
});
