import configuration from '../../connect.js';
import { CheckIntervals } from '../Misc/index.js';
import { search } from './index.js';

export const skip = (key, timer, client, message, isStop) => {
	const status = configuration.anonymous.get(key) || Array.from(configuration.anonymous.values()).find((k) => k.partner == key) || undefined;
	let results;

	if (status) {
		if (status.partner == null) {
			return { status: 'searching', seconds: CheckIntervals(configuration.intervals['anonymous'].get(key)).timer };
		}

		results = configuration.anonymous.has(key)
			? { partner1: key, partner2: configuration.anonymous.get(key).partner }
			: {
					partner1: configuration.anonymous.get(Array.from(configuration.anonymous.keys()).find((k) => configuration.anonymous.get(k).partner == key)).partner,
					partner2: Array.from(configuration.anonymous.keys()).find((k) => configuration.anonymous.get(k).partner == key),
			  }; /* eslint-disable-line */

		if (configuration.anonymous.has(key)) {
			configuration.anonymous.delete(key);
		} else {
			configuration.anonymous.delete(Array.from(configuration.anonymous.keys()).find((k) => configuration.anonymous.get(k).partner == key));
		}

		if (!isStop) {
			search(key, timer, client, message);
		}

		return results;
	}

	return false;
};
