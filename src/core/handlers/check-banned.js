import { getGroupSettings } from '../../helper/database/adapters/group-settings.js';
import prisma from '../../helper/database/prisma.js';
import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { cmdId } from '../../helper/modules/prefix.js';

export const checkBan = async (client, { from, isBotAdmin, isGroup, messageStubParameters, prefix }) => {
	if (isGroup) {
		const row = await getGroupSettings(prisma, from);
		const bannedMembers = row?.banned ?? [];

		for (const participant of messageStubParameters) {
			const isBanned = bannedMembers.includes(participant);
			const bannedUserName = participant.split('@')[0];

			if (isBanned && isBotAdmin) {
				const locale = await getLocale(from);
				const L = useLocale(locale, 'common');
				const kickMessage = L.core.errors.bannedAddWarning.replace('{0}', bannedUserName);
				const buttons = [
					{ buttonId: cmdId('kick', bannedUserName, { prefix }), buttonText: { displayText: L.core.success.kick }, type: 1 },
					{ buttonId: 'ID', buttonText: { displayText: L.core.success.dontKick }, type: 1 }
				];

				const messageOptions = {
					text: kickMessage,
					footer: t(locale, 'common.core.dashboard.poweredBy', ['Hidden Finder']),
					buttons,
					headerType: 1,
					mentions: [participant]
				};

				await client.send(from, messageOptions);
			}
		}
	}
};
