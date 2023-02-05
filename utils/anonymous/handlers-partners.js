import configuration from '../../connect.js';

/**
 *
 * @param {string} key the key/participants that sent message to bot.
 * @returns {{partner1: string, partner2: string}} key1 and key2.
 */
export const handlers = (key) => {
	const status =
		configuration.anonymous.get(key) ||
		Array.from(configuration.anonymous.values()).find((k) => k.partner === key) ||
		undefined;

	if (status === undefined) {
		return false;
	}

	return configuration.anonymous.has(key)
		? { partner1: key, partner2: configuration.anonymous.get(key).partner }
		: {
				partner1: configuration.anonymous.get(
					Array.from(configuration.anonymous.keys()).find((k) => configuration.anonymous.get(k).partner === key),
				).partner,
				partner2: Array.from(configuration.anonymous.keys()).find((k) => configuration.anonymous.get(k).partner === key),
		  }; /* eslint-disable-line */
};
