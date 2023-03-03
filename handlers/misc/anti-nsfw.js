/* global botNum */
import { downloadMediaMessage } from '@adiwajshing/baileys';
import fs from 'fs-extra';
import path from 'path';

import configuration from '../../connect.js';
import { __dirname } from '../../index.js';
import { delay, readJSON, writeJSON } from '../../helper/index.js';
import { arq } from '../../utils/arq/index.js';

const { createReadStream, writeFile } = fs;

let antiNSFWHandler;
export default antiNSFWHandler = async (
	{ from, isAdmin, isGroup, isBotAdmin, message, mediaData, isMediaImage, sender, filename, extractMediaData },
	client,
	settings,
) => {
	if (isBotAdmin && isMediaImage && isGroup && settings?.[from]?.antiNSFW === 'enable' && !configuration.OPTIONS.onlyLogs) {
		const filePath = path.join(__dirname, `temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`);
		const media = await downloadMediaMessage(mediaData, 'buffer');

		await writeFile(filePath, media);
		const check = await arq.isNsfw(createReadStream(filePath));
		const data = readJSON('./databases/groups/settingsManager.json');
		const index = data.findIndex((v) => Object.keys(v)[0] === from);
		const isBanned = data[index][from].banned.includes(sender);

		if (isAdmin) {
			return await client[botNum].reply({ from, quoted: message }, JSON.stringify(check, undefined, 2));
		}

		if ((check.ok && (check.result.hentai > 65 || check.result.porn > 65)) || check.reesult.is_nsfw) {
			if (!isBotAdmin) {
				return await client[botNum].reply(
					{ from, quoted: message },
					'Anti-NSFW is enabled, but i am not admin, so i can not kick you.',
				); /* eslint-disable-line */
			}

			if (!isBanned) {
				await client[botNum].reply(
					{ from, quoted: message },
					'Any kind of NSFW Images is Prohibited. This is a warning, you will be kicked if you continue to do this one more time.',
				);
				await client[botNum].sendMessage(from, {
					delete: {
						remoteJid: from,
						participant: sender,
						id: mediaData.stanzaId,
					},
				});
				data[index][from].banned.push(sender);
				writeJSON('./databases/groups/settingsManager.json', data);
			} else {
				await client[botNum].reply(
					{ from, quoted: message },
					'You have been banned from this group for NSFW Images. And you will be kicked in any second.',
				); /* eslint-disable-line */
				await delay(350);
				await client[botNum].groupParticipantsUpdate(from, [sender], 'remove');
			}
		}
	}
};
