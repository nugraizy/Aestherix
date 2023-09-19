import configuration from '../../helper/config/connect.js';
import { checkIntervals } from '../misc/index.js';
import { search } from './index.js';

/**
 * Skip current Anonymous session id and find another session.
 * @param {string} key string of the key/participant.
 * @param {number} timer timeout for how long the queue.
 * @param {Client} client socket connection.
 * @param {import('@adiwajshing/baileys').AnyMessageContent} message metadata of the message.
 * @param {boolean} isStop
 * @returns {boolean|{partner1: string, partner2: string}|{status: string, seconds: number}}
 */
export const skip = (key, timer, client, message, isStop) => {
	const status =
		configuration.anonymous.get(key) ||
		Array.from(configuration.anonymous.values().values).find((k) => k.partner === key) ||
		undefined;
	let results;

	if (status) {
		if (status.partner === null) {
			return { status: 'searching', seconds: checkIntervals(configuration.intervals['anonymous'].get(key)).timer };
		}

		results = configuration.anonymous.has(key)
			? { partner1: key, partner2: configuration.anonymous.get(key).partner }
			: {
					partner1: configuration.anonymous.get(
						Array.from(configuration.anonymous.keys()).find((k) => configuration.anonymous.get(k).partner === key)
					).partner,
					partner2: Array.from(configuration.anonymous.keys()).find((k) => configuration.anonymous.get(k).partner === key)
			  }; /* eslint-disable-line */

		if (configuration.anonymous.has(key)) {
			configuration.anonymous.delete(key);
		} else {
			configuration.anonymous.delete(
				Array.from(configuration.anonymous.keys()).find((k) => configuration.anonymous.get(k).partner === key)
			);
		}

		if (!isStop) {
			search(key, timer, client, message);
		}

		return results;
	}

	return false;
};
