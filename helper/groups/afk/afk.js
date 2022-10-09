import configuration from '../../../connect.js';

export const checkAfk = (participant, groupId) => {
	const key = configuration.user.afk.get(participant)?.has(groupId);

	if (!key) {
		return false;
	}

	return true;
};

export const getAfk = (participant, groupId) => {
	if (checkAfk(participant, groupId)) {
		return configuration.user.afk.get(participant).get(groupId);
	}

	return false;
};

export const deleteAfk = (participant, groupId) => {
	if (checkAfk(participant, groupId)) {
		configuration.user.afk.get(participant).delete(groupId);
		return true;
	}

	return false;
};

export const setAfk = (participant, groupId, reason, name) => {
	if (!getAfk(participant, groupId)) {
		configuration.user.afk.set(participant, new Map().set(groupId, { since: new Date().getTime(), reasons: !reason ? 'No Reason' : reason, name }));
	}
};
