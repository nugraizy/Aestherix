import fs from 'fs-extra';

import configuration from '../../helper/config/connect.js';

const checkURL = (input) =>
	/(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])/g.test(input);

const handler = async (
	{ from, isAdmin, isGroup, isBotAdmin, message, mediaData, sender, isFromMe, body, isOwner, groupMetadata },
	client,
	settings
) => {
	if (isGroup && settings?.[from]?.antiURL === 'enable' && !isAdmin && isBotAdmin && !configuration.OPTIONS.onlyLogs) {
		const data = await fs.readJSON('./databases/groups/settingsManager.json');
		const index = data.findIndex((v) => Object.keys(v)[0] === from);
		const isBanned = data[index][from].banned.includes(sender);

		if (!checkURL(body)) {
			return;
		}

		if (isAdmin || isFromMe || isOwner) {
			return;
		}

		if (!isBotAdmin) {
			return await client[botNum].reply(
				{ groupMetadata, from, quoted: message },
				'Anti-URL is enabled, but i am not admin, so i cannot kick you.'
			);
		}

		if (!isBanned) {
			await client[botNum].reply(
				{ groupMetadata, from, quoted: message },
				'Anti-URL is enabled in this group. You will be kicked if you continue to do this one more time.'
			);
			await client[botNum].send(
				from,
				{
					delete: {
						remoteJid: from,
						participant: sender,
						id: mediaData.stanzaId
					}
				},
				{ groupMetadata }
			);
			data[index][from].banned.push(sender);
			await fs.writeJSON('./databases/groups/settingsManager.json', data);
		} else {
			await client[botNum].reply(
				{ groupMetadata, from, quoted: message },
				'You have been banned from this group for URL. And you will be kicked in any second.'
			);
			await client[botNum].groupParticipantsUpdate(from, [sender], 'remove');
		}
	}
};

const antiGroupLinkHandler = handler;

export default antiGroupLinkHandler;
