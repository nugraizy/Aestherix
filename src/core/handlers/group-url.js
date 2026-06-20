import configuration from '../../helper/config/connect.js';
import { banGroupMember, getGroupSettings } from '../../helper/database/adapters/group-settings.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';
import prisma from '../../helper/database/prisma.js';

const checkURL = (input) =>
	/(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])/g.test(input);

const getBannedMembers = async (from, settings) => {
	const cached = settings?.banned;

	if (Array.isArray(cached)) {
		return cached;
	}

	const row = await getGroupSettings(prisma, from);

	return row?.banned ?? [];
};

const antiGroupLinkHandler = async (
	{ from, isAdmin, isGroup, isBotAdmin, message, mediaData, sender, isFromMe, body, isOwner },
	client,
	settings
) => {
	if (isGroup && settings?.antiURL === 'enable' && !isAdmin && isBotAdmin && !configuration.flags.onlyLogs) {
		const bannedMembers = await getBannedMembers(from, settings);
		const isBanned = bannedMembers.includes(sender);

		if (!checkURL(body)) {
			return;
		}

		if (isAdmin || isFromMe || isOwner) {
			return;
		}

		if (!isBotAdmin) {
			const locale = await getLocale(from);
			const L = useLocale(locale, 'common');
			return await client.reply(from, L.core.errors.antiUrlNotAdmin, message);
		}

		if (!isBanned) {
			const locale = await getLocale(from);
			const L = useLocale(locale, 'common');
			await client.reply(
				from,
				L.core.errors.antiUrlBanned,
				message
			);
			await client.send(from, {
				delete: {
					remoteJid: from,
					participant: sender,
					id: mediaData.stanzaId
				}
			});
			await banGroupMember(prisma, from, sender);

			if (Array.isArray(settings?.banned) && !settings.banned.includes(sender)) {
				settings.banned.push(sender);
			}
		} else {
			const locale = await getLocale(from);
			const L = useLocale(locale, 'common');
			await client.reply(from, L.core.errors.antiUrlBanned, message);
			await client.groupParticipantsUpdate(from, [sender], 'remove');
		}
	}
};

export default antiGroupLinkHandler;
