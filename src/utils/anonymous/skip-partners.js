import configuration from '../../helper/config/connect.js';
import { checkIntervals } from '../misc/index.js';
import { findOwnerOf, handlers } from './handlers-partners.js';
import { search } from './search-partners.js';

const anonMap = () => configuration.anonymous.sessions;

/**
 * Skip current Anonymous session id and find another session.
 * @param {string} key string of the key/participant.
 * @param {number} timer timeout for how long the queue.
 * @param {import('../../types/Socket/index.js').AdvancedClient} client socket connection.
 * @param {import('baileys').AnyMessageContent} message metadata of the message.
 * @param {boolean} isStop whether to stop instead of re-searching.
 * @returns {false | {partner1: string, partner2: string} | {status: string, seconds: number}}
 */
export const skip = (key, timer, client, message, isStop) => {
	const pair = handlers(key);

	if (!pair) {
		return false;
	}

	if (pair.partner2 === null) {
		return {
			status: 'searching',
			seconds: checkIntervals(configuration.timers['anonymous'].get(key)).timer
		};
	}

	if (anonMap().has(key)) {
		anonMap().delete(key);
	} else {
		const owner = findOwnerOf(key);

		if (owner) {
			anonMap().delete(owner);
		}
	}

	if (!isStop) {
		search(key, timer, client, message);
	}

	return pair;
};
