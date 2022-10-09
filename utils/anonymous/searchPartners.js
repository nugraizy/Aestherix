/* global botNum */
import moment from 'moment-timezone';

import configuration from '../../connect.js';
import { CheckIntervals, DeleteIntervals, SetIntervals } from '../misc/index.js';

export const search = async (key, timer, client, message) => {
	const status = Array.from(configuration.anonymous.values()).find((k) => k.partner == null) || undefined;

	if (status) {
		if (configuration.anonymous.has(key)) {
			return { status: 'searching', seconds: CheckIntervals(configuration.intervals['anonymous'].get(key)).timer };
		}

		status.partner = key;
		configuration.intervals['anonymous'].get(Array.from(configuration.anonymous.keys()).find((k) => configuration.anonymous.get(k).partner == key)).partner2 = key;
		const tempMessage = configuration.anonymous.get(Array.from(configuration.anonymous.keys()).find((k) => configuration.anonymous.get(k).partner == key)).message;

		delete configuration.anonymous.get(Array.from(configuration.anonymous.keys()).find((k) => configuration.anonymous.get(k).partner == key)).message;
		return {
			partner1: Array.from(configuration.anonymous.keys()).find((k) => configuration.anonymous.get(k).partner == key),
			partner2: key,
			messages1: tempMessage,
			messages2: message,
		};
	}

	if (configuration.anonymous.has(key)) {
		return { status: 'chatting' };
	} else if (Array.from(configuration.anonymous.values()).find((k) => k.partner == key)) {
		return { status: 'chatting' };
	}

	configuration.anonymous.set(key, { partner: null, message });
	const timers = moment(new Date())
		.add(parseInt(timer + 2), 'seconds')
		.valueOf();

	SetIntervals(
		configuration.intervals['anonymous'],
		key,
		timer + 2,
		async (clients = client, id = key, remaining = timers) => {
			if (configuration.intervals['anonymous'].get(id) === undefined) {
				return;
			}

			const second = Math.floor(((remaining - new Date().getTime()) % (1000 * 60)) / 1000);
			const { partner1, partner2, partner1Message } = CheckIntervals(configuration.intervals['anonymous'].get(id));

			configuration.intervals['anonymous'].get(id).timer = second;

			if (partner2 !== null) {
				DeleteIntervals(configuration.intervals['anonymous'].get(id), configuration.intervals['anonymous'], id);
				return;
			}

			if (second <= 0) {
				clients[botNum].reply({ from: partner1, quoted: partner1Message }, 'Your partner is not found! Try again later!');
				configuration.anonymous.delete(id);
				DeleteIntervals(configuration.intervals['anonymous'].get(id), configuration.intervals['anonymous'], id);
				return;
			}
		},
		{ partner1: key, partner2: null, partner1Message: message },
	);
	return true;
};
