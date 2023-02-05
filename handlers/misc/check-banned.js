/* global botNum */
import { readJSON } from '../../helper/index.js';

export const checkBan = async (client, { from, isBotAdmin, isGroup, messageStubParameters }) => {
	if (isGroup) {
		const data = readJSON('./databases/groups/settingsManager.json');
		const index = data.findIndex((v) => Object.keys(v)[0] === from);

		for (const participant of messageStubParameters) {
			const isBanned = data[index][from].banned.includes(participant);

			if (isBanned && isBotAdmin) {
				await client[botNum].sendMessage(from, {
					text: `You were adding someone who is banned from this group (@${
						participant.split('@')[0]
					}). Are you sure you want to add him?`,
					footer: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',
					buttons: [
						{ buttonId: `.kick ${participant.split('@')[0]}`, buttonText: { displayText: 'Kick.' }, type: 1 },
						{ buttonId: 'ID', buttonText: { displayText: 'Don not kick.' }, type: 1 },
					],
					headerType: 1,
					mentions: [participant],
				});
			}
		}
	}
};
