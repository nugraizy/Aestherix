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
	t
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

	it('tracks the locale assigned to a room id', () => {
		assert.equal(getLocale('room-x'), getDefaultLocale());

		setLocale('room-x', 'en');
		assert.equal(getLocale('room-x'), 'en');

		setLocale('room-x', null);
		assert.equal(getLocale('room-x'), getDefaultLocale());
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
});
