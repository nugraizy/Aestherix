import configuration from '../../helper/config/connect.js';

const anonCache = () => configuration.anonymous.sessions;

const findOwnerOf = (jid) => {
	for (const [key, value] of anonCache().entries()) {
		if (value.partner === jid) {
			return key;
		}
	}

	return undefined;
};

export const handlers = (key) => {
	const entry = anonCache().get(key);

	if (entry) {
		return { partner1: key, partner2: entry.partner };
	}

	const owner = findOwnerOf(key);

	if (owner) {
		return { partner1: key, partner2: owner };
	}

	return false;
};

export { findOwnerOf };
