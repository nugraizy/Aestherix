/* global botNum */
import { checkAfk, deleteAfk, getAfk } from '../../helper/index.js';
import { getTimeSince } from '../../helper/modules/index.js';

let composingHandler;
export default composingHandler = async (client, from, participant) => {
	if (checkAfk(participant, from)) {
		const container = getAfk(participant, from);
		const { reasons, since } = container;

		if (since === new Date().getTime()) {
			return;
		}

		const time = getTimeSince(since);

		await client[botNum].sendMessage(from, {
			text: `@${
				participant.split('@')[0]
			} detected writing. AFK since ${time} ago. Now they are out from AFK. Reason : ${reasons}`,
			mentions: [participant],
		});
		deleteAfk(participant, from);
	}
};
