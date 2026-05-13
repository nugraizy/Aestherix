import dayjs from 'dayjs';

import configuration from '../../helper/config/connect.js';
import { checkIntervals, deleteIntervals, setIntervals } from '../misc/index.js';
import { findOwnerOf } from './handlers-partners.js';

const anonMap = () => configuration.anonymous.sessions;
const intervalsMap = () => configuration.timers['anonymous'];

/**
 * Search new Anonymous session.
 * @param {string} jid string of the jid/participant.
 * @param {number} timer timeout for how long the queue.
 * @param {import('../../types/Socket/index.js').AdvancedClient} client socket connection.
 * @param {import('baileys').AnyMessageContent} message metadata of the message.
 * @returns {true | {partner1: string, partner2: string, messages1: AnyMessageContent, messages2: AnyMessageContent} | {status: string, seconds?: number}}
 */
export const search = (jid, timer, client, message) => {
	const waitingKey = findWaitingKey();

	if (waitingKey) {
		if (anonMap().has(jid)) {
			return {
				status: 'searching',
				seconds: checkIntervals(intervalsMap().get(jid)).timer
			};
		}

		const waitingEntry = anonMap().get(waitingKey);

		waitingEntry.partner = jid;

		const intervalEntry = intervalsMap().get(waitingKey);

		if (intervalEntry) {
			intervalEntry.partner2 = jid;
		}

		const tempMessage = waitingEntry.message;

		delete waitingEntry.message;

		return {
			partner1: waitingKey,
			partner2: jid,
			messages1: tempMessage,
			messages2: message
		};
	}

	if (anonMap().has(jid) || findOwnerOf(jid)) {
		return { status: 'chatting' };
	}

	anonMap().set(jid, { partner: null, message });

	const expiresAt = dayjs(new Date())
		.add(timer + 2, 's')
		.valueOf();

	setIntervals(
		intervalsMap(),
		jid,
		timer + 2,
		async (clients = client, id = jid, remaining = expiresAt) => {
			const interval = intervalsMap().get(id);

			if (!interval) {
				return;
			}

			const second = Math.floor(((remaining - Date.now()) % (1000 * 60)) / 1000);
			const { partner2 } = checkIntervals(interval);

			interval.timer = second;

			if (partner2 !== null) {
				deleteIntervals(interval, intervalsMap(), id);
				return;
			}

			if (second <= 0) {
				await clients.instance.edit(
					id,
					'Your partner is not found! Try again later!',
					configuration.anonymous.messages.get(id)
				);
				anonMap().delete(id);
				configuration.anonymous.messages.delete(id);
				deleteIntervals(interval, intervalsMap(), id);
			}
		},
		{ partner1: jid, partner2: null, partner1Message: message }
	);

	return true;
};

/**
 * Finds the map key of the first entry that is waiting (partner === null).
 * @returns {string|undefined}
 */
function findWaitingKey() {
	for (const [key, value] of anonMap()) {
		if (value.partner === null) {
			return key;
		}
	}

	return undefined;
}
