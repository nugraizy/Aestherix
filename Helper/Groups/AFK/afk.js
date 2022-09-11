/* global user */

export const checkAfk = (participant, groupId) => {
	const key = user.afk.get(participant)?.has(groupId);

	if (!key) {
		return false;
	}

	return true;
};

export const getAfk = (participant, groupId) => {
	if (checkAfk(participant, groupId)) {
		return user.afk.get(participant).get(groupId);
	}

	return false;
};

export const deleteAfk = (participant, groupId) => {
	if (checkAfk(participant, groupId)) {
		user.afk.get(participant).delete(groupId);
		return true;
	}

	return false;
};

export const setAfk = (participant, groupId, reason, name) => {
	if (!getAfk(participant, groupId)) {
		user.afk.set(participant, new Map().set(groupId, { since: new Date().getTime(), reasons: !reason ? 'No Reason' : reason, name }));
	}
};
