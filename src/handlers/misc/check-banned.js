import { getGroupSettings } from '../../helper/database/adapters/group-settings.js';
import prisma from '../../helper/database/prisma.js';

export const checkBan = async (client, { from, isBotAdmin, isGroup, messageStubParameters }) => {
	if (isGroup) {
		const row = await getGroupSettings(prisma, from);
		const bannedMembers = row?.banned ?? [];

		for (const participant of messageStubParameters) {
			const isBanned = bannedMembers.includes(participant);
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
