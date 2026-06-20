import { downloadMediaMessage } from 'baileys';
import fs from 'fs-extra';

import configuration from '../../helper/config/connect.js';
import { banGroupMember, getGroupSettings } from '../../helper/database/adapters/group-settings.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';
import prisma from '../../helper/database/prisma.js';
import { arq, delay } from '../../utils/index.js';

const { createReadStream, unlink } = fs;

const isAntiNsfwEnabled = (settings) => settings?.antiNSFW === 'enable' && !configuration.flags.onlyLogs;

const getMediaFilePath = (filename, extractMediaData) => {
	return `./tmp/${filename}.${extractMediaData.mimetype.split('/')[1]}`;
};

const getBannedMembers = async (from, settings) => {
	const cached = settings?.banned;

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
			const locale = await getLocale(from);
			const L = useLocale(locale, 'common');

			return await client.reply(from, L.core.errors.antiNsfwNotAdmin, message);
		}

		if (!isBanned) {
			const locale = await getLocale(from);
			const L = useLocale(locale, 'common');

			await client.reply(from, L.core.errors.antiNsfwWarning, message);
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
			await client.reply(from, L.core.errors.antiNsfwBanned, message);
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
	if (isBotAdmin && isMediaImage && isGroup && isAntiNsfwEnabled(settings)) {
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
