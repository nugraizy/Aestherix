import { checkAfk, deleteAfk, getAfk } from '../../helper/index.js';
import { getTimeSince } from '../../utils/modules/index.js';

const composingHandler = async (client, from, participant) => {
	const afkContainer = getAfk(participant, from);

	if (!checkAfk(participant, from) || afkContainer.since === new Date().getTime()) {
		return;
	}

	const timeSinceAfk = getTimeSince(afkContainer.since);

	const message = `@${
		participant.split('@')[0]
	} detected writing. AFK since ${timeSinceAfk} ago. Now they are out from AFK. Reason : ${afkContainer.reasons}`;

	await client[botNum].send(from, {
		text: message,
		mentions: [participant]
	});

	deleteAfk(participant, from);
};

export default composingHandler;
