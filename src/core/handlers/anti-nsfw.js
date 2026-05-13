import { downloadMediaMessage } from 'baileys';
import fs from 'fs-extra';
import path from 'path';

import configuration from '../../helper/config/connect.js';
import { banGroupMember, getGroupSettings } from '../../helper/database/adapters/group-settings.js';
import prisma from '../../helper/database/prisma.js';
import { arq, delay } from '../../utils/index.js';

const { createReadStream, unlink } = fs;

const isAntiNsfwEnabled = (settings, from) => {
	return settings?.[from]?.antiNSFW === 'enable' && !configuration.OPTIONS.onlyLogs;
};

const getMediaFilePath = (filename, extractMediaData) => {
	return path.join(__dirname, `src/media/temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`);
};

const getBannedMembers = async (from, settings) => {
	const cached = settings?.[from]?.banned;

	if (Array.isArray(cached)) {
		return cached;
	}

	const row = await getGroupSettings(prisma, from);

	return row?.banned ?? [];
};

const processNsfwImage = async ({ from, isAdmin, isBotAdmin, message, mediaData, sender, filePath, client, settings }) => {
	const media = await downloadMediaMessage(mediaData, 'buffer');

	await fs.writeFile(filePath, media);

	const check = await arq.isNsfw(createReadStream(filePath));
	const bannedMembers = await getBannedMembers(from, settings);
	const isBanned = bannedMembers.includes(sender);

	await unlink(filePath);

	if (isAdmin) {
		return await client.reply(from, JSON.stringify(check, undefined, 2), message);
	}

	if ((check.ok && (check.result.hentai > 65 || check.result.porn > 65)) || check.reesult.is_nsfw) {
		if (!isBotAdmin) {
			return await client.reply(from, 'Anti-NSFW is enabled, but I am not an admin, so I cannot kick you.', message);
		}

		if (!isBanned) {
			await client.reply(
				from,
				'Any kind of NSFW Images is Prohibited. This is a warning, you will be kicked if you continue to do this one more time.',
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

			if (Array.isArray(settings?.[from]?.banned) && !settings[from].banned.includes(sender)) {
				settings[from].banned.push(sender);
			}
		} else {
			await client.reply(
				from,
				'You have been banned from this group for NSFW Images. And you will be kicked in any second.',
				message
			);
			await delay(350);
			await client.groupParticipantsUpdate(from, [sender], 'remove');
		}
	}
};

const antiNSFWHandler = async (
	{ from, isAdmin, isGroup, isBotAdmin, message, mediaData, isMediaImage, sender, filename, extractMediaData },
	client,
	settings
) => {
	if (isBotAdmin && isMediaImage && isGroup && isAntiNsfwEnabled(settings, from)) {
		const filePath = getMediaFilePath(filename, extractMediaData);

		await processNsfwImage({
			from,
			isAdmin,
			isBotAdmin,
			message,
			mediaData,
			sender,
			filename,
			extractMediaData,
			filePath,
			client: client,
			settings
		});
	}
};

export default antiNSFWHandler;
