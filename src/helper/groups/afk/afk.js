import configuration from '../../config/connect.js';
import { Cache } from '../../modules/cache.js';

export const checkAfk = (participant, groupId) => {
	const key = configuration.users.afk.get(participant)?.has(groupId);

	if (!key) {
		return false;
	}

	return true;
};

export const getAfk = (participant, groupId) => {
	if (checkAfk(participant, groupId)) {
		return configuration.users.afk.get(participant).get(groupId);
	}

	return false;
};

export const deleteAfk = (participant, groupId) => {
	if (checkAfk(participant, groupId)) {
		configuration.users.afk.get(participant).delete(groupId);
		return true;
	}

	return false;
};

export const setAfk = (participant, groupId, reason, name) => {
	if (!getAfk(participant, groupId)) {
		configuration.users.afk.set(
			participant,
			new Cache().set(groupId, { since: new Date().getTime(), reasons: !reason ? 'No Reason' : reason, name })
		);
	}
};
