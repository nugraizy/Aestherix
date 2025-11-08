import fs from 'fs-extra';

export const checkBan = async (client, { from, isBotAdmin, isGroup, messageStubParameters }) => {
	if (isGroup) {
		const data = await fs.readJSON('./databases/groups/settingsManager.json');
		const index = data.findIndex((v) => Object.keys(v)[0] === from);

		for (const participant of messageStubParameters) {
			const isBanned = data[index][from].banned.includes(participant);
			const bannedUserName = participant.split('@')[0];

			if (isBanned && isBotAdmin) {
				const kickMessage = `You were adding someone who is banned from this group (@${bannedUserName}). Are you sure you want to add them?`;
				const buttons = [
					{ buttonId: `.kick ${bannedUserName}`, buttonText: { displayText: 'Kick.' }, type: 1 },
					{ buttonId: 'ID', buttonText: { displayText: 'Dont kick.' }, type: 1 }
				];

				const messageOptions = {
					text: kickMessage,
					footer: 'Powered by Hidden Finder',
					buttons,
					headerType: 1,
					mentions: [participant]
				};

				await client.instance.send(from, messageOptions);
			}
		}
	}
};
