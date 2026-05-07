import configuration from '../../helper/config/connect.js';
import { banGroupMember, getGroupSettings } from '../../helper/database/adapters/group-settings.js';
import prisma from '../../helper/database/prisma.js';

const checkURL = (input) =>
	/(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])/g.test(input);

const getBannedMembers = async (from, settings) => {
	const cached = settings?.[from]?.banned;

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
	if (isGroup && settings?.[from]?.antiURL === 'enable' && !isAdmin && isBotAdmin && !configuration.OPTIONS.onlyLogs) {
		const bannedMembers = await getBannedMembers(from, settings);
		const isBanned = bannedMembers.includes(sender);

		if (!checkURL(body)) {
			return;
		}

		if (isAdmin || isFromMe || isOwner) {
			return;
		}

		if (!isBotAdmin) {
			return await client.instance.reply(from, 'Anti-URL is enabled, but I am not an admin, so I cannot kick you.', message);
		}

		if (!isBanned) {
			await client.instance.reply(
				from,
				'Anti-URL is enabled in this group. You will be kicked if you continue to do this one more time.',
				message
			);
			await client.instance.send(from, {
				delete: {
					remoteJid: from,
					participant: sender,
					id: mediaData.stanzaId
				}
			});
			await banGroupMember(prisma, from, sender);
			if (Array.isArray(settings?.[from]?.banned) && !settings[from].banned.includes(sender)) {
				settings[from].banned.push(sender);
			}
		} else {
			await client.instance.reply(
				from,
				'You have been banned from this group for posting URLs. You will be kicked shortly.',
				message
			);
			await client.instance.groupParticipantsUpdate(from, [sender], 'remove');
		}
	}
};

export default antiGroupLinkHandler;
