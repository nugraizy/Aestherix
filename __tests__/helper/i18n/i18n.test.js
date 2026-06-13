import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import {
	__resetForTests,
	getDefaultLocale,
	getLocale,
	hasKey,
	registerNamespace,
	setDefaultLocale,
	setLocale,
	t,
	useLocale
} from '../../../src/helper/i18n/index.js';

describe('i18n helper', () => {
	afterEach(() => {
		__resetForTests();
	});

	it('resolves a dotted key in the requested locale', () => {
		registerNamespace('test', 'id', { greeting: 'Halo' });
		registerNamespace('test', 'en', { greeting: 'Hello' });

		assert.equal(t('id', 'test.greeting'), 'Halo');
		assert.equal(t('en', 'test.greeting'), 'Hello');
	});

	it('falls back to the default locale when a key is missing', () => {
		registerNamespace('test', 'id', { farewell: 'Sampai jumpa' });

		assert.equal(t('en', 'test.farewell'), 'Sampai jumpa');
	});

	it('returns the key itself when no locale has it (missing-key visibility)', () => {
		assert.equal(t('en', 'test.totallyMissing'), 'test.totallyMissing');
	});

	it('interpolates positional vars with an array', () => {
		registerNamespace('test', 'id', { greet: 'Halo {0}, selamat datang ke {1}' });

		assert.equal(t('id', 'test.greet', ['Ali', 'Aestherix']), 'Halo Ali, selamat datang ke Aestherix');
	});

	it('interpolates named vars with an object', () => {
		registerNamespace('test', 'id', { greet: 'Halo {name}, hari ini {day}' });

		assert.equal(t('id', 'test.greet', { name: 'Ali', day: 'Senin' }), 'Halo Ali, hari ini Senin');
	});

	it('leaves unknown placeholder tokens untouched', () => {
		registerNamespace('test', 'id', { greet: 'Halo {name}, umur {age}' });

		assert.equal(t('id', 'test.greet', { name: 'Ali' }), 'Halo Ali, umur {age}');
	});

	it('picks one string at random from an array value using the injected rng', () => {
		registerNamespace('test', 'id', {
			dayTime: ['A', 'B', 'C']
		});

		assert.equal(t('id', 'test.dayTime', undefined, { rng: () => 0 }), 'A');
		assert.equal(t('id', 'test.dayTime', undefined, { rng: () => 0.5 }), 'B');
		assert.equal(t('id', 'test.dayTime', undefined, { rng: () => 0.99 }), 'C');
	});

	it('isolates namespaces so two features cannot collide', () => {
		registerNamespace('alpha', 'id', { msg: 'from-alpha' });
		registerNamespace('beta', 'id', { msg: 'from-beta' });

		assert.equal(t('id', 'alpha.msg'), 'from-alpha');
		assert.equal(t('id', 'beta.msg'), 'from-beta');
	});

	it('deep-merges a namespace when registered twice', () => {
		registerNamespace('test', 'id', { errors: { kindA: 'first' } });
		registerNamespace('test', 'id', { errors: { kindB: 'second' } });

		assert.equal(t('id', 'test.errors.kindA'), 'first');
		assert.equal(t('id', 'test.errors.kindB'), 'second');
	});

	it('tracks the locale assigned to a room id', async () => {
		assert.equal(await getLocale('room-x'), getDefaultLocale());

		await setLocale('room-x', 'en');
		assert.equal(await getLocale('room-x'), 'en');

		await setLocale('room-x', null);
		assert.equal(await getLocale('room-x'), getDefaultLocale());
	});

	it('allows changing the default locale', () => {
		setDefaultLocale('en');
		assert.equal(getDefaultLocale(), 'en');
	});

	it('hasKey returns true only for locales that directly define the key', () => {
		registerNamespace('test', 'id', { greet: 'Halo' });

		assert.equal(hasKey('id', 'test.greet'), true);
		assert.equal(hasKey('en', 'test.greet'), false);
	});

	describe('useLocale', () => {
		it('returns string directly via property access', () => {
			registerNamespace('common', 'id', { errors: { noQuery: 'Masukkan query.' } });

			const L = useLocale('id', 'common');

			assert.equal(L.errors.noQuery, 'Masukkan query.');
		});

		it('falls back to default locale', () => {
			registerNamespace('common', 'id', { errors: { noQuery: 'Masukkan query.' } });

			const L = useLocale('en', 'common');

			assert.equal(L.errors.noQuery, 'Masukkan query.');
		});

		it('returns proxy for missing keys (for chaining)', () => {
			const L = useLocale('id', 'common');

			assert.equal(typeof L.errors.totallyMissing, 'object');
		});

		it('works directly in string concatenation', () => {
			registerNamespace('common', 'id', { success: { loading: 'Memuat...' } });

			const L = useLocale('id', 'common');

			assert.equal('Status: ' + L.success.loading, 'Status: Memuat...');
		});

		it('returns array for array values', () => {
			registerNamespace('common', 'id', { afk: ['A', 'B', 'C'] });

			const L = useLocale('id', 'common');

			assert.deepStrictEqual(L.afk, ['A', 'B', 'C']);
		});
	});
});
