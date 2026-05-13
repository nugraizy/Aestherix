import crypto from 'crypto';

const MAX_ITERATIONS = 10_000_000;

/**
 * Pure computation: solves an ALTCHA challenge by brute-forcing a SHA-256 derived key.
 * No I/O — all inputs come from the caller.
 */
class AltchaSolver {
	/**
	 * @param {{ maxIterations?: number }} [options]
	 */
	constructor({ maxIterations = MAX_ITERATIONS } = {}) {
		this.maxIterations = maxIterations;
	}

	/**
	 * Solve the challenge and return the solution.
	 *
	 * @param {{ nonce: string, salt: string, keyPrefix: string, cost: number, keyLength: number }} parameters
	 * @returns {{ counter: number, key: string, time: number }}
	 */
	solve(parameters) {
		const { nonce, salt, keyPrefix, cost, keyLength } = parameters;

		const nonceBuf = Buffer.from(nonce, 'hex');
		const saltBuf = Buffer.from(salt, 'hex');
		const keyPrefixBuf = Buffer.from(keyPrefix, 'hex');

		const password = Buffer.alloc(nonceBuf.length + 4);

		nonceBuf.copy(password);

		const initial = Buffer.alloc(saltBuf.length + password.length);
		const startTime = Date.now();

		for (let counter = 0; counter <= this.maxIterations; counter++) {
			password.writeUInt32BE(counter, nonceBuf.length);
			saltBuf.copy(initial, 0);
			password.copy(initial, saltBuf.length);

			const derived = Buffer.alloc(keyLength);
			let hashBuf = crypto.createHash('sha256').update(initial).digest();

			hashBuf.copy(derived, 0, 0, keyLength);

			for (let i = 1; i < cost; i++) {
				hashBuf = crypto.createHash('sha256').update(derived).digest();
				hashBuf.copy(derived, 0, 0, keyLength);
			}

			let match = true;

			for (let j = 0; j < keyPrefixBuf.length; j++) {
				if (derived[j] !== keyPrefixBuf[j]) {
					match = false;
					break;
				}
			}

			if (match) {
				return { counter, key: derived.toString('hex'), time: Date.now() - startTime };
			}
		}

		throw new Error('AltchaSolver exhausted all iterations without finding a solution');
	}

	/**
	 * Encode a solved challenge + solution into a base64 payload string.
	 *
	 * @param {{ parameters: object, signature: string }} challenge
	 * @param {{ counter: number, key: string, time: number }} solution
	 * @returns {string}
	 */
	buildPayload(challenge, solution) {
		const challengeJson = JSON.stringify(challenge);
		const solutionJson = JSON.stringify({
			counter: solution.counter,
			derivedKey: solution.key,
			time: solution.time
		});
		const payloadJson = `{"challenge":${challengeJson},"solution":${solutionJson}}`;

		return Buffer.from(payloadJson).toString('base64');
	}
}

export { AltchaSolver };
