import dayjs from 'dayjs';
import path from 'path';
import parser from 'yargs-parser';

import configuration from '../../helper/config/connect.js';
import { color, INFOLOG } from '../../utils/modules/index.js';
import { removeBg } from '../../utils/converter/file-processing.js';

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'removebg',
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
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (!isMediaImage && !isQuotedSticker) {
			return client[botNum].reply(
				{ groupMetadata, from, quoted: message },
				'Please reply/send image with caption the command. This command also accept sticker (reply one with command).'
			);
		}

		if (isQuotedSticker && extractMediaData.isAnimated) {
			return client[botNum].reply(
				{ groupMetadata, from, quoted: message },
				'The sticker are animated. Please reply static stickers only.'
			);
		}

		INFOLOG(`[${color(time, 'cyan')}]`, `${color('Removing Background image', '#01cdfe')} ${color(prettyNumber, '#ff71ce')}`);

		const parsed = parser(query.toLowerCase(), {
			configuration: {
				'short-option-groups': false
			},
			alias: {
				isStickers: ['stk', 'stick', 'sticker', 'sticks', 'stc'],
				isImage: ['img', 'image', 'foto', 'images']
			}
		});

		const media = await client[botNum].downloadAndSaveMediaMessage(
			extractMediaData,
			path.join(__dirname, `src/media/temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`),
			typeQuoted
		);

		const resultRemoveBg = await removeBg(media, prettyNumber);

		if (parsed.isStickers) {
			const prepareSticker = await client[botNum].prepareSticker(
				resultRemoveBg,
				path.join(__dirname, `src/media/temporary_files/${filename}`),
				undefined,
				{
					author: configuration.author,
					packname: configuration.packname
				}
			);

			client[botNum].send(from, { sticker: prepareSticker }, { groupMetadata, quoted: message });
		} else {
			client[botNum].send(from, { image: resultRemoveBg }, { groupMetadata, quoted: message });
		}
	}
};
