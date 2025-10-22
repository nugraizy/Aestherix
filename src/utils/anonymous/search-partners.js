import dayjs from 'dayjs';

import configuration from '../../helper/config/connect.js';
import { checkIntervals, deleteIntervals, setIntervals } from '../misc/index.js';

/**
 * Search new Anonymous session.
 * @param {string} jid string of the jid/participant.
 * @param {number} timer timeout for how long the queue.
 * @param {import('../../types/Socket/index.js').AdvancedClient} client socket connection.
 * @param {import('baileys').AnyMessageContent} message metadata of the message.
 * @returns {(undefined|boolean)|{partner1: string, partner2: string, messages1: AnyMessageContent, messages2: AnyMessageContent}|{status: string, seconds?: number}}
 */
export const search = (jid, timer, client, message) => {
	const status = Array.from(configuration.anonymous.values().values).find((k) => k.partner === null) || undefined;

	if (status) {
		if (configuration.anonymous.has(jid)) {
			return { status: 'searching', seconds: checkIntervals(configuration.intervals['anonymous'].get(jid)).timer };
		}

		status.partner = jid;
		configuration.intervals['anonymous'].get(
			Array.from(configuration.anonymous.keys()).find((k) => configuration.anonymous.get(k).partner === jid)
		).partner2 = jid;
		const tempMessage = configuration.anonymous.get(
			Array.from(configuration.anonymous.keys()).find((k) => configuration.anonymous.get(k).partner === jid)
		).message;

		delete configuration.anonymous.get(
			Array.from(configuration.anonymous.keys()).find((k) => configuration.anonymous.get(k).partner === jid)
		).message;
		return {
			partner1: Array.from(configuration.anonymous.keys()).find((k) => configuration.anonymous.get(k).partner === jid),
			partner2: jid,
			messages1: tempMessage,
			messages2: message
		};
	}

	if (configuration.anonymous.has(jid)) {
		return { status: 'chatting' };
	} else if (Array.from(configuration.anonymous.values().values).find((k) => k.partner === jid)) {
		return { status: 'chatting' };
	}

	configuration.anonymous.set(jid, { partner: null, message });
	const timers = dayjs(new Date())
		.add(timer + 2, 's')
		.valueOf();

	setIntervals(
		configuration.intervals['anonymous'],
		jid,
		timer + 2,
		async (clients = client, id = jid, remaining = timers) => {
			if (configuration.intervals['anonymous'].get(id) === undefined) {
				return;
			}

			const second = Math.floor(((remaining - new Date().getTime()) % (1000 * 60)) / 1000);
			const { partner1, partner2 } = checkIntervals(configuration.intervals['anonymous'].get(id));

			configuration.intervals['anonymous'].get(id).timer = second;

			if (partner2 !== null) {
				deleteIntervals(configuration.intervals['anonymous'].get(id), configuration.intervals['anonymous'], id);
				return;
			}

			if (second <= 0) {
				await clients.instance.edit(
					partner1,
					'Your partner is not found! Try again later!',
					configuration.anonymousMessages.get(partner1)
				);
				configuration.anonymous.delete(id);
				configuration.anonymousMessages.delete(partner1);
				deleteIntervals(configuration.intervals['anonymous'].get(id), configuration.intervals['anonymous'], id);
				return;
			}
		},
		{ partner1: jid, partner2: null, partner1Message: message }
	);
	return true;
};
