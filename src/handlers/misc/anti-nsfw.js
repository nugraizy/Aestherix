import { downloadMediaMessage } from '@adiwajshing/baileys';
import fs from 'fs-extra';
import path from 'path';

import configuration from '../../helper/config/connect.js';
import { arq, delay } from '../../utils/index.js';

const { createReadStream, unlink } = fs;

const isAntiNsfwEnabled = (settings, from) => {
	return settings?.[from]?.antiNSFW === 'enable' && !configuration.OPTIONS.onlyLogs;
};

const getMediaFilePath = (filename, extractMediaData) => {
	return path.join(__dirname, `src/media/temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`);
};

const processNsfwImage = async ({
	from,
	isAdmin,
	isBotAdmin,
	message,
	mediaData,
	sender,
	groupMetadata,
	filePath,
	client
}) => {
	const media = await downloadMediaMessage(mediaData, 'buffer');
	const data = await fs.readJSON('./databases/groups/settingsManager.json');
	const index = data.findIndex((v) => Object.keys(v)[0] === from);

	await fs.writeFile(filePath, media);

	const check = await arq.isNsfw(createReadStream(filePath));
	const isBanned = data?.[index]?.[from]?.banned?.includes(sender);

	await unlink(filePath);

	if (isAdmin) {
		return await client.reply(JSON.stringify(check, undefined, 2), { from, quoted: message, groupMetadata });
	}

	if ((check.ok && (check.result.hentai > 65 || check.result.porn > 65)) || check.reesult.is_nsfw) {
		if (!isBotAdmin) {
			return await client.reply('Anti-NSFW is enabled, but I am not an admin, so I cannot kick you.', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		if (!isBanned) {
			await client.reply(
				'Any kind of NSFW Images is Prohibited. This is a warning, you will be kicked if you continue to do this one more time.',
				{ from, quoted: message, groupMetadata }
			);
			await client.send(
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
			await client.reply('You have been banned from this group for NSFW Images. And you will be kicked in any second.', {
				from,
				quoted: message,
				groupMetadata
			});
			await delay(350);
			await client.groupParticipantsUpdate(from, [sender], 'remove');
		}
	}
};

const antiNSFWHandler = async (
	{ from, isAdmin, isGroup, isBotAdmin, message, mediaData, isMediaImage, sender, filename, extractMediaData, groupMetadata },
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
			groupMetadata,
			filePath,
			client: client[botNum]
		});
	}
};

export default antiNSFWHandler;
