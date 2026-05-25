import path from 'path';
import parser from 'yargs-parser';

import configuration from '../../helper/config/connect.js';
import { removeBg } from '../../utils/converter/image.js';
import { color, loggers } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'removebg',
	minifiedDescription: 'Remove Background',
	description: 'Remove background from image.',
	usage: '!removebg `<reply/send (image/sticker)>`',
	aliases: ['rmbg', 'rbg', 'nobg'],
	category: 'Converter',
	cooldown: 5,
	limit: 4,
	status: 'enable',
	run: async (
		{ from, isMediaImage, isQuotedSticker, prettyNumber, extractMediaData, filename, message, query, typeQuoted },
		client
	) => {
		if (!isMediaImage && !isQuotedSticker) {
			return client.reply(
				from,
				'Please reply/send image with caption the command. This command also accept sticker (reply one with command).',
				message
			);
		}

		if (isQuotedSticker && extractMediaData.isAnimated) {
			return client.reply(from, 'The sticker are animated. Please reply static stickers only.', message);
		}

		loggers.warning(`${color('Removing Background image', 'pink')} ${color(prettyNumber, 'lilac')}`);

		const parsed = parser(query.toLowerCase(), {
			configuration: {
				'short-option-groups': false
			},
			alias: {
				isStickers: ['stk', 'stick', 'sticker', 'sticks', 'stc'],
				isImage: ['img', 'image', 'foto', 'images']
			}
		});

		const media = await client.downloadAndSaveMediaMessage(
			extractMediaData,
			path.join(__dirname, `src/media/temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`),
			typeQuoted
		);

		const resultRemoveBg = await removeBg(media, prettyNumber);

		if (parsed.isStickers) {
			const prepareSticker = await client.prepareSticker(resultRemoveBg, 'imageMessage', {
				author: configuration.author,
				packname: configuration.packname
			});

			client.send(from, { sticker: prepareSticker }, { quoted: message });
		} else {
			client.send(from, { image: resultRemoveBg }, { quoted: message });
		}
	}
});
