import path from 'path';
import parser from 'yargs-parser';

import configuration from '../../helper/config/connect.js';
import { color, loggers } from '../../utils/modules/index.js';
import { removeBg } from '../../utils/converter/file-processing.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'removebg',
	minifiedDescription: 'Remove Background',
	description: 'Remove background from image.',
	usage: '!removebg <reply/send (image/sticker)>',
	aliases: ['rmbg', 'rbg', 'nobg'],
	category: 'Converter',
	cooldown: 5,
	limit: 4,
	status: 'enable',
	run: async (
		{
			from,
			isMediaImage,
			isQuotedSticker,
			prettyNumber,
			extractMediaData,
			filename,
			message,
			query,
			typeQuoted,
			groupMetadata
		},
		client
	) => {
		if (!isMediaImage && !isQuotedSticker) {
			return client.instance.reply(
				'Please reply/send image with caption the command. This command also accept sticker (reply one with command).',
				{ from, quoted: message, groupMetadata }
			);
		}

		if (isQuotedSticker && extractMediaData.isAnimated) {
			return client.instance.reply('The sticker are animated. Please reply static stickers only.', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		loggers.warning(`${color('Removing Background image', '#FF99C8')} ${color(prettyNumber, '#E4C1F9')}`);

		const parsed = parser(query.toLowerCase(), {
			configuration: {
				'short-option-groups': false
			},
			alias: {
				isStickers: ['stk', 'stick', 'sticker', 'sticks', 'stc'],
				isImage: ['img', 'image', 'foto', 'images']
			}
		});

		const media = await client.instance.downloadAndSaveMediaMessage(
			extractMediaData,
			path.join(__dirname, `src/media/temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`),
			typeQuoted
		);

		const resultRemoveBg = await removeBg(media, prettyNumber);

		if (parsed.isStickers) {
			const prepareSticker = await client.instance.prepareSticker(
				resultRemoveBg,
				path.join(__dirname, `src/media/temporary_files/${filename}`),
				undefined,
				{
					author: configuration.author,
					packname: configuration.packname
				}
			);

			client.instance.send(from, { sticker: prepareSticker }, { groupMetadata, quoted: message });
		} else {
			client.instance.send(from, { image: resultRemoveBg }, { groupMetadata, quoted: message });
		}
	}
};
