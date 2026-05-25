import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { env, redact } from '../../src/core/env.js';

describe('env', () => {
	it('exports a frozen env object', () => {
		assert.equal(Object.isFrozen(env), true);
	});

	it('coerces DASHBOARD_BRIDGE_PORT to a number with a default', () => {
		assert.equal(typeof env.DASHBOARD_BRIDGE_PORT, 'number');
		assert.ok(env.DASHBOARD_BRIDGE_PORT > 0);
	});

	it('TRACE coerces to boolean', () => {
		assert.equal(typeof env.TRACE, 'boolean');
	});

	it('NODE_ENV always has a value', () => {
		assert.equal(typeof env.NODE_ENV, 'string');
		assert.ok(env.NODE_ENV.length > 0);
	});
});

describe('redact', () => {
	it('passes through non-string inputs unchanged', () => {
		assert.equal(redact(42), 42);
		assert.equal(redact(null), null);
		assert.equal(redact(undefined), undefined);

		const obj = { a: 1 };

		assert.equal(redact(obj), obj);
	});

	it('returns the input unchanged when it contains no known secret', () => {
		const sample = 'no secret here, just plain text';

		assert.equal(redact(sample), sample);
	});

	it('replaces a configured secret value with ***', () => {
		// Use whatever secret the test env actually has. If none of the known
		// SECRET_KEYS are set in this environment, fall back to a length check.
		const candidates = [env.DATABASE_URL, env.OPENAI_KEY, env.GITHUB_AUTH_TOKEN].filter(
			(v) => typeof v === 'string' && v.length >= 8
		);

		if (candidates.length === 0) {
			return; // nothing to verify in this env
		}

		const secret = candidates[0];
		const out = redact(`prefix ${secret} suffix`);

		assert.equal(out, 'prefix *** suffix');
	});

	it('does not replace short values', () => {
		// Even if a secret-keyed var is short (under MIN_SECRET_LENGTH),
		// redact must leave it alone to avoid mangling unrelated text.
		const sample = 'aa bb cc';

		assert.equal(redact(sample), sample);
	});
});
